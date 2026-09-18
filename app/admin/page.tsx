"use client"

import { type ElementType, type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Database,
  Globe2,
  Lock,
  LogOut,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  ArrowRight,
  Send,
  Archive,
  AlertTriangle,
  RotateCw,
  UserPlus,
  XCircle,
  FileUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type AdminData = {
  metrics: Record<string, number>
  users: any[]
  consultations: any[]
  applications: any[]
  countries: any[]
  programs: any[]
  notifications: any[]
  officers: any[]
}

const emptyData: AdminData = {
  metrics: {},
  users: [],
  consultations: [],
  applications: [],
  countries: [],
  programs: [],
  notifications: [],
  officers: [],
}

const consultationStatuses = ["requested", "scheduled", "confirmed", "completed", "cancelled", "no_show"]
const applicationStatuses = ["draft", "submitted", "under_review", "approved", "rejected", "withdrawn"]
const priorities = ["low", "normal", "high", "urgent"]
const userStatuses = ["active", "suspended", "deleted"]
const userRoles = ["user", "consultant", "admin"]

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingKey, setSavingKey] = useState("")
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin")
  const [query, setQuery] = useState("")
  const [data, setData] = useState<AdminData>(emptyData)

  useEffect(() => {
    async function checkSession() {
      const response = await fetch("/api/admin/session/", { cache: "no-store" })
      const payload = await response.json().catch(() => ({ authenticated: false }))
      setAuthenticated(Boolean(payload.authenticated))
      setCheckingSession(false)
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (authenticated) {
      loadData()
    }
  }, [authenticated])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredConsultations = useMemo(() => {
    if (!normalizedQuery) return data.consultations

    return data.consultations.filter((item) =>
      [
        item.user?.full_name,
        item.user?.email,
        item.phone_number,
        item.preferred_country,
        item.visa_category,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [data.consultations, normalizedQuery])

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return data.users

    return data.users.filter((item) =>
      [item.full_name, item.email, item.phone, item.whatsapp, item.status, item.user_role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [data.users, normalizedQuery])

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/data/", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(payload.error || "Failed to load admin data")
        if (response.status === 401) setAuthenticated(false)
        setLoading(false)
        return
      }

      try {
        const officersRes = await fetch("/api/admin/officers/")
        const officersData = await officersRes.json().catch(() => ({ officers: [] }))
        setData({ ...payload, officers: officersData.officers || [] })
      } catch {
        setData(payload)
      }
    } catch {
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  async function manageApplication(applicationId: string, action: string, reason?: string) {
    try {
      const response = await fetch(`/api/applications/${applicationId}/action/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Action failed")
      }
      toast.success(`Application ${action} successfully`)
      await loadData()
    } catch (err: any) {
      toast.error(err?.message || "Action failed")
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch("/api/admin/login/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const payload = await response.json().catch(() => ({}))
    setLoading(false)

    if (!response.ok) {
      toast.error(payload.error || "Admin login failed")
      return
    }

    setAuthenticated(true)
    toast.success("Admin signed in")
  }

  async function logout() {
    await fetch("/api/admin/logout/", { method: "POST" })
    setAuthenticated(false)
    setData(emptyData)
  }

  async function updateResource(resource: string, id: string, updates: Record<string, unknown>) {
    const key = `${resource}:${id}:${Object.keys(updates).join(",")}`
    setSavingKey(key)

    try {
      const response = await fetch("/api/admin/update/", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resource, id, updates }),
      })
      const payload = await response.json().catch(() => ({}))
      setSavingKey("")

      if (!response.ok) {
        toast.error(payload.error || "Update failed")
        return
      }

      toast.success("Updated")
      await loadData()
    } catch (err: any) {
      setSavingKey("")
      toast.error(err?.message || "Update failed")
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/70 p-6 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Secure operations dashboard</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-id">Admin ID</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-id"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">Admin Panel</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Siddhivinayak Overseas operations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="rounded-full">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
          <MetricCard icon={Users} label="Users" value={data.metrics.users} />
          <MetricCard icon={Calendar} label="Consultations" value={data.metrics.consultations} accent="text-emerald-500" />
          <MetricCard icon={CheckCircle2} label="Active Calls" value={data.metrics.activeConsultations} accent="text-sky-500" />
          <MetricCard icon={Briefcase} label="Applications" value={data.metrics.applications} accent="text-amber-500" />
          <MetricCard icon={Globe2} label="Countries" value={data.metrics.countries} accent="text-violet-500" />
          <MetricCard icon={Database} label="Programs" value={data.metrics.programs} accent="text-rose-500" />
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Control Center</h2>
            <p className="text-sm text-muted-foreground">Review users, enquiries, applications, countries, programs, and notifications.</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users or enquiries"
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="consultations" className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 lg:grid-cols-6">
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="consultations">
            <AdminSection
              title="Consultation Enquiries"
              description="Every dashboard/contact enquiry with applicant details and selected pathway."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Pathway</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow Up</TableHead>
                    <TableHead>Admin Notes</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="min-w-[220px]">
                          <p className="font-medium text-foreground">{item.user?.full_name || item.user_notes?.contact_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{item.user?.email || item.user_notes?.contact_email || "No email"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.user_notes?.current_role_or_field || item.user_notes?.message || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[220px]">
                          <Badge variant="outline">{item.consultation_type?.replace("_", " ")}</Badge>
                          <p className="mt-2 text-sm text-foreground">{item.preferred_country || "Not selected"}</p>
                          <p className="text-xs text-muted-foreground">{item.visa_category || "No category"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[160px] text-sm">
                          <p>{item.phone_number || item.user?.phone || "-"}</p>
                          <p className="text-xs text-muted-foreground">{item.whatsapp_number || item.user?.whatsapp || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={item.status}
                          options={consultationStatuses}
                          disabled={savingKey.startsWith(`consultations:${item.id}`)}
                          onChange={(status) => updateResource("consultations", item.id, { status })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[190px] space-y-2">
                          <InlineSwitch
                            label="Needed"
                            checked={Boolean(item.follow_up_needed)}
                            disabled={savingKey.startsWith(`consultations:${item.id}`)}
                            onChange={(follow_up_needed) =>
                              updateResource("consultations", item.id, { follow_up_needed })
                            }
                          />
                          <Input
                            type="date"
                            value={toDateInput(item.follow_up_date)}
                            onChange={(event) =>
                              updateResource("consultations", item.id, {
                                follow_up_date: event.target.value || null,
                              })
                            }
                            disabled={savingKey.startsWith(`consultations:${item.id}`)}
                            className="h-9 bg-background"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <TextSave
                          value={item.consultant_notes || ""}
                          placeholder="Internal consultation notes"
                          disabled={savingKey.startsWith(`consultations:${item.id}`)}
                          onSave={(consultant_notes) =>
                            updateResource("consultations", item.id, { consultant_notes })
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredConsultations.length === 0 && (
                    <EmptyRow colSpan={7} label="No consultation enquiries found." />
                  )}
                </TableBody>
              </Table>
            </AdminSection>
          </TabsContent>

          <TabsContent value="users">
            <AdminSection title="Users" description="Registered user profiles and role/status controls.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="min-w-[240px]">
                          <p className="font-medium text-foreground">{item.full_name || "Unnamed user"}</p>
                          <p className="text-xs text-muted-foreground">{item.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.phone || "-"}</p>
                        <p className="text-xs text-muted-foreground">{item.whatsapp || ""}</p>
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={item.user_role}
                          options={userRoles}
                          disabled={savingKey.startsWith(`users:${item.id}`)}
                          onChange={(user_role) => updateResource("users", item.id, { user_role })}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSelect
                          value={item.status}
                          options={userStatuses}
                          disabled={savingKey.startsWith(`users:${item.id}`)}
                          onChange={(status) => updateResource("users", item.id, { status })}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && <EmptyRow colSpan={5} label="No users found." />}
                </TableBody>
              </Table>
            </AdminSection>
          </TabsContent>

          <TabsContent value="applications">
            <AdminSection title="Applications" description="Application records and review status controls.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Country / Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.applications.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link href={`/applications/${item.id}`}>
                          <p className="font-medium text-primary underline">{item.application_id || item.id.slice(0, 8)}</p>
                        </Link>
                        <Badge variant="outline">{item.application_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.user?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{item.user?.email || ""}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.country?.name || "-"}</p>
                        <p className="text-xs text-muted-foreground">{item.program?.name || ""}</p>
                      </TableCell>
                      <TableCell>
                        <select
                          value={item.status}
                          onChange={(e) => updateResource("applications", item.id, { status: e.target.value })}
                          className="rounded border border-border bg-background px-1 py-0.5 text-sm"
                        >
                          {applicationStatuses.map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <select
                          value={item.priority || "normal"}
                          onChange={(e) => updateResource("applications", item.id, { priority: e.target.value })}
                          className="rounded border border-border bg-background px-1 py-0.5 text-sm"
                        >
                          {priorities.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <select
                          value={item.assigned_consultant || ""}
                          onChange={(e) => updateResource("applications", item.id, { assigned_consultant: e.target.value || null })}
                          className="rounded border border-border bg-background px-1 py-0.5 text-sm"
                        >
                          <option value="">Unassigned</option>
                          {data.officers.map((officer: any) => (
                            <option key={officer.id} value={officer.id}>{officer.full_name}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => manageApplication(item.id, "approve")}
                            disabled={item.status === "approved"}
                            className="h-7 px-1.5 text-xs"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => manageApplication(item.id, "reject", "Application rejected by admin")}
                            disabled={item.status === "rejected"}
                            className="h-7 px-1.5 text-xs"
                            title="Reject"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => manageApplication(item.id, "return_for_corrections", "Returned for corrections")}
                            className="h-7 px-1.5 text-xs"
                            title="Return for corrections"
                          >
                            <RotateCw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => manageApplication(item.id, "request_documents")}
                            className="h-7 px-1.5 text-xs"
                            title="Request documents"
                          >
                            <FileUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => manageApplication(item.id, "archive")}
                            className="h-7 px-1.5 text-xs"
                            title="Archive"
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <textarea
                          value={item.consultant_notes || ""}
                          onChange={(e) => updateResource("applications", item.id, { consultant_notes: e.target.value })}
                          className="w-full rounded border border-border bg-background px-1 py-0.5 text-sm"
                          rows={2}
                          placeholder="Internal notes"
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {data.applications.length === 0 && <EmptyRow colSpan={9} label="No applications found." />}
                </TableBody>
              </Table>
            </AdminSection>
          </TabsContent>

          <TabsContent value="countries">
            <AdminSection title="Countries" description="Public destination status and ordering.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.countries.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.flag_emoji} {item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.code} / {item.slug}</p>
                      </TableCell>
                      <TableCell>{item.region || "-"}</TableCell>
                      <TableCell>
                        <InlineSwitch
                          label={item.is_active ? "Active" : "Inactive"}
                          checked={Boolean(item.is_active)}
                          disabled={savingKey.startsWith(`countries:${item.id}`)}
                          onChange={(is_active) => updateResource("countries", item.id, { is_active })}
                        />
                      </TableCell>
                      <TableCell>
                        <NumberSave
                          value={item.sort_order ?? 0}
                          disabled={savingKey.startsWith(`countries:${item.id}`)}
                          onSave={(sort_order) => updateResource("countries", item.id, { sort_order })}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.updated_at)}</TableCell>
                    </TableRow>
                  ))}
                  {data.countries.length === 0 && <EmptyRow colSpan={5} label="No countries found." />}
                </TableBody>
              </Table>
            </AdminSection>
          </TabsContent>

          <TabsContent value="programs">
            <AdminSection title="Visa Programs" description="Program availability and featured controls.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.programs.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.slug}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.program_type}</Badge></TableCell>
                      <TableCell>
                        <InlineSwitch
                          label={item.is_active ? "Active" : "Inactive"}
                          checked={Boolean(item.is_active)}
                          disabled={savingKey.startsWith(`programs:${item.id}`)}
                          onChange={(is_active) => updateResource("programs", item.id, { is_active })}
                        />
                      </TableCell>
                      <TableCell>
                        <InlineSwitch
                          label={item.is_featured ? "Featured" : "Hidden"}
                          checked={Boolean(item.is_featured)}
                          disabled={savingKey.startsWith(`programs:${item.id}`)}
                          onChange={(is_featured) => updateResource("programs", item.id, { is_featured })}
                        />
                      </TableCell>
                      <TableCell>
                        <NumberSave
                          value={item.sort_order ?? 0}
                          disabled={savingKey.startsWith(`programs:${item.id}`)}
                          onSave={(sort_order) => updateResource("programs", item.id, { sort_order })}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.updated_at)}</TableCell>
                    </TableRow>
                  ))}
                  {data.programs.length === 0 && <EmptyRow colSpan={6} label="No visa programs found." />}
                </TableBody>
              </Table>
            </AdminSection>
          </TabsContent>

          <TabsContent value="notifications">
            <AdminSection title="Notifications" description="Recent user notifications.">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.notifications.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.title}</p>
                        <p className="max-w-xl whitespace-normal text-xs text-muted-foreground">{item.message || ""}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                      <TableCell>
                        <InlineSwitch
                          label={item.is_read ? "Read" : "Unread"}
                          checked={Boolean(item.is_read)}
                          disabled={savingKey.startsWith(`notifications:${item.id}`)}
                          onChange={(is_read) => updateResource("notifications", item.id, { is_read })}
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {data.notifications.length === 0 && <EmptyRow colSpan={4} label="No notifications found." />}
                </TableBody>
              </Table>
            </AdminSection>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent = "text-primary",
}: {
  icon: ElementType
  label: string
  value?: number
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <Icon className={`mb-2 h-5 w-5 ${accent}`} />
      <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function AdminSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/50 p-4 md:p-6">
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function InlineSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-9 min-w-[130px] bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option.replaceAll("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function InlineSwitch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex min-w-[120px] items-center gap-2 text-sm text-foreground">
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
      <span>{label}</span>
    </label>
  )
}

function TextSave({
  value,
  placeholder,
  onSave,
  disabled,
}: {
  value: string
  placeholder: string
  onSave: (value: string | null) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  return (
    <div className="min-w-[260px] space-y-2">
      <Textarea
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        className="min-h-20 bg-background text-sm"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || draft === value}
        onClick={() => onSave(draft.trim() || null)}
        className="h-8 rounded-full"
      >
        <Save className="mr-2 h-3.5 w-3.5" />
        Save
      </Button>
    </div>
  )
}

function NumberSave({
  value,
  onSave,
  disabled,
}: {
  value: number
  onSave: (value: number) => void
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const trimmedDraft = draft.trim()
  const parsedValue = Number(trimmedDraft)
  const canSave = trimmedDraft !== "" && Number.isFinite(parsedValue) && parsedValue !== value

  return (
    <div className="flex min-w-[140px] items-center gap-2">
      <Input
        type="number"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        className="h-9 bg-background"
      />
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={disabled || !canSave}
        onClick={() => onSave(parsedValue)}
        className="h-9 w-9 rounded-full"
      >
        <Save className="h-4 w-4" />
      </Button>
    </div>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )
}

function toDateInput(value?: string | null) {
  if (!value) return ""

  return value.slice(0, 10)
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
