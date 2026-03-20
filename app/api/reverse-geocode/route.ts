import { NextResponse } from "next/server";

type ReverseGeocodeAddress = {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  neighbourhood?: string;
  hamlet?: string;
};

type ReverseGeocodeApiResponse = {
  display_name?: string;
  address?: ReverseGeocodeAddress;
};

/**
 * 優先順位にしたがって、最初に見つかった文字列を返します。
 */
function pickFirstText(values: Array<string | undefined>): string {
  return values.find((value) => typeof value === "string" && value.trim() !== "")
    ?.trim() ?? "";
}

/**
 * Nominatim の address から「市区町村 + 地区名」の形を作ります。
 * どちらかしか無いときは、その片方だけを返します。
 */
function buildPlaceNameFromAddress(address?: ReverseGeocodeAddress): string {
  if (!address) {
    return "";
  }

  const cityName = pickFirstText([address.city, address.town, address.village]);
  const areaName = pickFirstText([
    address.suburb,
    address.neighbourhood,
    address.hamlet,
  ]);

  return [cityName, areaName].filter((value) => value !== "").join(" ");
}

/**
 * 緯度経度から地名を取得します。
 * クライアントから直接外部 API を呼ばず、まずはこの内部 API を経由させます。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (lat === null || lng === null) {
    return NextResponse.json({ placeName: "" });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: {
        // Nominatim 利用時は User-Agent が必要です。
        "User-Agent": "fishing-app/1.0 (Next.js local app)",
        Accept: "application/json",
        "Accept-Language": "ja",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ placeName: "" });
    }

    const data: ReverseGeocodeApiResponse = await response.json();
    // まず address から「市区町村 + 地区名」を作ります。
    // 取れないときだけ display_name をフォールバックとして使います。
    const placeName =
      buildPlaceNameFromAddress(data.address) ||
      (typeof data.display_name === "string" ? data.display_name : "");

    return NextResponse.json({ placeName });
  } catch (error) {
    console.error("GET /api/reverse-geocode error:", error);
    return NextResponse.json({ placeName: "" });
  }
}
