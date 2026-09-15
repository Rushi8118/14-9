import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useChat, openChatAttachment } from '@/hooks/useChat'
import { useAuth } from '@/hooks/use-auth'
import UserAvatar from '@/components/UserAvatar'
import {
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Smile,
  Search,
  MessageSquare,
  FileText,
  Clock,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ChatPage() {
  const { user } = useAuth()
  const {
    messages,
    isError,
    refetch,
    sendMessage,
    sendLoading,
    officerTyping,
    sendTypingBroadcast,
  } = useChat()

  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to latest message on payload modifications
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, officerTyping])

  if (!user) return null

  // Filter messages by search term
  const filtered = messages.filter((m) =>
    m.message.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !selectedFile) return

    sendMessage(
      {
        text: text,
        file: selectedFile || undefined,
      },
      {
        onSuccess: () => {
          setText('')
          setSelectedFile(null)
        },
      }
    )
  }

  // Trigger typing broadcasts
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
    sendTypingBroadcast()
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Reset so choosing the same file again still fires onChange.
      e.target.value = ''
      if (file.size > 5 * 1024 * 1024) {
        toast.error('That file is larger than 5 MB. Please choose a smaller file.')
        return
      }
      setSelectedFile(file)
    }
  }

  return (
    <div className="h-[calc(100dvh-11.5rem)] md:h-[calc(100dvh-8rem)] min-h-[22rem] max-h-[52rem] flex flex-col bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 bg-[#1a1a2e] text-[#F5F0E8] flex items-center justify-between border-b border-[#C49A2B]/10 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <UserAvatar fullName="Siddhivinayak Officer" size="sm" className="border border-[#C49A2B]/35" />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-[#1a1a2e]" aria-hidden="true" />
          </div>
          <div className="leading-tight min-w-0">
            <h3 className="text-sm font-bold font-serif truncate">Siddhivinayak Desk</h3>
            <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">Online Support</p>
          </div>
        </div>

        <div className="relative hidden sm:block w-48 shrink-0">
          <label htmlFor="chat-search" className="sr-only">Search chat messages</label>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#F5F0E8]/60 pointer-events-none" aria-hidden="true" />
          <input
            id="chat-search"
            type="search"
            placeholder="Search chat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-[#C49A2B]/20 bg-[#F5F0E8]/10 text-[#F5F0E8] placeholder:text-[#F5F0E8]/55 focus:border-[#C49A2B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B]"
          />
        </div>
      </div>

      {isError && (
        <div role="alert" className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-300/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <span>We couldn't load your conversation. Your messages are safe — please try again.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-8 rounded-lg border border-amber-400/70 px-3 font-semibold hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B]"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Scrolling chat logs block */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-5 overflow-y-auto bg-[#F5F0E8]/10 space-y-4 scroll-smooth"
      >
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <MessageSquare className="h-12 w-12 text-foreground/25 mb-3" aria-hidden="true" />
            <p className="text-sm text-foreground/65 font-semibold">Start your conversation!</p>
            <p className="text-xs text-foreground/55 mt-0.5 max-w-[200px]">
              Ask our consultants about your file reviews or schedules.
            </p>
          </div>
        ) : (
          filtered.map((msg) => {
            const isMe = msg.sender_id === user.id
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-3.5 text-xs shadow-sm flex flex-col gap-1.5 leading-normal relative ${
                    isMe
                      ? 'bg-[#1a1a2e] text-[#F5F0E8] rounded-tr-none'
                      : 'bg-card text-[#1a1a2e] border border-border/50 rounded-tl-none'
                  }`}
                >
                  {/* Text Message content */}
                  <p className="break-words whitespace-pre-wrap">{msg.message}</p>

                  {/* Attachment if present */}
                  {msg.file_url && (
                    <button
                      type="button"
                      onClick={() => void openChatAttachment(msg.file_url!)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition ${
                        isMe
                          ? 'bg-[#F5F0E8]/10 border-white/10 text-[#C49A2B]'
                          : 'bg-[#1a1a2e]/5 border-border/50 text-[#C49A2B]'
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="text-[11px] font-bold underline truncate max-w-[120px]">
                        {msg.file_name || 'Attachment'}
                      </span>
                    </button>
                  )}

                  <div className={`flex items-center gap-1.5 self-end text-[11px] ${isMe ? 'text-[#F5F0E8]/70' : 'text-foreground/55'}`}>
                    <time dateTime={msg.created_at}>
                      {new Date(msg.created_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    {isMe && (
                      <span className="shrink-0" aria-label={msg.is_read ? 'Read' : 'Sent'}>
                        {msg.is_read ? (
                          <CheckCheck className="h-3.5 w-3.5 text-[#E8C56A]" aria-hidden="true" />
                        ) : (
                          <Check className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Case officer typing indicator bubble */}
        {officerTyping && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="bg-card text-foreground/65 border border-border/50 rounded-2xl rounded-tl-none p-3 text-xs font-semibold italic flex items-center gap-2" aria-live="polite">
              <span className="h-1.5 w-1.5 bg-[#C49A2B] rounded-full animate-bounce" aria-hidden="true" />
              <span>Officer is typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Text Box input controls */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 bg-[#F5F0E8]/40 border-t border-border/50 flex items-center gap-2.5 shrink-0 relative"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf, .jpeg, .jpg, .png"
        />

        {/* Selected file notification banner preview */}
        {selectedFile && (
          <div className="absolute left-4 bottom-full mb-2 bg-[#1a1a2e] text-[#F5F0E8] border border-[#C49A2B]/30 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow-lg animate-slideUp">
            <Paperclip className="h-3.5 w-3.5 text-[#E8C56A]" aria-hidden="true" />
            <span className="font-bold truncate max-w-[140px]">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-red-300 hover:text-red-200 font-bold ml-1 min-h-8 min-w-8 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B]"
              aria-label="Remove attachment"
            >
              ✕
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleAttachmentClick}
          className="p-2.5 min-h-10 min-w-10 text-foreground/60 hover:text-[#8B6914] bg-card border border-border/60 rounded-xl transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A2B] focus-visible:ring-offset-2"
          aria-label="Add Attachment"
        >
          <Paperclip className="h-4.5 w-4.5" aria-hidden="true" />
        </button>

        {/* Message Input text field */}
        <Input
          type="text"
          placeholder="Type your message..."
          value={text}
          onChange={handleInputChange}
          className="flex-1 h-10 border-border/65 bg-card focus:border-[#C49A2B]/40 rounded-xl text-xs"
          disabled={sendLoading}
        />

        {/* Send Action submit */}
        <Button
          type="submit"
          disabled={sendLoading || (!text.trim() && !selectedFile)}
          className="rounded-xl h-10 w-10 p-0 bg-primary hover:bg-primary/95 text-primary-foreground btn-glow"
          aria-label="Send Message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
