import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learning Map',
  description: 'AI 学习路线图助手',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="scrollbar-thin">
      <body className="min-h-screen bg-surface text-zinc-800">{children}</body>
    </html>
  );
}
