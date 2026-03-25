import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: "Paramètre 'q' requis" },
        { status: 400 }
      );
    }

    // Call the French commune API
    const url = new URL("https://geo.api.gouv.fr/communes");
    url.searchParams.append("nom", q);
    url.searchParams.append("fields", "nom,code,codesPostaux,centre");
    url.searchParams.append("boost", "population");
    url.searchParams.append("limit", "7");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération des communes" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Communes API error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
