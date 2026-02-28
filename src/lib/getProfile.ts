// src/lib/getProfile.ts
// 从 Supabase 拉取用户档案，格式化为可注入 Prompt 的文本

import { SupabaseClient } from '@supabase/supabase-js'

export interface SubDimRecord {
  domain_id: number
  domain_name: string
  sub_dimension: string
  is_custom: boolean
  level_label: string
  level_score: number
  content_layer: string
  learning_nature: string | null
  cognitive_state: string | null
  motivation_state: string | null
}

export interface DomainPriority {
  domain_id: number
  domain_name: string
  priority_score: number
  priority_notes: string | null
}

// 拉取完整档案（子维度 + 优先级）
export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  const [{ data: assessments }, { data: priorities }] = await Promise.all([
    supabase
      .from('profile_assessments')
      .select(`
        domain_id,
        sub_dimension,
        is_custom,
        level_label,
        level_score,
        content_layer,
        learning_nature,
        cognitive_state,
        motivation_state,
        domains(name)
      `)
      .eq('user_id', userId)
      .order('domain_id')
      .order('level_score', { ascending: false }),

    supabase
      .from('domain_priorities')
      .select(`domain_id, priority_score, priority_notes, domains(name)`)
      .eq('user_id', userId)
      .order('priority_score', { ascending: false }),
  ])

  return { assessments: assessments ?? [], priorities: priorities ?? [] }
}

// 将档案数据格式化为 Prompt 注入文本
export function formatProfileForPrompt(
  assessments: any[],
  priorities: any[]
): string {
  // 按域分组
  const byDomain: Record<number, any[]> = {}
  for (const row of assessments) {
    const id = row.domain_id
    if (!byDomain[id]) byDomain[id] = []
    byDomain[id].push(row)
  }

  // 优先级 map
  const prioMap: Record<number, { score: number; notes: string }> = {}
  for (const p of priorities) {
    prioMap[p.domain_id] = { score: p.priority_score, notes: p.priority_notes ?? '' }
  }

  const lines: string[] = ['=== 用户学习档案 ===']

  for (const [domainIdStr, rows] of Object.entries(byDomain)) {
    const domainId = Number(domainIdStr)
    const domainName = rows[0]?.domains?.name ?? `域${domainId}`
    const prio = prioMap[domainId]
    const layer = rows[0]?.content_layer ?? 'universal'
    const nature = rows[0]?.learning_nature ?? ''
    const cogState = rows[0]?.cognitive_state ?? ''
    const motState = rows[0]?.motivation_state ?? ''

    lines.push(`\n【${domainName}】优先级:${prio?.score ?? '?'}/10 | 层:${layer} | 性质:${nature} | 认知:${cogState} | 意愿:${motState}`)

    for (const r of rows) {
      const custom = r.is_custom ? '[个性化]' : ''
      lines.push(`  - ${r.sub_dimension}${custom}: ${r.level_label}(${r.level_score}/10)`)
    }
  }

  lines.push('\n=== 档案结束 ===')
  return lines.join('\n')
}
