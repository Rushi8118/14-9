import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase, getSupabaseConfigStatus } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"
import { logger } from "@/lib/logger"
import {
  normalizeRoleSlug,
  isSuperAdmin as checkSuperAdmin,
  isAdminOrAbove,
  isStaffOrAbove as checkStaffOrAbove,
  canAccessAdmin as checkCanAccessAdmin,
  hasPermission as checkHasPermission,
  getPermissionsForRole,
  type RoleSlug,
  type PermissionSlug,
} from "@/lib/rbac"

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
  phone: string | null
  whatsapp: string | null
  gender: string | null
  nationality: string | null
  current_city: string | null
  current_country: string | null
  education_level: string | null
  field_of_study: string | null
  profile_photo_url: string | null
  onboarding_complete: boolean
  user_role: string
  role_id?: string | null
  status: "active" | "suspended" | "deleted"
  created_at: string
  updated_at: string
}

type AuthError = { message: string }

export type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  roleSlug: RoleSlug
  roles: RoleSlug[]
  permissions: string[]
  isSuperAdmin: boolean
  isAdmin: boolean
  isStaffOrAbove: boolean
  canAccessAdmin: boolean
  hasPermission: (permission: PermissionSlug) => boolean
  hasRole: (role: RoleSlug) => boolean
  signIn: (email: string, password: string) => Promise<{ data: unknown; error: AuthError | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: unknown; error: AuthError | null }>
  signInWithGoogle: () => Promise<{ data: unknown; error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: unknown; error: AuthError | null }>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Dedupes concurrent profile loads for the same user id. */
const profileLoadInflight = new Map<string, Promise<void>>()

async function fetchPermissions(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc("get_my_permissions")
    if (error) {
      logger.warn("get_my_permissions failed:", error.message)
      return []
    }
    return (data ?? []).map((row: { permission_slug: string }) => row.permission_slug)
  } catch (err) {
    logger.warn("Error fetching permissions:", err)
    return []
  }
}

