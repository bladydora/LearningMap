// src/app/api/chat/route.ts
// 核心路由：用户输入 → 档案注入 → LLM → 解析 → 写库 → 返回

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callLLM } from '@/lib/llm'
import { parseAIResponse } from '@/lib/parseAIResponse'
import { getUserProfile, formatProfileForPrompt } from '@/lib/getProfile'

// ── 系统提示词（Scene B：自由输入模式）──────────────────────────────
function buildSystemPrompt(profileText: string): string {
  return `你是用户的个人学习顾问，负责从对话中提取学习信号并更新用户档案。

${profileText}

## 你的任务
1. 理解用户说的内容，判断是否包含与学习、成长、技能、洞察相关的信号
2. 用温暖、自然的语气回应用户（不要每次都分析，先像朋友一样聊）
3. 如果发现档案需要更新，在回复末尾输出 <update> 块

## 输出格式（必须严格遵守）
<response>
这里是给用户看的回复，自然对话风格，中文，不超过200字
</response>
<update>
[
  {
    "domain_id": 数字,
    "sub_dimension": "子维度key或标签",
    "level_label": "新层级（如 运用->熟练）",
    "evidence": "支撑这个判断的具体证据，来自用户原话",
    "cognitive_state": "clear|sensing|aware|unaware（可选）",
    "motivation_state": "driven|interested|passive|none（可选）"
  }
]
</update>

## 规则
- 如果没有可更新的内容，<update>[] </update>（空数组）
- 层级只能从档案里已有的范围升降，不能跳级（除非证据非常充分）
- 每次最多更新 3 个子维度
- 回复要优先让用户感到被理解，分析是次要的
`
}

// ── 主处理函数 ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    // 1. 获取当前登录用户
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 2. 拉取用户档案
    const { assessments, priorities } = await getUserProfile(supabase, user.id)
    const profileText = formatProfileForPrompt(assessments, priorities)

    // 3. 构建 Prompt，调用 LLM
    const systemPrompt = buildSystemPrompt(profileText)
    const rawResponse = await callLLM(systemPrompt, message)

    // 4. 解析双轨输出
    const { response, updates } = parseAIResponse(rawResponse)

    // 5. 将档案更新写入 Supabase
    if (updates.length > 0) {
      const upsertRows = updates.map(u => ({
        user_id: user.id,
        domain_id: u.domain_id,
        sub_dimension: u.sub_dimension,
        level_label: u.level_label,
        level_score: 1,          // 触发器会自动覆盖为正确值
        content_layer: u.content_layer ?? 'universal',
        cognitive_state: u.cognitive_state ?? null,
        motivation_state: u.motivation_state ?? null,
        updated_at: new Date().toISOString(),
      }))

      const { error: upsertError } = await supabase
        .from('profile_assessments')
        .upsert(upsertRows, {
          onConflict: 'user_id,domain_id,sub_dimension',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        console.error('档案更新失败:', upsertError)
      }

      // 写入证据记录
      const evidenceLogs = updates
        .filter(u => u.evidence)
        .map(u => ({
          user_id: user.id,
          domain_id: u.domain_id,
          sub_dimension: u.sub_dimension,
          evidence_text: u.evidence!,
          source: 'conversation' as const,
        }))

      if (evidenceLogs.length > 0) {
        await supabase.from('evidence_logs').insert(evidenceLogs)
      }
    }

    // 6. 保存对话历史
    await supabase.from('conversations').insert([
      { user_id: user.id, role: 'user',      content: message,       trigger_mode: 'free_input' },
      { user_id: user.id, role: 'assistant', content: response,      trigger_mode: 'free_input',
        profile_update: updates.length > 0 ? updates : null },
    ])

    // 7. 返回给前端
    return NextResponse.json({
      response,
      updates,           // 前端可用来显示"档案已更新"通知
    })

  } catch (err) {
    console.error('/api/chat error:', err)
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : '服务器错误，请稍后重试'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
