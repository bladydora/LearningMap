// src/lib/llm.ts
// 直接使用 Node https 调用 Gemini REST API，避免 Next/Edge 的 fetch/Headers ByteString 限制

import https from 'node:https'

const GEMINI_URL = 'generativelanguage.googleapis.com'
const MODEL = 'gemini-3-flash-preview'

export async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: GEMINI_URL,
        path: `/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body, 'utf8'),
        },
      },
      (res: any) => {
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk.toString('utf8') })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            const text =
              json?.candidates?.[0]?.content?.parts?.[0]?.text ??
              json?.error?.message ??
              ''
            if (json.error && !text) {
              reject(new Error(json.error.message || 'Gemini API error'))
              return
            }
            resolve(text)
          } catch (e) {
            reject(e)
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body, 'utf8')
    req.end()
  })
}
