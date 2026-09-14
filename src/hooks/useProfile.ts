import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth, UserProfile } from './use-auth'
import { toast } from 'sonner'

/** Thrown when re-authentication fails, so forms can flag the password field. */
export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Your current password is incorrect.')
    this.name = 'InvalidCurrentPasswordError'
  }
}

export function useProfile() {
  const { user, profile, updateProfile: updateAuthProfile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  async function verifyCurrentPassword(currentPassword?: string) {
    if (!currentPassword || !user?.email) return
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
    if (error) throw new InvalidCurrentPasswordError()
  }

  // 1. Update Profile Metadata Mutation
  const updateMetadataMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { data, error } = await updateAuthProfile(updates)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile', user?.id] })
      toast.success('Profile updated successfully.')
    },
    onError: () => {
      toast.error('We could not save your changes.', { description: 'Please try again.' })
    },
  })

  // 2. Upload Avatar Image Mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${fileExt}`
      const bucketName = 'profile-photos'

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(path)

      const { data, error: dbError } = await updateAuthProfile({ profile_photo_url: publicUrlData.publicUrl })
      if (dbError) throw dbError
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile', user?.id] })
      toast.success('Profile photo updated.')
    },
    onError: () => {
      toast.error('Unable to update your photo.', { description: 'Please try again.' })
    },
  })

  // 3. Update User Password Mutation (email/password accounts only)
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      await verifyCurrentPassword(currentPassword)
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Password updated successfully.')
    },
    onError: (err) => {
      if (err instanceof InvalidCurrentPasswordError) return
      toast.error('Unable to update your password.', { description: 'Please try again.' })
    },
  })

  // 4. Request an email change; Supabase sends confirmation links before it takes effect.
  const changeEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Confirmation email sent.', {
        description: 'Follow the links sent to your current and new addresses to finish the change.',
      })
    },
    onError: () => {
      toast.error('Unable to change your email.', { description: 'Please try again.' })
    },
  })

  // 5. Deactivate account: suspends access, keeps records.
  const deactivateAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      const { error } = await supabase.from('user_profiles').update({ status: 'suspended' }).eq('id', user.id)
      if (error) throw error
      await supabase.auth.signOut({ scope: 'global' })
    },
    onSuccess: () => {
      toast.success('Account deactivated.')
      navigate('/', { replace: true })
    },
    onError: () => {
      toast.error('Unable to deactivate your account.', { description: 'Please try again.' })
    },
  })

  // 6. Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async ({ currentPassword }: { currentPassword?: string } = {}) => {
      if (!user) return
      await verifyCurrentPassword(currentPassword)

      // Supabase admin deletion requires the service role, which is not safe on clients.
      // So we set status to 'deleted' and revoke every session. RLS blocks further access.
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: 'deleted' })
        .eq('id', user.id)

      if (error) throw error
      await supabase.auth.signOut({ scope: 'global' })
    },
    onSuccess: () => {
      toast.success('Your account has been deleted.')
      navigate('/', { replace: true })
    },
    onError: (err) => {
      if (err instanceof InvalidCurrentPasswordError) return
      toast.error('Unable to delete your account.', { description: 'Please try again.' })
    },
  })

  return {
    profile,
    updateProfile: updateMetadataMutation.mutate,
    updateProfileAsync: updateMetadataMutation.mutateAsync,
    updateLoading: updateMetadataMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutate,
    uploadLoading: uploadAvatarMutation.isPending,
    updatePasswordAsync: updatePasswordMutation.mutateAsync,
    passwordLoading: updatePasswordMutation.isPending,
    changeEmailAsync: changeEmailMutation.mutateAsync,
    changeEmailLoading: changeEmailMutation.isPending,
    deactivateAccountAsync: deactivateAccountMutation.mutateAsync,
    deactivateLoading: deactivateAccountMutation.isPending,
    deleteAccountAsync: deleteAccountMutation.mutateAsync,
    deleteLoading: deleteAccountMutation.isPending,
  }
}
