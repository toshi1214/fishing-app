"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { formatDate, formatLatLng } from "@/lib/format";
import { getSpotById } from "@/lib/spotStorage";
import type { FishingSpot } from "@/lib/types";

export default function SpotDetailPage() {
  const params = useParams<{ id: string }>();
  const [spot, setSpot] = useState<FishingSpot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const spotId = params.id;

    if (!spotId) {
      setErrorMessage("記録 ID が見つかりません。");
      setIsLoading(false);
      return;
    }

    const loadSpot = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const savedSpot = await getSpotById(spotId);

        if (!savedSpot) {
          setErrorMessage("指定された記録が見つかりません。");
          setSpot(null);
          return;
        }

        setSpot(savedSpot);
      } catch (error) {
        console.error("Load detail error:", error);

        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("詳細の読み込みに失敗しました。");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadSpot();
  }, [params.id]);

  return (
    <main className="container">
      <section className="card">
        <h1 className="section-title">記録の詳細</h1>
        <p className="section-description">
          この画面も IndexedDB から読み込んでいます。
        </p>

        {isLoading && <p className="message">読み込み中...</p>}

        {!isLoading && errorMessage !== "" && (
          <>
            <p className="message error-message message-box">{errorMessage}</p>
            <Link href="/" className="button-link">
              一覧へ戻る
            </Link>
          </>
        )}

        {!isLoading && errorMessage === "" && spot !== null && (
          <>
            <p className="detail-label">保存日時</p>
            <p className="detail-value">{formatDate(spot.date)}</p>

            <p className="detail-label">場所名</p>
            <p className="detail-value">{spot.title}</p>

            <p className="detail-label">メモ</p>
            <p className="detail-value">{spot.memo || "メモなし"}</p>

            <p className="detail-label">緯度経度</p>
            <p className="detail-value">{formatLatLng(spot.lat, spot.lng)}</p>

            <Link href="/" className="button-link">
              一覧へ戻る
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
