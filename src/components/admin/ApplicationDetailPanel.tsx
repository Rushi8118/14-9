import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Check, ClipboardList, Download, Lock, MessageCircle, MoreHorizontal,
  Printer, Send, UserRound, X,
} from 'lucide-react'
import {
  type DetailData, type Officer, type MessageVisibility, type ApplicationMessage,
  STATUSES, PRIORITIES, CASE_STATUSES, statusVariant, caseStatusVariant,
  pretty, dateText, extractApplicantMessage,
} from '@/pages/admin/applications.types'

type EditForm = { status: string; priority: string; officerId: string; notes: string; fullName: string; phone: string }

type Props = {
  detail: DetailData
  officers: Officer[]
  canUpdate: boolean
  canProcess: boolean
  onSave: (values: EditForm) => Promise<void>
  onAction: (name: string, value?: string) => void
  /** Lets the parent (which owns the Sheet/modal) warn before closing while edits are unsaved. */
  onDirtyChange?: (dirty: boolean) => void
  /** Called after a reply/note is posted so the parent can refetch the detail query. */
  onMessageSent?: () => void
}

function buildForm(app: DetailData['application']): EditForm {
  const info = app.personal_info || {}
  return {
    status: app.status || 'draft',
    priority: app.priority || 'normal',
    officerId: app.assigned_consultant || '',
    notes: app.consultant_notes || '',
    fullName: info.full_name || app.applicant?.full_name || '',
    phone: info.phone || app.applicant?.phone || '',
  }
}

function formsEqual(a: EditForm, b: EditForm) {
  return a.status === b.status && a.priority === b.priority && a.officerId === b.officerId
    && a.notes === b.notes && a.fullName === b.fullName && a.phone === b.phone
}

