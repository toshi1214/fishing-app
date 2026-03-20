"use client";

import { useState } from "react";

import { saveFishingLog } from "@/lib/spotStorage";
import type { FishingResult, FishingTimeZone } from "@/lib/types";

type FishingLogFormProps = {
  spotId: string;
  onSaved: () => void;
};

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function FishingLogForm({
  spotId,
  onSaved,
}: FishingLogFormProps) {
  const [date, setDate] = useState(getTodayString());
  const [result, setResult] = useState<FishingResult>("caught");
  const [fishType, setFishType] = useState("");
  const [sizeCm, setSizeCm] = useState("");
  const [count, setCount] = useState("");
  const [weather, setWeather] = useState("");
  const [tide, setTide] = useState("");
  const [timeZone, setTimeZone] = useState<FishingTimeZone>("morning");
  const [lureOrBait, setLureOrBait] = useState("");
  const [memo, setMemo] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setMessage("");
    setErrorMessage("");

    if (date.trim() === "") {
      setErrorMessage("日付を入力してください。");
      return;
    }

    setIsSaving(true);

    try {
      await saveFishingLog({
        spotId,
        date,
        result,
        fishType: fishType.trim(),
        sizeCm: sizeCm.trim() === "" ? null : Number(sizeCm),
        count: count.trim() === "" ? null : Number(count),
        weather: weather.trim(),
        tide: tide.trim(),
        timeZone,
        lureOrBait: lureOrBait.trim(),
        memo: memo.trim(),
        createdAt: new Date().toISOString(),
      });

      setResult("caught");
      setFishType("");
      setSizeCm("");
      setCount("");
      setWeather("");
      setTide("");
      setTimeZone("morning");
      setLureOrBait("");
      setMemo("");
      setMessage("釣行記録を保存しました。");
      onSaved();
    } catch (error) {
      console.error("Save fishing log error:", error);

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("釣行記録の保存に失敗しました。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card">
      <h2 className="section-title">この場所の釣行記録を追加する</h2>
      <p className="section-description">
        まずは最小構成として、釣果とそのときの条件を記録します。
      </p>

      <div className="form-group">
        <label htmlFor="log-date" className="label">
          日付
        </label>
        <input
          id="log-date"
          className="input"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="label">結果</label>
        <div className="choice-grid">
          <button
            type="button"
            className={`choice-button ${result === "caught" ? "choice-button-active" : ""}`}
            onClick={() => setResult("caught")}
          >
            釣れた
          </button>
          <button
            type="button"
            className={`choice-button ${result === "no-catch" ? "choice-button-active" : ""}`}
            onClick={() => setResult("no-catch")}
          >
            釣れなかった
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="fish-type" className="label">
          魚種
        </label>
        <input
          id="fish-type"
          className="input"
          type="text"
          placeholder="例: シーバス"
          value={fishType}
          onChange={(event) => setFishType(event.target.value)}
        />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="size-cm" className="label">
            サイズ(cm)
          </label>
          <input
            id="size-cm"
            className="input"
            type="number"
            inputMode="decimal"
            placeholder="例: 45"
            value={sizeCm}
            onChange={(event) => setSizeCm(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="count" className="label">
            匹数
          </label>
          <input
            id="count"
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="例: 2"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="weather" className="label">
            天気
          </label>
          <input
            id="weather"
            className="input"
            type="text"
            placeholder="例: 晴れ"
            value={weather}
            onChange={(event) => setWeather(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tide" className="label">
            潮
          </label>
          <input
            id="tide"
            className="input"
            type="text"
            placeholder="例: 中潮"
            value={tide}
            onChange={(event) => setTide(event.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="time-zone" className="label">
          時間帯
        </label>
        <select
          id="time-zone"
          className="input"
          value={timeZone}
          onChange={(event) =>
            setTimeZone(event.target.value as FishingTimeZone)
          }
        >
          <option value="morning">朝</option>
          <option value="day">昼</option>
          <option value="evening">夕方</option>
          <option value="night">夜</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="lure-or-bait" className="label">
          ルアー / 餌
        </label>
        <input
          id="lure-or-bait"
          className="input"
          type="text"
          placeholder="例: ミノー / 青イソメ"
          value={lureOrBait}
          onChange={(event) => setLureOrBait(event.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="log-memo" className="label">
          メモ
        </label>
        <textarea
          id="log-memo"
          className="textarea"
          rows={4}
          placeholder="例: 流れが弱く、反応は少なかった"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
      </div>

      <div className="form-group">
        <button
          type="button"
          className="button button-large button-primary-strong"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "保存中..." : "釣行記録を保存する"}
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
