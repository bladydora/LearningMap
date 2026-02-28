// src/app/api/profile/route.ts
// 读取当前用户的完整档案（雷达图、优先级列表等页面用）

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/getProfile'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { assessments, priorities } = await getUserProfile(supabase, user.id)

    // 按域聚合，计算每域平均分
    const domainMap: Record<number, {
      domain_name: string
      avg_score: number
      priority_score: number
      priority_notes: string | null
      sub_dims: any[]
    }> = {}

    for (const row of assessments) {
      const id = row.domain_id
      if (!domainMap[id]) {
        domainMap[id] = {
          domain_name: row.domains?.name ?? `域${id}`,
          avg_score: 0,
          priority_score: 0,
          priority_notes: null,
          sub_dims: [],
        }
      }
      domainMap[id].sub_dims.push({
        key: row.sub_dimension,
        is_custom: row.is_custom,
        level_label: row.level_label,
        level_score: row.level_score,
        content_layer: row.content_layer,
        learning_nature: row.learning_nature,
        cognitive_state: row.cognitive_state,
        motivation_state: row.motivation_state,
      })
    }

    // 注入优先级分数
    for (const p of priorities) {
      if (domainMap[p.domain_id]) {
        domainMap[p.domain_id].priority_score = p.priority_score
        domainMap[p.domain_id].priority_notes = p.priority_notes
      }
    }

    // 计算平均分
    for (const d of Object.values(domainMap)) {
      const scores = d.sub_dims.map((s: any) => s.level_score)
      d.avg_score = scores.length
        ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10
        : 0
    }

    return NextResponse.json({
      domains: Object.entries(domainMap).map(([id, d]) => ({
        domain_id: Number(id),
        ...d,
      })).sort((a, b) => a.domain_id - b.domain_id),
    })

  } catch (err) {
    console.error('/api/profile error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
