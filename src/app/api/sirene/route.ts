import { NextRequest, NextResponse } from "next/server";
import { searchSirene } from "@/lib/sirene";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siren = searchParams.get("siren");

  if (!siren) {
    return NextResponse.json(
      { error: "Numéro SIREN/SIRET requis" },
      { status: 400 }
    );
  }

  const result = await searchSirene(siren);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
