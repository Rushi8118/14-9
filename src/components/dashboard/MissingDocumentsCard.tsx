import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, FileWarning, FileX2, Files } from 'lucide-react'
import type { DocumentRow } from '@/hooks/useDocuments'
import { SkeletonTable } from './SkeletonCard'
import InlineError from './InlineError'
import { StatusPill } from './StatusPill'

export default function MissingDocumentsCard({
  documents,
  isLoading,
  isError,
  onRetry,
}: {
  documents: DocumentRow[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const flagged = documents.filter((doc) => doc.status === 'Missing' || doc.status === 'Rejected')

  return (
    <section aria-labelledby="documents-attention-heading" className="desk-card flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Files className="h-[18px] w-[18px] text-[var(--desk-gold)]" aria-hidden="true" />
          <h2 id="documents-attention-heading" className="text-sm font-semibold text-[var(--desk-navy)]">
            Documents needing attention
          </h2>
        </div>
        {flagged.length > 0 && <StatusPill tone="warning">{flagged.length}</StatusPill>}
      </div>

      <div className="mt-4 flex-1">
        {isLoading ? (
          <SkeletonTable rows={2} />
        ) : isError ? (
          <InlineError title="We could not load your documents." onRetry={onRetry} />
        ) : flagged.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--desk-success)]" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--desk-navy)]">All documents are in order</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {flagged.slice(0, 3).map((doc) => {
              const rejected = doc.status === 'Rejected'
              const Icon = rejected ? FileX2 : FileWarning
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-surface-soft)] px-3 py-2.5"
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${rejected ? 'text-[var(--desk-danger)]' : 'text-[var(--desk-warning)]'}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--desk-navy)]" title={doc.name}>
                    {doc.name}
                  </span>
                  <StatusPill tone={rejected ? 'danger' : 'warning'}>{rejected ? 'Rejected' : 'Missing'}</StatusPill>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Link
        to="/dashboard/documents"
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-[#8a6a1a] hover:text-[var(--desk-navy)]"
      >
        View all documents
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
