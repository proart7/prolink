import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";

// Envoyer un message (ou créer une conversation)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = messageSchema.parse(body);
    const userId = (session.user as any).id;

    let conversationId = validated.conversationId;

    // Si pas de conversation existante, en créer une nouvelle
    if (!conversationId && validated.recipientId) {
      // Vérifier s'il existe déjà une conversation entre ces deux utilisateurs
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: validated.recipientId } } },
          ],
        },
      });

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        const newConversation = await prisma.conversation.create({
          data: {
            subject: validated.subject || null,
            participants: {
              create: [
                { userId },
                { userId: validated.recipientId },
              ],
            },
          },
        });
        conversationId = newConversation.id;
      }
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ou destinataire requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });
    if (!participant) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        content: validated.content,
        senderId: userId,
        conversationId,
      },
      include: {
        sender: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // Mettre à jour lastMessageAt et incrémenter les unread des autres participants
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: userId },
      },
      data: { unreadCount: { increment: 1 } },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    if (error.issues) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Message error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}

// Récupérer les conversations de l'utilisateur
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  // Si conversationId fourni, retourner les messages de cette conversation
  if (conversationId) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    });
    if (!participant) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Marquer comme lu
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: { userId, conversationId },
      },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  }

  // Sinon, retourner la liste des conversations
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Ajouter le unreadCount de l'utilisateur connecté
  const result = conversations.map((conv) => {
    const myParticipation = conv.participants.find((p) => p.userId === userId);
    const otherParticipant = conv.participants.find((p) => p.userId !== userId);
    return {
      ...conv,
      unreadCount: myParticipation?.unreadCount || 0,
      otherUser: otherParticipant?.user,
    };
  });

  return NextResponse.json(result);
}
