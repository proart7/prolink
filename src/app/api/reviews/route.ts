import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = reviewSchema.parse(body);
    const userId = (session.user as any).id;

    // Vérifier que l'utilisateur est un particulier
    if ((session.user as any).role !== "PARTICULIER") {
      return NextResponse.json(
        { error: "Seuls les particuliers peuvent laisser des avis" },
        { status: 403 }
      );
    }

    // Vérifier que le professionnel existe
    const professional = await prisma.professional.findUnique({
      where: { id: validated.professionalId },
    });
    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      );
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        rating: validated.rating,
        title: validated.title,
        comment: validated.comment,
        authorId: userId,
        professionalId: validated.professionalId,
      },
      include: {
        author: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Mettre à jour la note moyenne du professionnel
    const stats = await prisma.review.aggregate({
      where: { professionalId: validated.professionalId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.professional.update({
      where: { id: validated.professionalId },
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    if (error.issues) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Review error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'avis" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get("professionalId");

  if (!professionalId) {
    return NextResponse.json(
      { error: "ID du professionnel requis" },
      { status: 400 }
    );
  }

  const reviews = await prisma.review.findMany({
    where: { professionalId },
    include: {
      author: {
        select: { firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}
