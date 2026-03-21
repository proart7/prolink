import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-white">
                Pro<span className="text-primary-400">Link</span>
              </span>
            </div>
            <p className="text-sm text-gray-400">
              La plateforme de confiance pour trouver et contacter des
              professionnels vérifiés près de chez vous.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Particuliers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/recherche" className="hover:text-white transition-colors">
                  Trouver un pro
                </Link>
              </li>
              <li>
                <Link href="/register/particulier" className="hover:text-white transition-colors">
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Comment ça marche
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Professionnels</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register/professionnel" className="hover:text-white transition-colors">
                  Rejoindre ProLink
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Avantages
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  CGU
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ProLink. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