async function fetchRoles(): Promise<RoleSlug[]> {
  try {
    const { data, error } = await supabase.rpc("get_user_roles")
    if (error) {
      logger.warn("get_user_roles failed:", error.message)
      return []
    }
    return (data ?? []).map((row: { role_slug: string }) => normalizeRoleSlug(row.role_slug))
  } catch (err) {
    logger.warn("Error fetching roles:", err)
    return []
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<RoleSlug[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string, userEmail: string, userMetadata?: Record<string, any>): Promise<UserProfile | null> => {
    const metaFullName = userMetadata?.full_name || userMetadata?.name || null
    const metaAvatar = userMetadata?.avatar_url || userMetadata?.picture || null
    const metaFirstName = userMetadata?.first_name || (metaFullName ? metaFullName.split(" ")[0] : null)
    const metaLastName = userMetadata?.last_name || (metaFullName && metaFullName.includes(" ") ? metaFullName.split(" ").slice(1).join(" ") : null)

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        // Do NOT invent a "user" role fallback — that falsely locks admins out of /admin.
        logger.error("Error fetching user profile:", error.message)
        return null
      }

      if (!data) {
        logger.warn("Profile not found in database, creating default customer profile.")
        try {
          const { data: insertedData, error: insertErr } = await supabase
            .from("user_profiles")
            .upsert({
              id: userId,
              email: userEmail,
              full_name: metaFullName,
              first_name: metaFirstName,
              last_name: metaLastName,
              profile_photo_url: metaAvatar,
              status: "active",
              user_role: "customer",
            })
            .select()
            .single()

          if (!insertErr && insertedData) {
            return insertedData as UserProfile
          }
          logger.warn("Profile insert failed:", insertErr?.message)
        } catch (insertErr) {
          logger.warn("Profile insert failed:", insertErr)
        }
        return null
      }

      // If existing profile is missing photo or name but Google has it, update on the fly
      if ((!data.full_name && metaFullName) || (!data.profile_photo_url && metaAvatar)) {
        try {
          const updates: Record<string, any> = {}
          if (!data.full_name && metaFullName) updates.full_name = metaFullName
          if (!data.profile_photo_url && metaAvatar) updates.profile_photo_url = metaAvatar
          await supabase.from("user_profiles").update(updates).eq("id", userId)
          return { ...data, ...updates } as UserProfile
        } catch {
          // ignore enrichment errors
        }
      }

      return data as UserProfile
    } catch (err) {
      logger.error("Unhandled error fetching profile:", err)
      return null
    }
  }, [])

  const loadUserContext = useCallback(async (currentUser: User) => {
    const existing = profileLoadInflight.get(currentUser.id)
    if (existing) return existing

    const task = (async () => {
      try {
        const userProfile = await fetchProfile(currentUser.id, currentUser.email ?? "", currentUser.user_metadata)
        if (userProfile) {
          setProfile(userProfile)
          setRoles([normalizeRoleSlug(userProfile.user_role)])
        } else {
          // Keep prior profile if refetch failed mid-session; otherwise leave null.
          setProfile((prev) => (prev?.id === currentUser.id ? prev : null))
        }

        const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T) =>
          Promise.race([
            promise,
            new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
          ])

        const [perms, userRoles] = await Promise.all([
          withTimeout(fetchPermissions().catch(() => [] as string[]), 4000, [] as string[]),
          withTimeout(fetchRoles().catch(() => [] as RoleSlug[]), 4000, [] as RoleSlug[]),
        ])

        setPermissions(perms)
        if (userRoles.length > 0) {
          setRoles(userRoles)
        } else if (userProfile) {
          setRoles([normalizeRoleSlug(userProfile.user_role)])
        }
      } catch (err) {
        logger.error("Error loading user context:", err)
        setPermissions([])
      } finally {
        profileLoadInflight.delete(currentUser.id)
      }
    })()

    profileLoadInflight.set(currentUser.id, task)
    return task
  }, [fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadUserContext(user)
  }, [user, loadUserContext])

  useEffect(() => {
    let mounted = true

    const hydrateFromSession = (nextUser: User | null) => {
      if (!mounted) return
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setPermissions([])
        setRoles([])
        setIsLoading(false)
        return
      }
      // Defer Supabase queries so we never await inside the auth lock
      // (awaiting here deadlocks supabase-js and causes profile hangs/timeouts).
      window.setTimeout(() => {
        if (!mounted) return
        void loadUserContext(nextUser).finally(() => {
          if (mounted) setIsLoading(false)
        })
      }, 0)
    }

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error) {
          logger.warn("getSession failed:", error.message)
          setIsLoading(false)
          return
        }
        hydrateFromSession(data.session?.user ?? null)
      } catch (err) {
        logger.error("Auth initialization failed:", err)
        if (mounted) setIsLoading(false)
      }
    }

    void initializeAuth()

    // IMPORTANT: keep this callback synchronous. Async work must be deferred.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
        setPermissions([])
        setRoles([])
        setIsLoading(false)
        return
      }

      if (event === "TOKEN_REFRESHED") {
        return
      }

      // INITIAL_SESSION / SIGNED_IN / USER_UPDATED
      hydrateFromSession(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user?.id) {
        window.setTimeout(() => {
          void import("@/lib/site-visit-tracker").then(({ markUserLogin }) => {
            void markUserLogin(session.user!.id)
          })
        }, 0)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserContext])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const status = getSupabaseConfigStatus()

      if (!status.ok) {
        return {
          data: null,
          error: {
            message:
              "Supabase is not configured. Add real VITE_SUPABASE_URL and publishable key in `.env.local`, then restart the dev server.",
          },
        }
      }

      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setIsLoading(false)
        logger.error("signIn failed:", error)
        // Record failed login attempts for the admin access log (best-effort).
        void import("@/lib/site-visit-tracker").then(({ markFailedLogin }) => {
          void markFailedLogin(email)
        })
        const msg = error.message || "Sign-in failed"
        if (/failed to fetch|network|resolve/i.test(msg)) {
          return {
            data: null,
            error: {
              message:
                "Cannot reach Supabase. Check your internet connection and that VITE_SUPABASE_URL is correct, then restart `pnpm dev`.",
            },
          }
        }
        return { data: null, error: { message: msg } }
      }

      if (data.user) {
        const { data: accountProfile } = await supabase
          .from('user_profiles')
          .select('status')
          .eq('id', data.user.id)
          .maybeSingle()
        if (accountProfile?.status === 'suspended' || accountProfile?.status === 'deleted') {
          await supabase.auth.signOut()
          setIsLoading(false)
          return {
            data: null,
            error: { message: 'This account is suspended or deleted. Contact an administrator.' },
          }
        }
        setUser(data.user)
        // Await profile/roles so LoginPage redirects with correct admin access.
        await loadUserContext(data.user)
        void import("@/lib/site-visit-tracker").then(({ markUserLogin }) => {
          void markUserLogin(data.user!.id)
        })
      }
      setIsLoading(false)
      return { data, error: null }
    } catch (err: unknown) {
      setIsLoading(false)
      logger.error("Unexpected signIn error:", err)
      const message = err instanceof Error ? err.message : "Unexpected sign-in error"
      if (/failed to fetch|network|invalid or missing|placeholder/i.test(message)) {
        return {
          data: null,
          error: {
            message:
              "Cannot reach Supabase auth. Fix `.env.local` (URL + publishable key) and restart the server without placeholder env vars.",
          },
        }
      }
      return { data: null, error: { message } }
    }
  }, [loadUserContext])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "user" },
        // Confirmation links land on the callback page, which finishes sign-in without a second code exchange.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (!error && data.user) {
      try {
        const { error: profileError } = await supabase.from("user_profiles").upsert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
        })
        if (profileError) {
          console.warn("On-demand profile upsert returned error (might already exist):", profileError.message)
        }
      } catch (e) {
        console.error("Fallback profile upsert failed:", e)
      }
    }

    return { data, error }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      return { data, error }
    } catch (err: any) {
      logger.error("signInWithGoogle error:", err)
      return { data: null, error: { message: err?.message || "Google sign-in failed" } }
    }
  }, [])

  const signOut = useCallback(async () => {
    // Capture id before clearing storage so we can write a logout interaction.
    const loggingOutUserId = user?.id
    try {
      if (loggingOutUserId) {
        const { markUserLogout } = await import("@/lib/site-visit-tracker")
        await markUserLogout(loggingOutUserId)
      }

      const { error } = await supabase.auth.signOut()
      if (error) {
        logger.error("Supabase signOut error:", error)
      }

      setUser(null)
      setProfile(null)
      setPermissions([])
      setRoles([])
      setIsLoading(false)

      // Only clear known app keys — never wipe entire localStorage (breaks other apps/tabs).
      try {
        localStorage.removeItem("svo_visit_session_id")
        sessionStorage.removeItem("svo_last_tracked_path")
      } catch {
        // ignore
      }

      toast.success("Successfully logged out.")
    } catch (err: unknown) {
      logger.error("Unexpected signOut error:", err)
      setUser(null)
      setProfile(null)
      setPermissions([])
      setRoles([])
      setIsLoading(false)
    }
  }, [user?.id])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { data: null, error: new Error("Not authenticated") }

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data as UserProfile)
    }
    return { data, error }
  }, [user])

  const roleSlug = normalizeRoleSlug(profile?.user_role)
  // Merge DB RPC permissions with role defaults so admin UI still works when
  // get_my_permissions is missing, empty, or times out.
  const effectivePermissions = Array.from(
    new Set([
      ...permissions,
      ...getPermissionsForRole(roleSlug),
      ...roles.flatMap((r) => getPermissionsForRole(r)),
    ]),
  )

  const accessFromProfile = checkCanAccessAdmin(profile?.user_role)
  const accessFromRoles = roles.some((r) => checkCanAccessAdmin(r))

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    roleSlug,
    roles,
    permissions: effectivePermissions,
    isSuperAdmin: checkSuperAdmin(profile?.user_role) || roles.some((r) => checkSuperAdmin(r)),
    isAdmin: isAdminOrAbove(profile?.user_role) || roles.some((r) => isAdminOrAbove(r)),
    isStaffOrAbove: checkStaffOrAbove(profile?.user_role) || roles.some((r) => checkStaffOrAbove(r)),
    canAccessAdmin: accessFromProfile || accessFromRoles,
    hasPermission: (permission: PermissionSlug) =>
      checkHasPermission(effectivePermissions, permission),
    hasRole: (role: RoleSlug) => roles.includes(role) || roleSlug === role,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
