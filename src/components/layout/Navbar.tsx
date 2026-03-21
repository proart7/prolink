"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Pro<span className="text-primary-600">Link</span>
            </span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/recherche"
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
            >
              Rechercher
            </Link>

            {status === "authenticated" ? (
              <>
                <Link
                  href="/messagerie"
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Messages
                </Link>
                <Link
                  href={
                    (session.user as any).role === "PROFESSIONNEL"
                      ? "/dashboard/professionnel"
                      : "/dashboard/particulier"
                  }
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Tableau de bord
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                      <Link
                        href={
                          (session.user as any).role === "PROFESSIONNEL"
                            ? "/dashboard/professionnel"
                            : "/dashboard/particulier"
                        }
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        Mon profil
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                  Connexion
                </Link>
                <Link href="/register/particulier" className="btn-primary text-sm py-2 px-4">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Menu mobile */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white py-4 px-4 space-y-3">
          <Link href="/recherche" className="block text-gray-600 font-medium py-2">
            Rechercher
          </Link>
          {status === "authenticated" ? (
            <>
              <Link href="/messagerie" className="block text-gray-600 font-medium py-2">
                Messages
              </Link>
              <Link
                href={
                  (session.user as any).role === "PROFESSIONNEL"
                    ? "/dashboard/professionnel"
                    : "/dashboard/particulier"
                }
                className="block text-gray-600 font-medium py-2"
              >
                Tableau de bord
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 font-medium py-2"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                Connexion
              </Link>
              <Link href="/register/particulier" className="btn-primary text-sm py-2 px-4">
                Inscription
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
