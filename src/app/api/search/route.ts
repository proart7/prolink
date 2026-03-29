import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterDemoProfiles } from "@/data/demoProfiles";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const city = searchParams.get("city") || "";
  const postalCode = searchParams.get("postalCode") || "";
  const minRating = parseFloat(searchParams.get("minRating") || "0");
  const insuranceVerified = searchParams.get("insuranceVerified") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const skip = (page - 1) * limit;

  try {
    const where: any = {
      isActive: true,
      companyStatus: "ACTIVE",
    };

    // Recherche textuelle
    if (query) {
      where.OR = [
        { companyName: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { specialties: { hasSome: [query] } },
        { activityLabel: { contains: query, mode: "insensitive" } },
        { user: { firstName: { contains: query, mode: "insensitive" } } },
        { user: { lastName: { contains: query, mode: "insensitive" } } },
      ];
    }

    // Filtres
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (postalCode) where.postalCode = { startsWith: postalCode.slice(0, 2) };
    if (minRating > 0) where.averageRating = { gte: minRating };
    if (insuranceVerified) where.insuranceStatus = "VERIFIEE";
    if (category) {
      where.categories = {
        some: { category: { slug: category } },
      };
    }

    const [professionals, total] = await Promise.all([
      prisma.professional.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          categories: {
            include: { category: true },
          },
        },
        orderBy: [
          { averageRating: "desc" },
          { totalReviews: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.professional.count({ where }),
    ]);

    // Fusionner avec les profils démo filtrés
    const demoResults = filterDemoProfiles({
      query: query || undefined,
      city: city || undefined,
      minRating: minRating || undefined,
      insuranceVerified: insuranceVerified || undefined,
    });

    // Les vrais profils d'abord, puis les démos
    const allProfessionals = [...professionals, ...demoResults];
    const totalWithDemo = total + demoResults.length;

    // Pagination sur l'ensemble combiné
    const paginatedResults = allProfessionals.slice(skip, skip + limit);

    return NextResponse.json({
      professionals: paginatedResults,
      pagination: {
        total: totalWithDemo,
        page,
        limit,
        totalPages: Math.ceil(totalWithDemo / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);

    // En cas d'erreur DB, retourner au moins les profils démo
    const demoResults = filterDemoProfiles({
      query: query || undefined,
      city: city || undefined,
      minRating: minRating || undefined,
      insuranceVerified: insuranceVerified || undefined,
    });

    return NextResponse.json({
      professionals: demoResults.slice(skip, skip + limit),
      pagination: {
        total: demoResults.length,
        page,
        limit,
        totalPages: Math.ceil(demoResults.length / limit),
      },
    });
  }
}

