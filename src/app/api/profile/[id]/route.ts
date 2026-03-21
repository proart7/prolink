import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            createdAt: true,
          },
        },
        reviews: {
          include: {
            author: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        categories: {
          include: { category: true },
        },
      },
    });

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(professional);
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du profil" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const professional = await prisma.professional.findUnique({
      where: { id: params.id },
    });

    if (!professional || professional.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await prisma.professional.update({
      where: { id: params.id },
      data: {
        description: body.description,
        specialties: body.specialties,
        serviceArea: body.serviceArea,
        website: body.website,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
