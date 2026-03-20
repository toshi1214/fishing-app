"use client";

import { useState } from "react";

import SpotForm from "@/components/SpotForm";
import SpotList from "@/components/SpotList";

export default function HomePage() {
  // 保存が成功したあとに一覧を再読み込みするための番号です。
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="container">
      <section className="hero">
        <p className="hero-badge">最小版</p>
        <h1 className="page-title">釣り場所記録アプリ</h1>
        <p className="page-description">
          現在地を取得して、釣り場所をこのブラウザ内に保存します。
          スマホでも使いやすいように、まずは IndexedDB を使った最小版にしています。
        </p>
        <div className="hero-points">
          <p className="hero-point">今の保存先は、この端末のブラウザ内です。</p>
          <p className="hero-point">
            Vercel に公開しても、サーバーの JSON 保存には依存しません。
          </p>
        </div>
      </section>

      <SpotForm onSaved={() => setRefreshKey((prev) => prev + 1)} />
      <SpotList refreshKey={refreshKey} />
    </main>
  );
}
