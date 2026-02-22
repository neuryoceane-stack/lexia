import { NextResponse } from "next/server";

export type CitySuggestion = {
  name: string;
  country: string;
  displayName: string;
};

/**
 * GET /api/places/cities?q=xxx
 * Recherche de villes via Open-Meteo Geocoding (gratuit, sans clé).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ cities: [] });
  }

  const limit = Math.min(Number(searchParams.get("limit")) || 8, 15);
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", String(limit));

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    const data = (await res.json()) as {
      results?: Array<{
        name: string;
        country: string;
        country_code?: string;
        admin1?: string;
      }>;
    };
    const results = data.results ?? [];
    const cities: CitySuggestion[] = results.map((r) => ({
      name: r.name,
      country: r.country,
      displayName: r.admin1
        ? `${r.name}, ${r.admin1}, ${r.country}`
        : `${r.name}, ${r.country}`,
    }));
    return NextResponse.json({ cities });
  } catch (err) {
    console.error("[GET /api/places/cities]", err);
    return NextResponse.json({ cities: [] });
  }
}
