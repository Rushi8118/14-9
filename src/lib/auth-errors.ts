export type AuthErrorContext = 'login' | 'register' | 'google'

export type FriendlyAuthError = {
  message: string
  /** Lets the form attach the message to a field or offer a follow-up link. */
  code: 'credentials' | 'unconfirmed' | 'duplicate' | 'rate_limit' | 'weak_password' | 'email' | 'network' | 'blocked' | 'cancelled' | 'unknown'
}

export const OFFLINE_ERROR: FriendlyAuthError = {
  code: 'network',
  message: "You appear to be offline. Check your internet connection and try again.",
}

/**
 * Turns Supabase/GoTrue error text into a message that is safe to show users.
 * Raw technical messages (config, endpoints, stack details) are never passed through.
 */
export function toFriendlyAuthError(rawMessage: string | undefined | null, context: AuthErrorContext): FriendlyAuthError {
  const message = (rawMessage ?? '').toLowerCase()

  if (/popup_closed|cancel/.test(message)) {
    return { code: 'cancelled', message: 'Google sign-in was cancelled before it finished.' }
  }
  if (/access_denied/.test(message)) {
    return { code: 'cancelled', message: 'Google sign-in needs your permission to continue.' }
  }
  if (/suspended|deleted/.test(message)) {
    return { code: 'blocked', message: 'This account is suspended or deleted. Please contact our team for help.' }
  }
  if (/invalid login credentials|invalid credentials|invalid grant/.test(message)) {
    return { code: 'credentials', message: 'The email or password you entered is incorrect.' }
  }
  if (/email not confirmed|not confirmed/.test(message)) {
    return {
      code: 'unconfirmed',
      message: 'Please confirm your email address first. Check your inbox for the verification link.',
    }
  }
  if (/already registered|already exists|already been registered|user_already_exists/.test(message)) {
    return { code: 'duplicate', message: 'An account with this email already exists.' }
  }
  if (/rate limit|too many|over_email_send_rate_limit|429/.test(message)) {
    return { code: 'rate_limit', message: 'Too many attempts. Please wait a minute and try again.' }
  }
  if (/password should|weak password|weak_password|password is too/.test(message)) {
    return { code: 'weak_password', message: "That password doesn't meet our security requirements. Please choose a stronger one." }
  }
  if (/invalid email|unable to validate email|email address .* invalid/.test(message)) {
    return { code: 'email', message: 'Please enter a valid email address.' }
  }
  if (/signups not allowed|signup is disabled/.test(message)) {
    return { code: 'blocked', message: 'New registrations are temporarily unavailable. Please contact our team.' }
  }
  if (/fetch|network|reach|timeout|configured|supabase|env|resolve/.test(message)) {
    return { code: 'network', message: "We couldn't reach our servers. Check your connection and try again." }
  }

  const fallback: Record<AuthErrorContext, string> = {
    login: "We couldn't sign you in. Please try again.",
    register: "We couldn't create your account. Please try again.",
    google: "Google sign-in didn't complete. Please try again.",
  }
  return { code: 'unknown', message: fallback[context] }
}
