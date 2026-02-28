// src/lib/parseAIResponse.ts
// 解析 AI 双轨输出：<response> 给用户 + <update> 写数据库

export interface ProfileUpdate {
  domain_id: number
  sub_dimension: string
  level_label: string
  evidence?: string
  cognitive_state?: string
  motivation_state?: string
  content_layer?: string
}

export interface ParsedAIOutput {
  response: string        // 展示给用户的回复
  updates: ProfileUpdate[] // 写入数据库的更新
}

export function parseAIResponse(raw: string): ParsedAIOutput {
  // 提取 <response> 块
  const responseMatch = raw.match(/<response>([\s\S]*?)<\/response>/i)
  const response = responseMatch ? responseMatch[1].trim() : raw.trim()

  // 提取 <update> 块（可能有多个）
  const updates: ProfileUpdate[] = []
  const updateRegex = /<update>([\s\S]*?)<\/update>/gi
  let match

  while ((match = updateRegex.exec(raw)) !== null) {
    try {
      // update 块内容为 JSON
      const json = JSON.parse(match[1].trim())
      // 支持单个对象或数组
      if (Array.isArray(json)) {
        updates.push(...json)
      } else {
        updates.push(json)
      }
    } catch {
      console.error('Failed to parse update block:', match[1])
    }
  }

  return { response, updates }
}
