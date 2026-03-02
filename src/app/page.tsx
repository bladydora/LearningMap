'use client'

// src/app/page.tsx
// 首页：对话界面（样式升级版）

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  updates?: any[]
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你的学习顾问。可以随时跟我聊聊你最近的学习、生活或者任何有感触的事情——我会帮你记录和整理你的成长轨迹。',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    const text = (inputRef.current?.value ?? input).trim()
    if (!text || loading) return

    setInput('')
    if (inputRef.current) inputRef.current.value = ''
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `错误：${data.error}` }])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.response, updates: data.updates },
        ])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '连接失败，请稍后重试。' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(e)
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
      {/* Header */}
      <header className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-card">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">LearningMap</h1>
          <span className="text-sm text-slate-500 font-medium">你的个人学习顾问</span>
        </div>
        <a
          href="/profile"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
        >
          查看档案
          <span className="text-slate-400" aria-hidden>→</span>
        </a>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white shadow-card-hover'
                  : 'bg-white text-slate-700 border border-slate-200/80 shadow-card'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.updates && msg.updates.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  档案已更新 {msg.updates.length} 项
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-card flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
              <span className="text-sm text-slate-500">正在思考…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white/90 backdrop-blur-sm border-t border-slate-200/80 px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="随时说说你最近的学习或感悟…"
              rows={2}
              name="message"
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-shadow"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-xl px-5 py-3 text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-card active:scale-[0.98]"
            >
              发送
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400 text-center">
            Enter 发送 · Shift+Enter 换行
          </p>
        </form>
      </div>
    </div>
  )
}
