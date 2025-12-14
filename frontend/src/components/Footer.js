import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Lock, CreditCard, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const ODELICES_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/y8c8rbve_oDelices%20LOGO.png";
const HALAL_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/uegijlrg_halal%20white.png";

// SVG Card Icons as components for reliability
const VisaIcon = () => (
  <svg viewBox="0 0 48 48" className="h-8 w-12">
    <rect fill="#1565C0" x="0" y="10" width="48" height="28" rx="4"/>
    <path fill="#FFF" d="M19.5 28.5h-3.8l2.4-14h3.8L19.5 28.5zM32.8 14.8c-.8-.3-2-.6-3.5-.6-3.8 0-6.5 2-6.5 4.8 0 2.1 1.9 3.3 3.4 4 1.5.7 2 1.2 2 1.9 0 1-.1.2 1.5-2.4 1.5 0 2.5-.5 3.2-.8l.5 2.8c-.8.4-2.3.7-3.8.7-4 0-6.8-2.1-6.8-5.1 0-3.4 3-5.1 6.2-5.1 1.7 0 3.1.4 3.9.7L32.8 14.8zM38.1 28.5h3.5l-3-14h-3.1c-.7 0-1.3.4-1.6 1l-5.4 13h3.8l.8-2.1h4.6L38.1 28.5zM35.5 23.8l1.9-5.2 1.1 5.2H35.5zM15.3 14.5l-3.6 9.5-.4-1.9c-.7-2.3-2.8-4.8-5.2-6l3.2 12.3h3.8l5.7-14H15.3z"/>
    <path fill="#FFC107" d="M9.6 14.5H4l0 .3c4.5 1.1 7.5 4 8.7 7.3l-1.3-6.3C11.2 14.9 10.5 14.5 9.6 14.5z"/>
  </svg>
);

const MastercardIcon = () => (
  <svg viewBox="0 0 48 48" className="h-8 w-12">
    <rect fill="#3F51B5" x="0" y="10" width="48" height="28" rx="4"/>
    <circle fill="#E53935" cx="19" cy="24" r="9"/>
    <circle fill="#FF9800" cx="29" cy="24" r="9"/>
    <path fill="#FF7043" d="M24 17.2c2.2 1.7 3.6 4.3 3.6 7.3s-1.4 5.6-3.6 7.3c-2.2-1.7-3.6-4.3-3.6-7.3S21.8 18.9 24 17.2z"/>
  </svg>
);

const CBIcon = () => (
  <svg viewBox="0 0 48 48" className="h-8 w-12">
    <rect fill="#0D47A1" x="0" y="10" width="48" height="28" rx="4"/>
    <rect fill="#4CAF50" x="4" y="14" width="18" height="10" rx="2"/>
    <rect fill="#4CAF50" x="4" y="26" width="18" height="8" rx="2"/>
    <text x="28" y="28" fill="#FFF" fontSize="10" fontWeight="bold" fontFamily="Arial">CB</text>
  </svg>
);

const AmexIcon = () => (
  <svg viewBox="0 0 48 48" className="h-8 w-12">
    <rect fill="#2196F3" x="0" y="10" width="48" height="28" rx="4"/>
    <text x="24" y="28" fill="#FFF" fontSize="8" fontWeight="bold" fontFamily="Arial" textAnchor="middle">AMEX</text>
  </svg>
);

