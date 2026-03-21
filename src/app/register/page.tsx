import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inscription</h1>
          <p className="text-gray-600 mt-2">
            Choisissez votre type de compte
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/register/particulier"
            className="card p-6 hover:border-primary-200 group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Je suis un particulier
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Je cherche un professionnel pour un projet ou un service
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/register/professionnel"
            className="card p-6 hover:border-primary-200 group text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Je suis un professionnel
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Je veux proposer mes services et développer ma clientèle
                </p>
                <p className="text-primary-600 text-xs mt-2 font-medium">
                  Inscription avec vérification SIREN
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
