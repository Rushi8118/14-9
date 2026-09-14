import { sanitizeRichText } from '@/lib/security/sanitizeHtml'

type BlogContentProps = {
  html?: string
  content?: string
  className?: string
}

function parseMarkdown(text: string): string {
  if (!text) return ''
  if (text.includes('<p>') || text.includes('<h2>') || text.includes('<h3>')) {
    return text
  }
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-foreground mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-foreground mt-8 mb-3">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-4">')
}

/** Renders admin/AI-authored HTML or Markdown blog bodies with article
 *  typography. Content is sanitized here (in addition to at save time) so a
 *  compromised provider, a prompt-injected response, or a row written before
 *  server-side sanitization existed can never execute script in a reader's
 *  browser. */
export function BlogContent({ html, content, className = '' }: BlogContentProps) {
  const finalHtml = sanitizeRichText(parseMarkdown(html || content || ''))

  return (
    <div
      className={`blog-content max-w-none text-[15px] leading-7 text-muted-foreground
        [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground
        [&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground
        [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5
        [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5
        [&_li]:text-muted-foreground [&_strong]:text-foreground
        [&_table]:mt-6 [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:border [&_table]:border-border
        [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-foreground
        [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm
        [&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic
        ${className}`}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  )
}
