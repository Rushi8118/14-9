import { useCallback, useEffect, useState } from 'react'
import type { Factor } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

export type TotpEnrollment = { factorId: string; qrCode: string; secret: string }

/** Authenticator-app (TOTP) two-factor authentication via Supabase Auth MFA. */
export function useMfa() {
  const [factors, setFactors] = useState<Factor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase.auth.mfa.listFactors()
    setIsAvailable(!error)
    setFactors(error ? [] : data.totp)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const startEnrollment = useCallback(async (): Promise<TotpEnrollment> => {
    // Remove abandoned, unverified factors so a fresh enrolment does not collide with them.
    const { data: existing } = await supabase.auth.mfa.listFactors()
    for (const factor of existing?.all ?? []) {
      if (factor.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Authenticator app ${Date.now()}`,
    })
    if (error) throw error
    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
  }, [])

  const verifyEnrollment = useCallback(
    async (factorId: string, code: string) => {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const cancelEnrollment = useCallback(async (factorId: string) => {
    await supabase.auth.mfa.unenroll({ factorId })
  }, [])

  const disable = useCallback(
    async (factorId: string) => {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const verifiedFactors = factors.filter((factor) => factor.status === 'verified')

  return {
    verifiedFactors,
    isEnabled: verifiedFactors.length > 0,
    isLoading,
    isAvailable,
    startEnrollment,
    verifyEnrollment,
    cancelEnrollment,
    disable,
  }
}
