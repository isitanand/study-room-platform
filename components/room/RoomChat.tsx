'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Send, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  profile?: {
    username: string
    full_name?: string | null
    avatar_url?: string | null
  }
}

interface RoomChatProps {
  roomId: string
  initialMessages: Message[]
  currentUserId: string
  messages: Message[]
  onSendMessage: (content: string) => Promise<void>
}

export function RoomChat({
  roomId,
  currentUserId,
  messages,
  onSendMessage,
}: RoomChatProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior })
  }

  // Scroll to bottom on initial load and when messages update
  useEffect(() => {
    scrollToBottom('auto')
  }, [])

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || sending) return

    setSending(true)
    const originalContent = content
    setContent('')

    try {
      await onSendMessage(originalContent)
    } catch (err: any) {
      setContent(originalContent) // Restore input on failure
      toast.error(err.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  // Utility to format timestamp safely on client
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Welcome to the study room!</p>
            <p className="text-xs text-zinc-500 max-w-[240px] mt-1">
              Send a message to start collaborating with your study group.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isSelf = message.userId === currentUserId
            const prevMessage = index > 0 ? messages[index - 1] : null
            const isConsecutive =
              prevMessage &&
              prevMessage.userId === message.userId &&
              new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 120000 // 2 minutes

            const fallbackChar = message.profile?.username?.charAt(0).toUpperCase() || '?'

            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                  isSelf ? 'ml-auto flex-row-reverse' : ''
                } ${isConsecutive ? '-mt-4' : ''}`}
              >
                {/* Only display avatar if not consecutive */}
                {!isConsecutive ? (
                  <Avatar className="w-8 h-8 border border-zinc-800 shrink-0">
                    <AvatarImage src={message.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-zinc-900 text-zinc-400 text-xs font-semibold">
                      {fallbackChar}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 shrink-0" />
                )}

                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                  {/* Name and time header - skip if consecutive */}
                  {!isConsecutive && (
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="text-xs font-bold text-zinc-300">
                        {message.profile?.full_name || message.profile?.username}
                      </span>
                      <span className="text-[9px] text-zinc-500" suppressHydrationWarning>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                      isSelf
                        ? 'bg-violet-600 text-white rounded-tr-none'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-850 rounded-tl-none'
                    }`}
                  >
                    {message.content}
                  </div>

                  {/* Consecutive message time detail (tiny hover element or similar) */}
                  {isConsecutive && (
                    <span className="text-[8px] text-zinc-650 opacity-0 hover:opacity-100 transition-opacity mt-0.5 px-2" suppressHydrationWarning>
                      {formatTime(message.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex gap-2">
        <Input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message study room..."
          className="flex-1 bg-zinc-900 border-zinc-800 focus-visible:ring-violet-500 text-white placeholder-zinc-550 h-10 rounded-xl"
          maxLength={1000}
          disabled={sending}
        />
        <Button
          type="submit"
          disabled={!content.trim() || sending}
          className="h-10 w-10 shrink-0 bg-violet-600 hover:bg-violet-750 text-white rounded-xl shadow-md transition-colors"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  )
}
