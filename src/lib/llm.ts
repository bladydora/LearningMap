// src/lib/llm.ts
// LLM 调用模块（使用 Node 版 @google/genai，避免 Edge fetch 的 ByteString 限制）
import { GoogleGenAI } from '@google/genai/node'

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

export async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    contents: userMessage,
  })

  return response.text
}
