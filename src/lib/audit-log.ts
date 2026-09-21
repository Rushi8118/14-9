/**
 * Audit Log helper for recording user actions
 * Uses the write_audit_log RPC function on the backend
 */

import { supabase } from './supabase/client'
import { logger } from './logger'
import { getVisitSessionId, detectDeviceType, detectBrowser } from './site-visit-tracker'

type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role_changed'
  | 'user.suspended'
  | 'user.activated'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'permission.assigned'
  | 'permission.revoked'
  | 'application.created'
  | 'application.updated'
  | 'application.status_changed'
  | 'application.deleted'
  | 'application.assigned'
  | 'document.uploaded'
  | 'document.verified'
  | 'document.deleted'
  | 'payment.created'
  | 'payment.refunded'
  | 'settings.updated'
  | 'blog.created'
  | 'blog.published'
  | 'blog.unpublished'
  | 'blog.updated'
  | 'blog.deleted'
  | 'urgent_requirement.created'
  | 'urgent_requirement.updated'
  | 'urgent_requirement.published'
  | 'urgent_requirement.closed'
  | 'urgent_requirement.deleted'
  | 'ai.generate_content'
  | 'file.uploaded'
  | 'file.deleted'
  | 'export.csv'
  | 'customer.created'
  | 'customer.updated'
  | 'lead.created'
  | 'lead.updated'
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'login'
  | 'logout'
  | 'export'
  | 'system.config_change'
  | string

type Severity = 'info' | 'warning' | 'critical'

type AuditLogParams = {
  action: AuditAction
  resource: string
  resourceId?: string
  oldValue?: unknown
  newValue?: unknown
  severity?: Severity
  /** Idempotency key: a repeated write with the same requestId is treated
   *  as a retry of the same event, not a new one, by the RPC. */
  requestId?: string
  success?: boolean
  errorReason?: string
  /** Human-friendly change summary */
  summary?: string
}

/** Best-effort audit write: never throws, never blocks the caller's main
 *  request. Automatically attaches session id, current URL, referrer,
 *  device, and browser context. Never pass secrets in oldValue/newValue —
 *  the RPC stores them as-is. */
export async function writeAuditLog(params: AuditLogParams): Promise<string | null> {
  try {
    // 1. Dual-log to activity_logs so both "Audit Logs" and "Activity Logs" record the action
    try {
      const { logActivity } = await import('./activity-logger')
      logActivity('form_submit', params.action, `${params.resource}${params.resourceId ? ` #${params.resourceId.slice(0, 8)}` : ''}`, {
        resource: params.resource,
        resourceId: params.resourceId,
        oldValue: params.oldValue,
        newValue: params.newValue,
        summary: params.summary,
      })
    } catch {
      // ignore
    }

    // 2. Primary write via write_audit_log RPC
    const { data, error } = await supabase.rpc('write_audit_log', {
      p_action: params.action,
      p_resource: params.resource,
      p_resource_id: params.resourceId ?? null,
      p_old_value: params.oldValue ?? null,
      p_new_value: params.newValue ?? null,
      p_severity: params.severity ?? 'info',
      p_request_id: params.requestId ?? null,
      p_session_id: typeof window !== 'undefined' ? getVisitSessionId() : null,
      p_url: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : null,
      p_referrer: typeof document !== 'undefined' ? (document.referrer || null)?.slice(0, 500) : null,
      p_device_type: typeof window !== 'undefined' ? detectDeviceType() : null,
      p_browser: typeof window !== 'undefined' ? detectBrowser() : null,
      p_success: params.success ?? true,
      p_error_reason: params.errorReason ?? null,
    })

    if (error) {
      logger.warn('write_audit_log RPC failed:', error.message)
      // Resilient fallback: direct insert to audit_logs table
      try {
        const { data: insertData } = await supabase.from('audit_logs').insert({
          action: params.action,
          resource: params.resource,
          resource_id: params.resourceId ?? null,
          old_value: params.oldValue ?? null,
          new_value: params.newValue ?? null,
          severity: params.severity ?? 'info',
        }).select('id').maybeSingle()
        return (insertData as any)?.id ?? null
      } catch {
        return null
      }
    }

    return data as string
  } catch (err) {
    logger.warn('Error writing audit log:', err)
    return null
  }
}

export async function auditAction(
  action: AuditAction,
  resource: string,
  newValue?: unknown,
  oldValue?: unknown,
): Promise<void> {
  await writeAuditLog({
    action,
    resource,
    newValue,
    oldValue,
  })
}
