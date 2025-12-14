import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ODELICES_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/y8c8rbve_oDelices%20LOGO.png";
const HALAL_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/uegijlrg_halal%20white.png";

export default function Footer({ showPrivacyPolicy = true }) {
  return (
    <>
      <footer className="bg-[#111111] py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img 
                src={ODELICES_LOGO}
                alt="O'Delices Logo" 
                className="h-16 w-auto"
              />
            </div>

            {/* Copyright */}
            <div className="text-center">
              <p className="text-white/50 text-sm">
                © {new Date().getFullYear()} O'Delices Épernon. Tous droits réservés.
              </p>
              <p className="text-white/40 text-xs mt-1">
                Tacos • Burgers • Pizzas • Kebabs - Livraison à Épernon et environs
              </p>
            </div>

            {/* Halal Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={HALAL_LOGO}
                alt="Certifié Halal"
                className="h-16 md:h-20 w-auto opacity-80"
              />
            </div>
          </div>

          {/* Privacy Policy */}
          {showPrivacyPolicy && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <details className="group">
                <summary className="cursor-pointer text-primary font-semibold text-lg mb-4 flex items-center gap-2 hover:text-primary/80 transition-colors">
                  <span>Politique de confidentialité</span>
                  <ChevronRight className="w-5 h-5 transform group-open:rotate-90 transition-transform" />
                </summary>
                <div className="text-white/70 text-sm space-y-4 pl-2 max-w-4xl">
                  <p className="text-white/50 italic">Mis à jour le 18/04/2025</p>
                  
                  <p>Votre vie privée est importante pour nous. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles lorsque vous utilisez notre site Web et nos services de commande en ligne.</p>
                  
                  <div>
                    <h4 className="text-white font-semibold mb-2">Collecte d'informations</h4>
                    <p className="mb-2">Nous collectons les informations suivantes lorsque vous utilisez notre site Web :</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Vos coordonnées (nom, adresse, numéro de téléphone, adresse e-mail).</li>
                      <li><strong>Informations de paiement:</strong> Si vous choisissez de payer en ligne, veuillez noter que nous ne stockons pas votre numéro de la carte bancaire dans notre base de données. Tous les paiements par carte bancaire sont 100% sécurisés. Vos données bancaires, y compris le numéro de carte et la date d'expiration, sont cryptées à l'aide de la technologie SSL. Elles ne circulent pas en clair sur Internet et ne peuvent être interceptées.</li>
                      <li>Informations de commande (articles commandés, historique des commandes).</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Utilisation des informations</h4>
                    <p className="mb-2">Nous utilisons les informations collectées pour :</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Faciliter le processus de commande en ligne et la livraison.</li>
                      <li>Communiquer avec vous concernant vos commandes et offres spéciales.</li>
                      <li>Améliorer notre site Web et nos services.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Partage des informations</h4>
                    <p className="mb-2">Nous ne partageons vos informations personnelles qu'avec des tiers dans les circonstances suivantes :</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Avec les prestataires de paiement pour le traitement des paiements en ligne.</li>
                      <li>Avec les prestataires de livraison pour effectuer les livraisons.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Sécurité des informations</h4>
                    <p>Nous mettons en place des mesures de sécurité pour protéger vos informations personnelles. Cependant, aucune méthode de transmission sur Internet ni de stockage électronique n'est totalement sécurisée. Nous ne pouvons garantir la sécurité de vos informations.</p>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Vos choix</h4>
                    <p>Vous pouvez :</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Accéder, mettre à jour ou supprimer vos informations personnelles en vous connectant à votre compte.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Médiation de la consommation</h4>
                    <p>Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, nous informons nos clients qu'en cas de litige, ils peuvent recourir à un médiateur de la consommation. Les coordonnées du médiateur auquel nous adhérons seront communiquées sur simple demande.</p>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Opposition au démarchage téléphonique</h4>
                    <p>Conformément à l'article L.223-2 du Code de la consommation, si nous sommes amenés à recueillir vos données téléphoniques, vous êtes informés de votre droit à vous inscrire gratuitement sur la liste d'opposition au démarchage téléphonique Bloctel (<a href="https://www.bloctel.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.bloctel.gouv.fr</a>).</p>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold mb-2">Contact</h4>
                    <p>Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter sur la page <Link to="/contact" className="text-primary hover:underline">Contact</Link>.</p>
                  </div>

                  <p className="pt-4 border-t border-white/10 text-white/50">Merci d'utiliser notre service de commande en ligne.</p>
                </div>
              </details>
            </div>
          )}
        </div>
      </footer>

      {/* Footer spacing for mobile nav */}
      <div className="h-20 md:h-0 bg-[#111111]" />
    </>
  );
}
