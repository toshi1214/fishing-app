"use client";

import { useState } from "react";

import { saveSpot } from "@/lib/spotStorage";

type SpotFormProps = {
  onSaved: () => void;
};

export default function SpotForm({ onSaved }: SpotFormProps) {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [autoPlaceName, setAutoPlaceName] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGettingPlaceName, setIsGettingPlaceName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 緯度経度の表示用関数です。
   * 未取得のときは「未取得」を返し、取得済みなら小数点6桁で表示します。
   */
  const formatCoordinate = (value: number | null): string => {
    return value !== null ? value.toFixed(6) : "未取得";
  };

  /**
   * 内部 API を使って地名を取得します。
   * 外部 API を直接クライアントから呼ばないようにするための関数です。
   */
  const fetchPlaceName = async (
    nextLat: number,
    nextLng: number
  ): Promise<void> => {
    setIsGettingPlaceName(true);

    try {
      const response = await fetch(
        `/api/reverse-geocode?lat=${nextLat}&lng=${nextLng}`
      );

      const data: unknown = await response.json();

      if (
        response.ok &&
        typeof data === "object" &&
        data !== null &&
        "placeName" in data &&
        typeof data.placeName === "string" &&
        data.placeName.trim() !== ""
      ) {
        setAutoPlaceName(data.placeName);
      } else {
        setAutoPlaceName("");
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
      setAutoPlaceName("");
    } finally {
      setIsGettingPlaceName(false);
    }
  };

  /**
   * ブラウザの GPS 機能を使って現在地を取得します。
   * スマホで開いた場合は、ここが将来そのまま活きる作りです。
   */
  const handleGetLocation = () => {
    setMessage("");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage("このブラウザでは位置情報が利用できません。");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;

        setLat(nextLat);
        setLng(nextLng);
        setAutoPlaceName(null);
        setMessage("現在地を取得しました。");
        setIsGettingLocation(false);

        void fetchPlaceName(nextLat, nextLng);
      },
      (error) => {
        console.error("Geolocation error:", error);

        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage(
            "位置情報の利用が許可されていません。ブラウザで許可してください。"
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage(
            "位置情報を取得できませんでした。GPS や通信状態を確認してください。"
          );
        } else if (error.code === error.TIMEOUT) {
          setErrorMessage(
            "位置情報の取得がタイムアウトしました。もう一度お試しください。"
          );
        } else {
          setErrorMessage("位置情報の取得に失敗しました。");
        }

        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /**
   * IndexedDB に保存します。
   * サーバーの JSON ファイルではなく、ブラウザ内の保存領域を使います。
   */
  const handleSave = async () => {
    setMessage("");
    setErrorMessage("");

    if (title.trim() === "") {
      setErrorMessage("場所名を入力してください。");
      return;
    }

    if (lat === null || lng === null) {
      setErrorMessage("先に現在地を取得してください。");
      return;
    }

    setIsSaving(true);

    try {
      await saveSpot({
        name: title.trim(),
        memo: memo.trim(),
        lat,
        lng,
        areaName: autoPlaceName ?? "",
        createdAt: new Date().toISOString(),
      });

      // 保存成功後は入力欄を初期化します。
      setTitle("");
      setMemo("");
      setLat(null);
      setLng(null);
      setAutoPlaceName(null);
      setMessage("保存しました。");
      onSaved();
    } catch (error) {
      console.error("Save error:", error);

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("保存中に不明なエラーが発生しました。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card">
      <h2 className="section-title">釣り場所を記録する</h2>
      <p className="section-description">
        現在地を取得して、場所名とメモを保存します。スマホでは「現在地を取得」
        を押してから入力するとスムーズです。
      </p>

      <div className="form-group">
        <button
          type="button"
          className="button-secondary button-large"
          onClick={handleGetLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? "現在地を取得中..." : "現在地を取得"}
        </button>
      </div>

      <div className="form-group">
        <label className="label">取得した現在地</label>
        <p className="field-help">
          緯度・経度と、取得できた場合は地名を表示します。
        </p>

        <div className="location-panel">
          <div className="location-row">
            <span className="location-key">緯度</span>
            <span className="location-value">{formatCoordinate(lat)}</span>
          </div>

          <div className="location-row">
            <span className="location-key">経度</span>
            <span className="location-value">{formatCoordinate(lng)}</span>
          </div>

          <div className="location-row">
            <span className="location-key">自動取得した地名</span>
            <span className="location-value">
              {isGettingPlaceName
                ? "取得中..."
                : autoPlaceName !== null && autoPlaceName.trim() !== ""
                  ? autoPlaceName
                  : "未取得"}
            </span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="title" className="label">
          場所名
        </label>
        <input
          id="title"
          className="input"
          type="text"
          placeholder="例: 多摩川 下流"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="memo" className="label">
          メモ
        </label>
        <textarea
          id="memo"
          className="textarea"
          placeholder="例: 朝まずめに入りやすい場所"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          rows={4}
        />
      </div>

      <div className="form-group">
        <button
          type="button"
          className="button button-large button-primary-strong"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "保存中..." : "保存する"}
        </button>
      </div>

      {message !== "" && (
        <p className="message success-message message-box">{message}</p>
      )}
      {errorMessage !== "" && (
        <p className="message error-message message-box">{errorMessage}</p>
      )}
    </section>
  );
}
