'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
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
    <div className="flex-1 flex flex-col h-full bg-[#f9f6f2] border-r border-[#e7e7e7] font-sans">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-[10px] border border-[#e7e7e7] flex items-center justify-center text-[#141414] mb-4 bg-white">
              <MessageSquare className="w-5 h-5 text-[#262626]" />
            </div>
            <p className="text-[14px] text-[#141414] font-semibold">Welcome to the study room!</p>
            <p className="text-[13px] text-[#4e4d4c] max-w-[240px] mt-1.5 leading-relaxed">
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
                } ${isConsecutive ? '-mt-4.5' : ''}`}
              >
                {/* Only display avatar if not consecutive */}
                {!isConsecutive ? (
                  <Avatar className="w-8 h-8 border border-[#e7e7e7] shrink-0 rounded-[10px]">
                    <AvatarImage src={message.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#f4eee5] text-[#141414] border border-[#e7e7e7] text-xs font-semibold rounded-[10px]">
                      {fallbackChar}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 shrink-0" />
                )}

                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                  {/* Name and time header - skip if consecutive */}
                  {!isConsecutive && (
                    <div className="flex items-baseline gap-2 mb-1.5 px-1 text-[12px]">
                      <span className="font-semibold text-[#141414]">
                        {message.profile?.full_name || message.profile?.username}
                      </span>
                      <span className="text-[10px] text-[#737373]" suppressHydrationWarning>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`rounded-[10px] px-4 py-2.5 text-[14px] leading-relaxed ${
                      isSelf
                        ? 'bg-[#0A7C6E] text-white border-0'
                        : 'bg-white text-[#141414] border border-[#e7e7e7]'
                    }`}
                  >
                    {message.content}
                  </div>

                  {/* Consecutive message time detail */}
                  {isConsecutive && (
                    <span className="text-[9px] text-[#737373] opacity-0 hover:opacity-100 transition-opacity mt-1 px-2 font-normal" suppressHydrationWarning>
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
      <form onSubmit={handleSend} className="p-4 border-t border-[#e7e7e7] bg-[#f9f6f2] flex gap-3 items-center">
        <Input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white border border-[#e7e7e7] focus-visible:ring-1 focus-visible:ring-[#0A7C6E] focus-visible:border-[#0A7C6E] text-[#141414] placeholder:text-[#a1a1a1] h-10.5 rounded-[5px] text-[14px] px-4 font-normal shadow-none"
          maxLength={1000}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="bg-[#0A7C6E] hover:opacity-90 text-white w-10.5 h-10.5 rounded-[5px] px-0 py-0 flex items-center justify-center border-none shrink-0 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-none transition-all"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
