"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface Conversation {
  id: string;
  subject: string | null;
  lastMessageAt: string;
  unreadCount: number;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
  };
  messages: {
    content: string;
    sender: { firstName: string; lastName: string };
    createdAt: string;
  }[];
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  senderId: string;
}

function MessagerieContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // RÃ©cupÃ©rer la liste des conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    if (session) loadConversations();
  }, [session]);

  // Charger les messages d'une conversation
  useEffect(() => {
    async function loadMessages() {
      if (!activeConvId) return;
      try {
        const res = await fetch(`/api/messages?conversationId=${activeConvId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {
        // handle error
      }
    }
    loadMessages();
  }, [activeConvId]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);

    try {
      const body: any = { content: newMessage };

      if (activeConvId) {
        body.conversationId = activeConvId;
      } else {
        // Nouvelle conversation depuis la page profil
        const to = searchParams.get("to");
        if (to) {
          body.recipientId = to;
          body.subject = searchParams.get("name") || undefined;
        }
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");

        // Recharger les conversations
        const convRes = await fetch("/api/messages");
        if (convRes.ok) setConversations(await convRes.json());
      }
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Messagerie</h1>
        <p className="text-gray-600">
          Connectez-vous pour accÃ©der Ã  vos messages.
        </p>
      </div>
    );
  }

  const userId = (session.user as any).id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messagerie</h1>

      <div className="card overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        <div className="flex h-full">
          {/* Liste des conversations */}
          <div className="w-80 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Chargement...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Aucune conversation
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      activeConvId === conv.id ? "bg-primary-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 font-medium text-sm">
                          {conv.otherUser?.firstName?.charAt(0)}
                          {conv.otherUser?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {conv.otherUser?.firstName}{" "}
                            {conv.otherUser?.lastName}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.messages?.[0] && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.messages[0].content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Zone de messages */}
          <div className="flex-1 flex flex-col">
            {activeConvId || searchParams.get("to") ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMe =
                      msg.senderId === userId ||
                      (msg.sender &&
                        `${msg.sender.firstName} ${msg.sender.lastName}` ===
                          session.user?.name);
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                            isMe
                              ? "bg-primary-600 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          {!isMe && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {msg.sender.firstName}
                            </p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMe ? "text-primary-200" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie */}
                <form
                  onSubmit={sendMessage}
                  className="p-4 border-t border-gray-100"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Ãcrivez votre message..."
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="btn-primary px-6"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>SÃ©lectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessageriePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>}>
      <MessagerieContent />
    </Suspense>
  );
}
