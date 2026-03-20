import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "釣り場所記録アプリ",
  description: "現在地を取得して釣り場所を保存する最小アプリ",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
