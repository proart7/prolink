"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CompanyInfo {
  siren: string;
  companyName: string;
  activityCode: string;
  activityLabel: string;
  address: string;
  city: string;
  postalCode: string;
  status: string;
}

export default function RegisterProfessionnelPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = SIREN, 2 = infos perso
  const [siren, setSiren] = useState("");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [sireneLoading, setSireneLoading] = useState(false);
  const [sireneError, setSireneError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    description: "",
    serviceArea: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Recherche SIRENE
  const searchSirene = useCallback(async () => {
    const cleaned = siren.replace(/\s/g, "");
    if (!/^\d{9}$/.test(cleaned) && !/^\d{14}$/.test(cleaned)) {
      setSireneError("Entrez un SIREN (9 chiffres) ou SIRET (14 chiffres)");
      return;
    }

    setSireneLoading(true);
    setSireneError("");

    try {
      const res = await fetch(`/api/sirene?siren=${cleaned}`);
      const data = await res.json();

      if (!res.ok) {
        setSireneError(data.message || data.error || "Entreprise non trouvée");
        return;
      }

      if (data.status === "radiee") {
        setSireneError(
          "Cette entreprise est radiée (cessée). L'inscription n'est pas possible."
        );
        return;
      }

      setCompanyInfo(data);
      setStep(2);
    } catch {
      setSireneError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setSireneLoading(false);
    }
  }, [siren]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          siren: siren.replace(/\s/g, ""),
          type: "professionnel",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        return;
      }

      router.push("/login?registered=true&type=pro");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Inscription Professionnel
          </h1>
          <p className="text-gray-600 mt-2">
            Rejoignez ProLink et développez votre activité
          </p>

          {/* Indicateur d'étapes */}
          <div className="flex items-center justify-center mt-6 gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                step === 1
                  ? "bg-primary-100 text-primary-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {step > 1 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span>1</span>
              )}
              Vérification SIREN
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                step === 2
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span>2</span>
              Informations
            </div>
          </div>
        </div>

        <div className="card p-8">
          {/* ÉTAPE 1 : Vérification SIREN */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Numéro SIREN ou SIRET
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={siren}
                    onChange={(e) => {
                      setSiren(e.target.value);
                      setSireneError("");
                    }}
                    className="input-field flex-1"
                    placeholder="123 456 789 ou 12345678901234"
                    maxLength={17}
                  />
                  <button
                    onClick={searchSirene}
                    disabled={sireneLoading}
                    className="btn-primary whitespace-nowrap"
                  >
                    {sireneLoading ? "Recherche..." : "Vérifier"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Nous vérifions votre entreprise via le registre SIRENE de
                  l&apos;INSEE
                </p>
              </div>

              {sireneError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {sireneError}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Pourquoi vérifier le SIREN ?
                </h3>
                <p className="text-sm text-blue-700">
                  La vérification SIREN garantit aux particuliers que vous êtes
                  une entreprise légalement enregistrée et active. Les
                  entreprises radiées ne peuvent pas s&apos;inscrire sur ProLink.
                </p>
              </div>

              <div className="text-center text-sm text-gray-600">
                Déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="text-primary-600 font-medium hover:underline"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Informations personnelles */}
          {step === 2 && (
            <>
              {/* Résumé entreprise */}
              {companyInfo && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-green-900">
                        Entreprise vérifiée
                      </h3>
                      <p className="text-green-800 font-medium mt-1">
                        {companyInfo.companyName}
                      </p>
                      <p className="text-green-700 text-sm">
                        SIREN : {companyInfo.siren}
                        {companyInfo.city && ` — ${companyInfo.city}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-3 text-sm text-green-700 underline"
                  >
                    Modifier le SIREN
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="contact@votre-entreprise.fr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description de votre activité
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="input-field min-h-[100px] resize-y"
                    placeholder="Décrivez vos services, votre expérience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Zone d&apos;intervention
                  </label>
                  <input
                    type="text"
                    name="serviceArea"
                    value={form.serviceArea}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: Paris et Île-de-France"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? "Inscription en cours..." : "Créer mon compte professionnel"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