export function ApplicationDetailPanel({ detail, officers, canUpdate, canProcess, onSave, onAction, onDirtyChange, onMessageSent }: Props) {
  const app = detail.application
  const info = app.personal_info || {}
  const isEnquiry = Boolean(app.application_id?.startsWith('ENQ-') || app.meta?.source === 'consultations')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const original = useMemo(() => buildForm(app), [app])
  const [form, setForm] = useState<EditForm>(original)
  const [discardOpen, setDiscardOpen] = useState(false)

  useEffect(() => { setForm(original); setEditing(false) }, [original])

  const dirty = editing && !formsEqual(form, original)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

  const startEditing = () => setEditing(true)
  const requestCancelEdit = () => {
    if (dirty) setDiscardOpen(true)
    else setEditing(false)
  }
  const confirmDiscard = () => { setForm(original); setEditing(false); setDiscardOpen(false) }

  const save = async () => {
    if (!form.fullName.trim()) { toast.error('Applicant name cannot be empty.'); return }
    setSaving(true)
    try {
      await onSave(form)
      setEditing(false)
    } catch {
      // onSave already surfaces a toast; keep the form open so edits aren't lost.
    } finally {
      setSaving(false)
    }
  }

  const applicantMessage = extractApplicantMessage(info) ?? extractApplicantMessage(app.meta)
  const messages = detail.messages ?? []
  const publicReplies = messages.filter((m) => m.visibility === 'public')
  const internalNotes = messages.filter((m) => m.visibility === 'internal')

  return (
    <div className="px-4 pb-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={app.status} variant={statusVariant(app.status)} />
          <span className="rounded-full bg-muted px-2 py-1 text-xs">{pretty(app.priority)} priority</span>
          <span className="rounded-full bg-muted px-2 py-1 text-xs">{pretty(app.application_type)}</span>
          {isEnquiry ? (
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">Enquiry record</span>
          ) : (
            <CaseStatusControl
              status={app.case_status || 'open'}
              canUpdate={canUpdate}
              onChange={(status) => onAction('set_case_status', status)}
            />
          )}
        </div>
        {canUpdate && (
          <Button size="sm" variant={editing ? 'outline' : 'default'} onClick={editing ? requestCancelEdit : startEditing}>
            {editing ? 'Cancel' : 'Edit details'}
          </Button>
        )}
      </div>

      {editing && (
        <div className="mb-5 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="edit-fullname">Applicant full name</label>
            <Input id="edit-fullname" aria-label="Applicant full name" value={form.fullName} onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))} placeholder="Applicant full name" required />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="edit-phone">Phone</label>
            <Input id="edit-phone" aria-label="Applicant phone" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} placeholder="Phone" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={form.status} onValueChange={(value) => setForm((c) => ({ ...c, status: value }))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>{STATUSES.map((value) => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <Select value={form.priority} onValueChange={(value) => setForm((c) => ({ ...c, priority: value }))}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((value) => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Assigned officer</label>
            <Select value={form.officerId || 'unassigned'} onValueChange={(value) => setForm((c) => ({ ...c, officerId: value === 'unassigned' ? '' : value }))}>
              <SelectTrigger><SelectValue placeholder="Assigned officer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {officers.map((officer) => <SelectItem key={officer.id} value={officer.id}>{officer.full_name || officer.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="edit-notes">Internal notes (staff only)</label>
            <Textarea id="edit-notes" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Internal notes — never shown to the applicant" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button onClick={() => void save()} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save changes'}</Button>
            {!dirty && <span className="text-xs text-muted-foreground">No changes to save.</span>}
          </div>
        </div>
      )}

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>You have edits that haven't been saved. If you leave now, they will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>Discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-5 flex flex-wrap gap-2">
        {canProcess && (
          <>
            <Button size="sm" onClick={() => onAction('approve')}><Check className="mr-1 h-4 w-4" />Approve</Button>
            <Button size="sm" variant="outline" onClick={() => onAction('request_documents')}><ClipboardList className="mr-1 h-4 w-4" />Request documents</Button>
            <Button size="sm" variant="outline" onClick={() => onAction('reject')}><X className="mr-1 h-4 w-4" />Reject</Button>
          </>
        )}
        {canUpdate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><MoreHorizontal className="mr-1 h-4 w-4" />More</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAction('change_priority', 'high')}>Set high priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction('duplicate')}>Duplicate application</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="conversation">
            Conversation{messages.length > 0 && <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">{messages.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Section title="Applicant profile">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3"><UserRound className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="font-medium">{app.applicant?.full_name || app.user_profile_full_name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{app.applicant?.email || app.user_profile_email}</p>
                <p className="text-sm text-muted-foreground">{app.applicant?.phone || 'No phone provided'}</p>
              </div>
            </div>
          </Section>
          <Section title="Application message">
            {applicantMessage ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{applicantMessage}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No free-text message was submitted with this {isEnquiry ? 'enquiry' : 'application'}.</p>
            )}
          </Section>
          <Section title="Internal notes" icon={<Lock className="h-3.5 w-3.5" />}>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{app.consultant_notes || 'No internal notes yet.'}</p>
          </Section>
        </TabsContent>

        <TabsContent value="personal">
          <DataGrid data={{
            'Full name': info.full_name || app.applicant?.full_name,
            'Date of birth': info.date_of_birth,
            Nationality: info.nationality || app.applicant?.nationality,
            Passport: info.passport_number,
            Contact: info.phone || app.applicant?.phone,
            Address: info.address,
          }} />
        </TabsContent>

        <TabsContent value="application">
          <DataGrid data={{
            Category: app.visa_program?.name,
            'Travel purpose': info.travel_purpose,
            'Travel dates': info.travel_dates,
            Education: JSON.stringify(app.education_history || []),
            Employment: JSON.stringify(app.work_history || []),
            'Visa history': info.visa_history,
          }} />
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-2">
            {detail.documents.length ? detail.documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{document.name}</p>
                  <p className="text-xs text-muted-foreground">{document.file_type || 'File'} · {dateText(document.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{document.status}</span>
                  <Button
                    size="icon" variant="ghost" aria-label="Download document"
                    onClick={() => void supabase.storage.from('documents').createSignedUrl(document.file_path, 300).then(({ data, error }) => error ? toast.error(error.message) : data?.signedUrl && window.open(data.signedUrl, '_blank'))}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : <Empty title="No documents" description="No documents have been uploaded for this application." />}
          </div>
        </TabsContent>

        <TabsContent value="conversation">
          <ConversationTab
            applicationId={app.id}
            publicReplies={publicReplies}
            internalNotes={internalNotes}
            canReply={canProcess || canUpdate}
            disabled={isEnquiry}
            onMessageSent={onMessageSent}
          />
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-3">
            {detail.activity.length ? detail.activity.map((item) => (
              <div key={item.id} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm font-medium">{pretty(item.action)}</p>
                <p className="text-xs text-muted-foreground">
                  {item.actor_name || item.actor_email || 'System'} · {dateText(item.created_at)}
                </p>
                {item.reason && <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>}
              </div>
            )) : <Empty title="No review history" description="Actions will appear here as the application is processed." />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CaseStatusControl({ status, canUpdate, onChange }: { status: string; canUpdate: boolean; onChange: (status: string) => void }) {
  const [confirming, setConfirming] = useState<string | null>(null)
  if (!canUpdate) return <StatusBadge status={status} variant={caseStatusVariant(status)} />

  const requestChange = (value: string) => {
    if (value === status) return
    if (value === 'resolved' || value === 'closed') setConfirming(value)
    else onChange(value)
  }

  return (
    <>
      <Select value={status} onValueChange={requestChange}>
        <SelectTrigger className="h-7 w-auto min-w-[9.5rem] gap-1 border-none bg-transparent px-0 text-xs shadow-none focus:ring-0">
          <SelectValue>
            <StatusBadge status={status} variant={caseStatusVariant(status)} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CASE_STATUSES.map((value) => <SelectItem key={value} value={value}>{pretty(value)}</SelectItem>)}
        </SelectContent>
      </Select>
      <AlertDialog open={!!confirming} onOpenChange={(open) => { if (!open) setConfirming(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark case as {confirming ? pretty(confirming) : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This tells the team the conversation is {confirming === 'closed' ? 'closed and no further action is expected' : 'resolved'}. You can reopen it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirming) onChange(confirming); setConfirming(null) }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ConversationTab({
  applicationId, publicReplies, internalNotes, canReply, disabled, onMessageSent,
}: {
  applicationId: string
  publicReplies: ApplicationMessage[]
  internalNotes: ApplicationMessage[]
  canReply: boolean
  disabled: boolean
  onMessageSent?: () => void
}) {
  const timeline = useMemo(
    () => [...publicReplies, ...internalNotes].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [publicReplies, internalNotes],
  )

  return (
    <div className="space-y-5">
      {disabled && (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Replies and internal notes are available for full applications. This record is a consultation enquiry.
        </p>
      )}

      <div className="space-y-3">
        {timeline.length ? timeline.map((message) => (
          <div
            key={message.id}
            className={message.visibility === 'public'
              ? 'rounded-xl border border-primary/20 bg-primary/5 p-3'
              : 'rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/10'}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                {message.visibility === 'public' ? <MessageCircle className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {message.author_name || message.author_email || 'Staff'}
                <span className="font-normal text-muted-foreground">
                  {message.visibility === 'public' ? '· Reply to applicant' : '· Internal note'}
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">{dateText(message.created_at)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{message.body}</p>
          </div>
        )) : (
          <Empty title="No conversation yet" description="Replies to the applicant and internal notes will appear here." />
        )}
      </div>

      {canReply && !disabled && (
        <div className="grid gap-4 sm:grid-cols-2">
          <MessageComposer
            applicationId={applicationId}
            visibility="public"
            label="Reply to applicant"
            placeholder="Write a reply the applicant will see…"
            helper="Visible to the applicant."
            onSent={onMessageSent}
          />
          <MessageComposer
            applicationId={applicationId}
            visibility="internal"
            label="Internal note"
            placeholder="Add a note for the team…"
            helper="Only visible to staff — never shown to the applicant."
            onSent={onMessageSent}
          />
        </div>
      )}
    </div>
  )
}

function MessageComposer({
  applicationId, visibility, label, placeholder, helper, onSent,
}: { applicationId: string; visibility: MessageVisibility; label: string; placeholder: string; helper: string; onSent?: () => void }) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const trimmed = value.trim()

  const submit = async () => {
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const { error } = await supabase.rpc('add_application_message', {
        p_application_id: applicationId,
        p_body: trimmed,
        p_visibility: visibility,
      })
      if (error) throw error
      setValue('')
      toast.success(visibility === 'public' ? 'Reply sent to applicant.' : 'Internal note added.')
      onSent?.()
    } catch (err: any) {
      toast.error(err?.message || 'Could not send message.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className="space-y-2 rounded-xl border p-3"
      onSubmit={(e) => { e.preventDefault(); void submit() }}
    >
      <label className="text-xs font-semibold" htmlFor={`composer-${visibility}`}>{label}</label>
      <Textarea
        id={`composer-${visibility}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={submitting}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">{helper}</p>
        <Button type="submit" size="sm" disabled={!trimmed || submitting}>
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {submitting ? 'Sending…' : visibility === 'public' ? 'Send reply' : 'Add note'}
        </Button>
      </div>
    </form>
  )
}

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{String(value || 'Not available')}</p>
    </div>
  )
}

function DataGrid({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(data).map(([label, value]) => (
        <Info key={label} label={label} value={typeof value === 'object' ? JSON.stringify(value) : value} />
      ))}
    </div>
  )
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">{icon}{title}</h3>
      {children}
    </section>
  )
}

export function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-4 px-4 pb-6">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="flex gap-2"><Skeleton className="h-8 w-24 rounded-md" /><Skeleton className="h-8 w-24 rounded-md" /><Skeleton className="h-8 w-24 rounded-md" /></div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
}
