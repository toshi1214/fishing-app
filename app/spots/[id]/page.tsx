"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import FishingLogForm from "@/components/FishingLogForm";
import FishingLogList from "@/components/FishingLogList";
import { formatDate, formatLatLng } from "@/lib/format";
import { getFishingLogsBySpotId, getSpotById } from "@/lib/spotStorage";
import type { FishingLog, Spot } from "@/lib/types";

export default function SpotDetailPage() {
  const params = useParams<{ id: string }>();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [logs, setLogs] = useState<FishingLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const spotId = params.id;

    if (!spotId) {
      setErrorMessage("記録 ID が見つかりません。");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [savedSpot, savedLogs] = await Promise.all([
          getSpotById(spotId),
          getFishingLogsBySpotId(spotId),
        ]);

        if (!savedSpot) {
          setErrorMessage("指定された場所が見つかりません。");
          setSpot(null);
          setLogs([]);
          return;
        }

        setSpot(savedSpot);
        setLogs(savedLogs);
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

    void loadData();
  }, [params.id, refreshKey]);

  return (
    <main className="container">
      <section className="card">
        <h1 className="section-title">場所の詳細</h1>
        <p className="section-description">
          場所の情報と、その場所に紐づく釣行記録をまとめて確認できます。
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
            <p className="detail-label">場所名</p>
            <p className="detail-value">{spot.name}</p>

            <p className="detail-label">地名</p>
            <p className="detail-value">
              {spot.areaName !== "" ? spot.areaName : "未取得"}
            </p>

            <p className="detail-label">保存日時</p>
            <p className="detail-value">{formatDate(spot.createdAt)}</p>

            <p className="detail-label">メモ</p>
            <p className="detail-value">{spot.memo || "メモなし"}</p>

            <p className="detail-label">緯度経度</p>
            <p className="detail-value">{formatLatLng(spot.lat, spot.lng)}</p>
          </>
        )}
      </section>

      {!isLoading && errorMessage === "" && spot !== null && (
        <>
          <FishingLogForm
            spotId={spot.id}
            onSaved={() => setRefreshKey((prev) => prev + 1)}
          />
          <FishingLogList logs={logs} />
          <Link href="/" className="button-link">
            一覧へ戻る
          </Link>
        </>
      )}
    </main>
  );
}
