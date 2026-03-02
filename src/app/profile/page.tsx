'use client'

// 档案页：展示用户学习档案（域、子维度、分数等）

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SubDim {
  key: string
  is_custom: boolean
  level_label: string
  level_score: number
  content_layer: string
  learning_nature: string | null
  cognitive_state: string | null
  motivation_state: string | null
}

interface Domain {
  domain_id: number
  domain_name: string
  avg_score: number
  priority_score: number
  priority_notes: string | null
  sub_dims: SubDim[]
}

export default function ProfilePage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (data.error) {
          if (res.status === 401) {
            window.location.href = '/login'
            return
          }
          setError(data.error)
          return
        }
        setDomains(data.domains ?? [])
      } catch {
        setError('加载失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 flex items-center justify-center">
        <div className="text-slate-500">加载中…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="text-brand-600 hover:text-brand-700 font-medium">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80">
      <header className="shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-card">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">LearningMap</h1>
          <span className="text-sm text-slate-500 font-medium">学习档案</span>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1"
        >
          ← 返回对话
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {domains.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
            <p className="text-slate-600 mb-4">暂无档案数据</p>
            <p className="text-sm text-slate-500 mb-6">多和顾问聊聊你的学习与成长，档案会自动更新。</p>
            <Link
              href="/"
              className="inline-block rounded-xl px-5 py-2.5 text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              去对话
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {domains.map((d) => (
              <section
                key={d.domain_id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800">{d.domain_name}</h2>
                    <span className="text-sm text-slate-500">
                      均分 {d.avg_score.toFixed(1)} · 优先级 {d.priority_score}/10
                    </span>
                  </div>
                  {d.priority_notes && (
                    <p className="mt-2 text-sm text-slate-600">{d.priority_notes}</p>
                  )}
                </div>
                <ul className="divide-y divide-slate-100">
                  {d.sub_dims.map((s, i) => (
                    <li key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                      <span className="text-slate-700">
                        {s.key}
                        {s.is_custom && (
                          <span className="ml-1.5 text-xs text-slate-400">[个性化]</span>
                        )}
                      </span>
                      <span className="text-sm font-medium text-brand-600 shrink-0">
                        {s.level_label} ({s.level_score}/10)
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
