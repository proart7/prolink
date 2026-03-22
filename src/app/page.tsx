import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              La confiance au cœur de{" "}
              <span className="text-primary-200">chaque projet</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-12 leading-relaxed max-w-2xl mx-auto">
              ProLink met en relation particuliers et professionnels vérifiés.
              Entreprises certifiées via SIRENE, assurances contrôlées, avis
              authentiques.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Carte Particulier */}
              <Link
                href="/register/particulier"
                className="group bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-2xl p-6 hover:bg-opacity-20 transition-all text-left"
              >
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-30 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Je suis un particulier</h3>
                <p className="text-primary-100 text-sm mb-3">
                  Trouvez des professionnels vérifiés près de chez vous, consultez les
                  avis et contactez-les en toute confiance.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-white group-hover:gap-2 transition-all">
                  Trouver un professionnel
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              {/* Carte Professionnel */}
              <Link
                href="/register/professionnel"
                className="group bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-2xl p-6 hover:bg-opacity-20 transition-all text-left"
              >
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-30 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Je suis un professionnel</h3>
                <p className="text-primary-100 text-sm mb-3">
                  Développez votre activité, gagnez en visibilité et recevez des
                  demandes de clients qualifiés.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-white group-hover:gap-2 transition-all">
                  Créer mon profil pro
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche - Particuliers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Pour les particuliers
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trouvez le bon professionnel en 3 étapes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Recherchez",
                desc: "Utilisez notre moteur de recherche pour trouver un professionnel par métier, ville ou spécialité.",
                icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
              },
              {
                step: "02",
                title: "Vérifiez",
                desc: "Consultez le profil, les avis clients et le statut de l’assurance pour faire votre choix en confiance.",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              },
              {
                step: "03",
                title: "Contactez",
                desc: "Envoyez un message directement au professionnel via notre messagerie sécurisée.",
                icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl mb-6 group-hover:bg-primary-100 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <div className="text-sm font-bold text-primary-600 mb-2">ÉTAPE {item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/recherche" className="inline-flex items-center justify-center bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-all">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Chercher un professionnel
            </Link>
          </div>
        </div>
      </section>

      {/* Section Professionnels */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-green-50 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                Pour les professionnels
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Développez votre activité avec ProLink
              </h2>
              <div className="space-y-5">
                {[
                  {
                    title: "Profil vérifié qui inspire confiance",
                    desc: "Votre numéro SIREN vérifié rassure les particuliers et vous distingue.",
                  },
                  {
                    title: "Visibilité auprès de milliers de particuliers",
                    desc: "Apparaissez dans les résultats de recherche de votre zone géographique.",
                  },
                  {
                    title: "Gestion de votre réputation",
                    desc: "Recevez des avis vérifiés et répondez directement à vos clients.",
                  },
                  {
                    title: "Messagerie directe",
                    desc: "Échangez avec vos clients potentiels via notre messagerie intégrée.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/register/professionnel"
                  className="inline-flex items-center justify-center bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all"
                >
                  Créer mon profil professionnel
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Pourquoi ProLink ?</h3>
              </div>
              <div className="space-y-6">
                {[
                  {
                    title: "Entreprises vérifiées",
                    desc: "Chaque professionnel est vérifié via l’API SIRENE. Les entreprises radiées ne peuvent pas s’inscrire.",
                  },
                  {
                    title: "Assurance contrôlée",
                    desc: "Visualisez en un coup d’œil si l’assurance professionnelle est vérifiée et à jour.",
                  },
                  {
                    title: "Avis authentiques",
                    desc: "Des avis laissés par de vrais particuliers pour vous aider à faire le bon choix.",
                  },
                  {
                    title: "100% gratuit",
                    desc: "Inscription et utilisation gratuite pour les particuliers comme pour les professionnels.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 mt-1 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Rejoignez des milliers d&apos;utilisateurs qui font confiance à ProLink
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register/particulier"
              className="inline-flex items-center justify-center bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all"
            >
              Je cherche un professionnel
            </Link>
            <Link
              href="/register/professionnel"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary-700 transition-all"
            >
              Je suis professionnel
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}