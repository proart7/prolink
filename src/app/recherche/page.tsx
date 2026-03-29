"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Professional {
  id: string;
  companyName: string;
  description: string | null;
  specialties: string[];
  city: string | null;
  postalCode: string | null;
  averageRating: number;
  totalReviews: number;
  insuranceStatus: string;
  activityLabel: string | null;
  serviceArea: string | null;
  isDemo?: boolean;
  avatarColor?: string;
  avatarInitials?: string;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  categories: { category: { name: string; slug: string } }[];
}

export default function RecherchePage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [insuranceOnly, setInsuranceOnly] = useState(false);
  const [results, setResults] = useState<Professional[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (p = 1) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (city) params.set("city", city);
      if (minRating > 0) params.set("minRating", String(minRating));
      if (insuranceOnly) params.set("insuranceVerified", "true");
      params.set("page", String(p));

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      setResults(data.professionals || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
      setPage(p);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, city, minRating, insuranceOnly]);

  // Charger tous les profils au chargement de la page
  useEffect(() => {
    search(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getAvatarStyle = (pro: Professional) => {
    if (pro.avatarColor) {
      return { backgroundColor: pro.avatarColor };
    }
    return {};
  };

  const getInitials = (pro: Professional) => {
    if (pro.avatarInitials) return pro.avatarInitials;
    return pro.companyName.charAt(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Trouvez un professionnel
        </h1>
        <p className="text-gray-600">
          Recherchez parmi nos professionnels vérifiés
        </p>
      </div>

      {/* Barre de recherche */}
      <form
        onSubmit={handleSubmit}
        className="card p-6 mb-8"
      >
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Métier ou spécialité
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field"
              placeholder="Plombier, électricien, avocat..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input-field"
              placeholder="Paris, Lyon, Marseille..."
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rechercher
              </span>
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Note minimum :</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value={0}>Toutes</option>
              <option value={3}>3+ étoiles</option>
              <option value={4}>4+ étoiles</option>
              <option value={4.5}>4.5+ étoiles</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={insuranceOnly}
              onChange={(e) => setInsuranceOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">
              Assurance vérifiée uniquement
            </span>
          </label>
        </div>
      </form>

      {/* Résultats */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Recherche en cours...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 card">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun résultat
          </h3>
          <p className="text-gray-600">
            Essayez d&apos;élargir vos critères de recherche
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {total} professionnel{total > 1 ? "s" : ""} trouvé
            {total > 1 ? "s" : ""}
          </p>

          <div className="grid gap-4">
            {results.map((pro) => (
              <div
                key={pro.id}
                className="card p-6 flex flex-col sm:flex-row gap-4 hover:border-primary-200 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={pro.avatarColor ? { backgroundColor: pro.avatarColor } : {}}
                  >
                    <span className="text-white font-bold text-xl" style={!pro.avatarColor ? { color: '#4F46E5' } : {}}>
                      {getInitials(pro)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {pro.companyName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {pro.user.firstName} {pro.user.lastName}
                        {pro.city && ` — ${pro.city}`}
                        {pro.postalCode && ` (${pro.postalCode})`}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {pro.insuranceStatus === "VERIFIEE" && (
                        <span className="badge-verified">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Assuré
                        </span>
                      )}
                    </div>
                  </div>

                  {pro.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {pro.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      {renderStars(pro.averageRating)}
                      <span className="text-sm font-medium text-gray-700">
                        {pro.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-400">
                        ({pro.totalReviews} avis)
                      </span>
                    </div>
                    {pro.specialties && pro.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pro.specialties.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {pro.serviceArea && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {pro.serviceArea}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => search(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

