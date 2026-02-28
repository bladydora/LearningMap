'use client'

// src/app/page.tsx
// 首页：对话界面（MVP最简版）

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">LearningMap</h1>
          <p className="text-sm text-gray-500">你的个人学习顾问</p>
        </div>
        <a
          href="/profile"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          查看档案 →
        </a>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
              }`}
            >
              {msg.content}
              {/* 档案更新通知 */}
              {msg.updates && msg.updates.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  ✦ 档案已更新 {msg.updates.length} 项
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 打字中指示器 */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="随时说说你最近的学习或感悟…（Enter 发送，Shift+Enter 换行）"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
