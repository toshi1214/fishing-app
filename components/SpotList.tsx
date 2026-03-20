"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatDate, formatLatLng } from "@/lib/format";
import { getAllSpots } from "@/lib/spotStorage";
import type { FishingSpot } from "@/lib/types";

type SpotListProps = {
  refreshKey: number;
};

export default function SpotList({ refreshKey }: SpotListProps) {
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSpots = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const spots = await getAllSpots();
        setSpots(spots);
      } catch (error) {
        console.error("Fetch spots error:", error);

        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("一覧の読み込みに失敗しました。");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSpots();
  }, [refreshKey]);

  return (
    <section className="card">
      <h2 className="section-title">保存済みポイント一覧</h2>
      <p className="section-description">
        保存した記録はこの端末のブラウザ内に残ります。
      </p>

      {isLoading && <p className="message loading-message">読み込み中...</p>}

      {!isLoading && errorMessage !== "" && (
        <p className="message error-message message-box">{errorMessage}</p>
      )}

      {!isLoading && errorMessage === "" && spots.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">まだ保存データがありません。</p>
          <p className="empty-state-text">
            上のフォームで現在地を取得して、最初の釣り場所を保存してみましょう。
          </p>
        </div>
      )}

      {!isLoading && errorMessage === "" && spots.length > 0 && (
        <div className="list">
          {spots.map((spot) => (
            <article key={spot.id} className="list-item">
              <h3 className="list-title">{spot.title}</h3>
              <p className="list-date">{formatDate(spot.date)}</p>
              <p className="list-memo">{spot.memo || "メモなし"}</p>
              <p className="list-coords">{formatLatLng(spot.lat, spot.lng)}</p>
              <Link href={`/spots/${spot.id}`} className="text-link">
                詳細を見る
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
