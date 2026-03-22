"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ProfessionalProfile {
  id: string;
  companyName: string;
  description: string | null;
  specialties: string[];
  serviceArea: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  website: string | null;
  averageRating: number;
  totalReviews: number;
  insuranceStatus: string;
  insuranceCompany: string | null;
  isVerified: boolean;
  activityLabel: string | null;
  activityCode: string | null;
  siren: string;
  responseRate: number;
  responseTime: number | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    createdAt: string;
  };
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    response: string | null;
    createdAt: string;
    author: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  }[];
  categories: { category: { name: string; slug: string } }[];
}

export default function ProfessionnelPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/profile/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewForm,
          professionalId: profile.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setReviewError(data.error || "Erreur");
        return;
      }

      // Recharger le profil
      const updated = await fetch(`/api/profile/${params.id}`);
      if (updated.ok) setProfile(await updated.json());
      setReviewForm({ rating: 5, title: "", comment: "" });
    } catch {
      setReviewError("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={
            interactive
              ? () => setReviewForm({ ...reviewForm, rating: star })
              : undefined
          }
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <svg
            className={`w-5 h-5 ${
              star <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Professionnel non trouvé
        </h1>
        <Link href="/recherche" className="btn-primary mt-4 inline-block">
          Retour à la recherche
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête du profil */}
      <div className="card p-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center">
              <span className="text-primary-700 font-bold text-3xl">
                {profile.companyName.charAt(0)}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.companyName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {profile.user.firstName} {profile.user.lastName}
                </p>
              </div>
              {session?.user && (session.user as any).role === "PARTICULIER" && (
                <Link
                  href={`/messagerie?to=${profile.user?.id || ""}&name=${encodeURIComponent(profile.companyName)}`}
                  className="btn-primary text-sm"
                >
                  Contacter
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                {renderStars(profile.averageRating)}
                <span className="font-semibold">
                  {profile.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-500 text-sm">
                  ({profile.totalReviews} avis)
                </span>
              </div>

              {profile.insuranceStatus === "VERIFIEE" ? (
                <span className="badge-verified">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Assurance vérifiée
                </span>
              ) : (
                <span className="badge-unverified">
                  Assurance non vérifiée
                </span>
              )}

              {profile.isVerified && (
                <span className="badge-verified">Profil vérifié</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {profile.description && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                À propos
              </h2>
              <p className="text-gray-600 whitespace-pre-line">
                {profile.description}
              </p>
            </div>
          )}

          {/* Avis */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Avis clients ({profile.totalReviews})
            </h2>

            {profile.reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-6">
                Aucun avis pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {profile.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {review.author.firstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {review.author.firstName} {review.author.lastName.charAt(0)}.
                        </span>
                        <span className="text-gray-400 text-xs ml-2">
                          {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="ml-auto">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-gray-900 text-sm">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-gray-600 text-sm mt-1">
                      {review.comment}
                    </p>
                    {review.response && (
                      <div className="mt-3 ml-4 pl-4 border-l-2 border-primary-200">
                        <p className="text-sm text-gray-500 font-medium">
                          Réponse du professionnel :
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {review.response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire d'avis */}
            {session?.user && (session.user as any).role === "PARTICULIER" && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-medium text-gray-900 mb-4">
                  Laisser un avis
                </h3>

                {reviewError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {reviewError}
                  </div>
                )}

                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Note
                    </label>
                    {renderStars(reviewForm.rating, true)}
                  </div>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    className="input-field"
                    placeholder="Titre (optionnel)"
                  />
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    className="input-field min-h-[100px] resize-y"
                    placeholder="Votre avis (min. 10 caractères)..."
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? "Envoi..." : "Publier mon avis"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3 text-sm">
              {profile.city && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600">
                    {profile.address && `${profile.address}, `}
                    {profile.city}
                    {profile.postalCode && ` (${profile.postalCode})`}
                  </span>
                </div>
              )}
              {profile.serviceArea && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                  <span className="text-gray-600">
                    Zone : {profile.serviceArea}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
                <span className="text-gray-600">SIREN : {profile.siren}</span>
              </div>
              {profile.website && (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    Site web
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Assurance */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Assurance</h3>
            {profile.insuranceStatus === "VERIFIEE" ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800">Assurance vérifiée</p>
                  {profile.insuranceCompany && (
                    <p className="text-sm text-gray-600 mt-1">
                      {profile.insuranceCompany}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  L&apos;assurance de ce professionnel n&apos;a pas encore été vérifiée.
                </p>
              </div>
            )}
          </div>

          {profile.specialties.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Spécialités
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
