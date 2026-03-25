"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState<"particulier" | "professionnel" | null>(null);

  // Refs for outside-click detection
  const particulierMenuRef = useRef<HTMLDivElement>(null);
  const professionnelMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (particulierMenuRef.current && !particulierMenuRef.current.contains(target)) {
        if (roleMenuOpen === "particulier") {
          setRoleMenuOpen(null);
        }
      }

      if (professionnelMenuRef.current && !professionnelMenuRef.current.contains(target)) {
        if (roleMenuOpen === "professionnel") {
          setRoleMenuOpen(null);
        }
      }
    }

    if (roleMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [roleMenuOpen]);

  const toggleParticulierMenu = () => {
    setRoleMenuOpen(roleMenuOpen === "particulier" ? null : "particulier");
  };

  const toggleProfessionnelMenu = () => {
    setRoleMenuOpen(roleMenuOpen === "professionnel" ? null : "professionnel");
  };

  const closeDropdowns = () => {
    setRoleMenuOpen(null);
  };

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
                {/* Particulier Dropdown - Click-based */}
                <div className="relative" ref={particulierMenuRef}>
                  <button
                    onClick={toggleParticulierMenu}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary-300 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Je suis un particulier
                    <svg
                      className={`w-3 h-3 ml-0.5 transition-transform ${
                        roleMenuOpen === "particulier" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {roleMenuOpen === "particulier" && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <Link
                        href="/register/particulier"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        onClick={closeDropdowns}
                      >
                        Créer un compte
                      </Link>
                      <Link
                        href="/login"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        onClick={closeDropdowns}
                      >
                        Se connecter
                      </Link>
                    </div>
                  )}
                </div>

                {/* Professionnel Dropdown - Click-based */}
                <div className="relative" ref={professionnelMenuRef}>
                  <button
                    onClick={toggleProfessionnelMenu}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Je suis un professionnel
                    <svg
                      className={`w-3 h-3 ml-0.5 transition-transform ${
                        roleMenuOpen === "professionnel" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {roleMenuOpen === "professionnel" && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <Link
                        href="/register/professionnel"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        onClick={closeDropdowns}
                      >
                        Créer un compte pro
                      </Link>
                      <Link
                        href="/login"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        onClick={closeDropdowns}
                      >
                        Se connecter
                      </Link>
                    </div>
                  )}
                </div>
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
