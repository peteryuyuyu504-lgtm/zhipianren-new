import type { Metadata } from "next";
import { TawkChat } from "@/components/tawk-chat";
import "./globals.css";

export const metadata: Metadata = {
  title: "纸片人男友",
  description: "选择一个今晚想聊的人",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <TawkChat />
      </body>
    </html>
  );
}