export default function Footer({ showPrivacyPolicy = true }) {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="bg-[#111111] py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
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

          {/* Secure Payment Section */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
              {/* SSL Secure Badge */}
              <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                <div className="relative">
                  <Lock className="w-5 h-5 text-green-500" />
                  <ShieldCheck className="w-3 h-3 text-green-400 absolute -bottom-1 -right-1" />
                </div>
                <div className="text-left">
                  <p className="text-green-400 font-semibold text-sm">SSL Sécurisé</p>
                  <p className="text-green-500/70 text-xs">Connexion cryptée</p>
                </div>
              </div>

              {/* Payment Cards */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-white/50 text-xs uppercase tracking-wider">Paiement 100% sécurisé</p>
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  {/* Visa */}
                  <div className="bg-white rounded px-2 py-1">
                    <img src={VISA_LOGO} alt="Visa" className="h-6 w-auto" />
                  </div>
                  {/* Mastercard */}
                  <div className="bg-white rounded px-2 py-1">
                    <img src={MASTERCARD_LOGO} alt="Mastercard" className="h-6 w-auto" />
                  </div>
                  {/* CB */}
                  <div className="bg-white rounded px-2 py-1">
                    <img src={CB_LOGO} alt="Carte Bancaire" className="h-6 w-auto" />
                  </div>
                  {/* Generic Card Icon */}
                  <div className="flex items-center gap-1 text-white/60">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Secure Transaction Badge */}
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
                <Shield className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p className="text-blue-400 font-semibold text-sm">Transaction sécurisée</p>
                  <p className="text-blue-500/70 text-xs">Données protégées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Policy Link */}
          {showPrivacyPolicy && (
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <button
                onClick={() => setIsPrivacyOpen(true)}
                className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors group"
              >
                <Shield className="w-5 h-5" />
                <span>Politique de confidentialité</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Privacy Policy Popup */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-[#1a1a1a] border-white/10 p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-white/10 bg-[#222222]">
            <DialogTitle className="flex items-center gap-3 text-xl text-white">
              <Shield className="w-6 h-6 text-primary" />
              Politique de confidentialité
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] px-6 py-4">
            <div className="text-white/70 text-sm space-y-6">
              <p className="text-white/50 italic text-xs">Mis à jour le 18/04/2025</p>
              
              <p className="text-base">
                Votre vie privée est importante pour nous. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles lorsque vous utilisez notre site Web et nos services de commande en ligne.
              </p>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">1</span>
                  Collecte d'informations
                </h4>
                <p className="mb-3 text-white/60">Nous collectons les informations suivantes lorsque vous utilisez notre site Web :</p>
                <ul className="list-none space-y-2 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Vos coordonnées (nom, adresse, numéro de téléphone, adresse e-mail).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-white">Informations de paiement:</strong> Si vous choisissez de payer en ligne, veuillez noter que nous ne stockons pas votre numéro de la carte bancaire dans notre base de données. Tous les paiements par carte bancaire sont 100% sécurisés. Vos données bancaires, y compris le numéro de carte et la date d'expiration, sont cryptées à l'aide de la technologie SSL. Elles ne circulent pas en clair sur Internet et ne peuvent être interceptées.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Informations de commande (articles commandés, historique des commandes).</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">2</span>
                  Utilisation des informations
                </h4>
                <p className="mb-3 text-white/60">Nous utilisons les informations collectées pour :</p>
                <ul className="list-none space-y-2 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Faciliter le processus de commande en ligne et la livraison.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Communiquer avec vous concernant vos commandes et offres spéciales.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Améliorer notre site Web et nos services.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">3</span>
                  Partage des informations
                </h4>
                <p className="mb-3 text-white/60">Nous ne partageons vos informations personnelles qu'avec des tiers dans les circonstances suivantes :</p>
                <ul className="list-none space-y-2 pl-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Avec les prestataires de paiement pour le traitement des paiements en ligne.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Avec les prestataires de livraison pour effectuer les livraisons.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">4</span>
                  Sécurité des informations
                </h4>
                <p className="text-white/60">Nous mettons en place des mesures de sécurité pour protéger vos informations personnelles. Cependant, aucune méthode de transmission sur Internet ni de stockage électronique n'est totalement sécurisée. Nous ne pouvons garantir la sécurité de vos informations.</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">5</span>
                  Vos choix
                </h4>
                <p className="text-white/60">Vous pouvez :</p>
                <ul className="list-none space-y-2 pl-2 mt-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Accéder, mettre à jour ou supprimer vos informations personnelles en vous connectant à votre compte.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">6</span>
                  Médiation de la consommation
                </h4>
                <p className="text-white/60">Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, nous informons nos clients qu'en cas de litige, ils peuvent recourir à un médiateur de la consommation. Les coordonnées du médiateur auquel nous adhérons seront communiquées sur simple demande.</p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">7</span>
                  Opposition au démarchage téléphonique
                </h4>
                <p className="text-white/60">
                  Conformément à l'article L.223-2 du Code de la consommation, si nous sommes amenés à recueillir vos données téléphoniques, vous êtes informés de votre droit à vous inscrire gratuitement sur la liste d'opposition au démarchage téléphonique Bloctel (
                  <a href="https://www.bloctel.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.bloctel.gouv.fr</a>
                  ).
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">8</span>
                  Contact
                </h4>
                <p className="text-white/60">
                  Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter sur la page{' '}
                  <Link to="/contact" className="text-primary hover:underline" onClick={() => setIsPrivacyOpen(false)}>Contact</Link>.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-white/40 text-xs">Merci d'utiliser notre service de commande en ligne.</p>
              </div>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t border-white/10 bg-[#222222]">
            <Button 
              onClick={() => setIsPrivacyOpen(false)}
              className="w-full bg-primary hover:bg-primary/90 text-black font-semibold rounded-full"
            >
              J'ai compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer spacing for mobile nav */}
      <div className="h-20 md:h-0 bg-[#111111]" />
    </>
  );
}
