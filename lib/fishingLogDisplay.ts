import type { FishingLog } from "@/lib/types";

const RESULT_LABELS: Record<FishingLog["result"], string> = {
  caught: "釣れた",
  "no-catch": "釣れなかった",
};

const TIME_ZONE_LABELS: Record<FishingLog["timeZone"], string> = {
  morning: "朝",
  day: "昼",
  evening: "夕方",
  night: "夜",
};

/**
 * 釣果結果を日本語で表示するための関数です。
 */
export function formatFishingResult(result: FishingLog["result"]): string {
  return RESULT_LABELS[result];
}

/**
 * 時間帯を日本語で表示するための関数です。
 */
export function formatFishingTimeZone(
  timeZone: FishingLog["timeZone"]
): string {
  return TIME_ZONE_LABELS[timeZone];
}

/**
 * サイズと匹数を、一覧で見やすい短い文字列にまとめます。
 */
export function formatCatchSummary(log: FishingLog): string {
  const parts: string[] = [];

  if (log.fishType.trim() !== "") {
    parts.push(log.fishType.trim());
  } else {
    parts.push("魚種未記入");
  }

  if (log.sizeCm !== null) {
    parts.push(`${log.sizeCm}cm`);
  }

  if (log.count !== null) {
    parts.push(`${log.count}匹`);
  }

  return parts.join(" / ");
}

/**
 * 条件情報を1行の短い要約にまとめます。
 * 空の項目は表示しません。
 */
export function formatConditionSummary(log: FishingLog): string {
  const parts = [
    formatFishingTimeZone(log.timeZone),
    log.weather.trim(),
    log.tide.trim(),
  ].filter((value) => value !== "");

  return parts.join(" / ");
}

/**
 * 長いメモは一覧では短くして表示します。
 */
export function shortenMemo(memo: string, maxLength = 48): string {
  const trimmed = memo.trim();

  if (trimmed === "") {
    return "";
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}...`;
}
