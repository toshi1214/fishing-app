"use client";

import { formatDate } from "@/lib/format";
import {
  formatCatchSummary,
  formatConditionSummary,
  formatFishingResult,
  shortenMemo,
} from "@/lib/fishingLogDisplay";
import type { FishingLog } from "@/lib/types";

type FishingLogListProps = {
  logs: FishingLog[];
};

export default function FishingLogList({ logs }: FishingLogListProps) {
  return (
    <section className="card">
      <h2 className="section-title">この場所の釣行記録</h2>
      <p className="section-description">
        新しい記録が上に表示されます。
      </p>

      {logs.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-title">まだ釣行記録がありません。</p>
          <p className="empty-state-text">
            上のフォームから、この場所での釣果や条件を追加してみましょう。
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="list">
          {logs.map((log) => (
            <article key={log.id} className="log-card">
              <div className="log-card-head">
                <p className="log-date">{formatDate(log.date)}</p>
                <span
                  className={`log-result-badge ${
                    log.result === "caught"
                      ? "log-result-caught"
                      : "log-result-no-catch"
                  }`}
                >
                  {formatFishingResult(log.result)}
                </span>
              </div>

              <p className="log-main-text">{formatCatchSummary(log)}</p>

              {formatConditionSummary(log) !== "" && (
                <p className="log-sub-text">
                  条件: {formatConditionSummary(log)}
                </p>
              )}

              {log.lureOrBait.trim() !== "" && (
                <p className="log-sub-text">
                  ルアー / 餌: {log.lureOrBait.trim()}
                </p>
              )}

              {shortenMemo(log.memo) !== "" && (
                <p className="log-memo-preview">{shortenMemo(log.memo)}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
