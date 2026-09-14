import { supabase } from '@/lib/supabase/client'
import { writeAuditLog } from '@/lib/audit-log'

export type AiProviderId = 'gemini' | 'openrouter'

export type AiProviderConfig = {
  activeProvider: AiProviderId
  geminiApiKey: string
  geminiModel: string
  openrouterApiKey: string
  openrouterModel: string
}

export type AiChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AiFeature = 'blog' | 'urgent_requirement' | 'country_eligibility'

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-001'

export function getActiveApiKey(config: AiProviderConfig): string {
  return config.activeProvider === 'gemini'
    ? config.geminiApiKey.trim()
    : config.openrouterApiKey.trim()
}

export function getActiveModel(config: AiProviderConfig): string {
  if (config.activeProvider === 'gemini') {
    return config.geminiModel.trim() || DEFAULT_GEMINI_MODEL
  }
  return config.openrouterModel.trim() || DEFAULT_OPENROUTER_MODEL
}

/**
 * Generates text via the `ai-generate` Supabase Edge Function.
 *
 * The provider API key never leaves the server: the browser only sends the
 * prompt plus which provider/model to prefer, and the edge function loads
 * the real secret itself (service-role read of `admin_ai_settings`) before
 * calling Gemini/OpenRouter. This intentionally does NOT call the provider
 * directly from the browser, even though `config` still carries the key
 * fields (used elsewhere to show "is a key configured?" state in the UI).
 */
export async function generateAiText(
  config: AiProviderConfig,
  messages: AiChatMessage[],
  feature: AiFeature,
): Promise<string> {
  // Single choke point for every AI generation call in the app, so this is
  // also the one place that needs to audit-log "AI generation requests".
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: {
      feature,
      provider: config.activeProvider,
      messages,
    },
  })

  if (error) {
    // supabase-js wraps non-2xx responses in a generic FunctionsHttpError;
    // try to recover the real server-provided message from the response body.
    const context = (error as { context?: Response }).context
    let message = error.message || 'AI generation failed. Please try again.'
    if (context && typeof context.json === 'function') {
      try {
        const body = await context.clone().json()
        if (body?.error) message = body.error
      } catch {
        // fall through to the generic message below
      }
    }
    void writeAuditLog({ action: 'ai.generate_content', resource: feature, severity: 'warning', success: false, errorReason: message.slice(0, 300) })
    throw new Error(message)
  }

  if (data?.error) {
    void writeAuditLog({ action: 'ai.generate_content', resource: feature, severity: 'warning', success: false, errorReason: String(data.error).slice(0, 300) })
    throw new Error(data.error)
  }
  const text = typeof data?.text === 'string' ? data.text.trim() : ''
  if (!text) {
    void writeAuditLog({ action: 'ai.generate_content', resource: feature, severity: 'warning', success: false, errorReason: 'Empty response' })
    throw new Error('The AI provider returned an empty response.')
  }
  void writeAuditLog({ action: 'ai.generate_content', resource: feature, newValue: { provider: data?.provider || config.activeProvider, model: data?.model } })
  return text
}

export const PROVIDER_PRESETS: Record<
  AiProviderId,
  { label: string; models: string[]; docsUrl: string }
> = {
  gemini: {
    label: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    docsUrl: 'https://aistudio.google.com/apikey',
  },
  openrouter: {
    label: 'OpenRouter',
    models: [
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.1-70b-instruct',
    ],
    docsUrl: 'https://openrouter.ai/keys',
  },
}
