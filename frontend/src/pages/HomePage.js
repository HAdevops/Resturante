import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, ChevronLeft, Truck, Clock, Award, Users, ShoppingBag, Plus, Percent, Star, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { useCart } from '../contexts/CartContext';
import { Helmet } from 'react-helmet';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HERO_IMAGE = "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=1920&q=85";

const CATEGORIES = [
  { id: 'tacos', name: 'Tacos', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80', description: 'Tacos français généreux' },
  { id: 'burgers', name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', description: 'Burgers artisanaux' },
  { id: 'sandwichs', name: 'Sandwichs', image: 'https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80', description: 'Pain frais et garnitures' },
  { id: 'pizzas', name: 'Pizzas', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80', description: 'Pizzas traditionnelles' },
  { id: 'snacks', name: 'Snacks', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80', description: 'Frites, nuggets et plus' },
  { id: 'boissons', name: 'Boissons', image: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=600&q=80', description: 'Rafraîchissements' }
];

const FEATURES = [
  { icon: Award, title: 'Produits Frais', description: 'Ingrédients sélectionnés' },
  { icon: Truck, title: 'Livraison Rapide', description: 'Chez vous en 30 min' },
  { icon: Clock, title: 'Recettes Originales', description: 'Préparées avec passion' },
  { icon: Users, title: 'Convivialité', description: 'En famille ou entre amis' }
];

const PROMOTIONS = [
  {
    id: 'promo1',
    title: 'Menu Tacos Complet',
    description: 'Tacos 2 viandes + Frites + Boisson',
    originalPrice: 14.90,
    promoPrice: 10.90,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
    badge: '-27%'
  },
  {
    id: 'promo2',
    title: 'Burger du Chef',
    description: 'Notre burger signature avec frites maison',
    originalPrice: 16.50,
    promoPrice: 13.50,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    badge: 'BEST'
  },
  {
    id: 'promo3',
    title: 'Pizza + Boisson',
    description: 'Pizza au choix + Boisson 50cl',
    originalPrice: 12.50,
    promoPrice: 9.90,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    badge: '-21%'
  },
  {
    id: 'promo4',
    title: 'Menu Famille',
    description: '2 Burgers + 2 Tacos + Grande Frites + 4 Boissons',
    originalPrice: 45.00,
    promoPrice: 35.90,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80',
    badge: '-20%'
  }
];

const BANNER_IMAGE = "https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?w=1920&q=80";

// Halal Badge Component
const HalalBadge = () => (
  <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full">
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
    </svg>
    <span className="font-bold text-sm">100% HALAL</span>
  </div>
);

export default function HomePage() {
  const { addItem } = useCart();
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);
  const promoRef = useRef(null);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    try {
      const res = await axios.get(`${API}/menu/products`);
      const products = res.data;
      const selected = [];
      const catRes = await axios.get(`${API}/menu/categories`);
      const categories = catRes.data;
      const catMap = {};
      categories.forEach(c => { catMap[c.id] = c.nom; });
      
      const categoryNames = ['Burgers', 'Tacos', 'Pizzas', 'Sandwichs', 'Snacks'];
      categoryNames.forEach(catName => {
        const catProducts = products.filter(p => catMap[p.category_id] === catName);
        const sample = catProducts.slice(0, 2);
        selected.push(...sample);
      });
      
      setBestSellers(selected.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 320;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.success(`${product.nom} ajouté au panier`);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Helmet>
        <title>O'Delices Épernon - Tacos, Burgers, Pizzas | Livraison & À Emporter</title>
        <meta name="description" content="O'Delices à Épernon (28230) - Restaurant Halal. Commandez en ligne vos Tacos, Burgers, Pizzas, Kebabs. Livraison rapide à Épernon, Maintenon, Hanches, Droue-sur-Drouette, Gas et environs." />
        <meta name="keywords" content="restaurant épernon, tacos épernon, burger épernon, pizza épernon, livraison épernon 28230, halal épernon, fast food maintenon, restaurant hanches, kebab épernon" />
        <meta name="geo.region" content="FR-28" />
        <meta name="geo.placename" content="Épernon" />
        <meta name="geo.position" content="48.6081;1.6621" />
        <meta property="og:title" content="O'Delices Épernon - Tacos, Burgers, Pizzas Halal" />
        <meta property="og:description" content="Commandez en ligne vos plats préférés. Livraison rapide à Épernon et environs. 100% Halal." />
        <meta property="og:type" content="restaurant" />
        <meta property="og:locale" content="fr_FR" />
        <link rel="canonical" href="https://odelices-epernon.fr" />
      </Helmet>

      <Navbar />
      
      {/* Hero Banner */}
      <section className="relative h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="O'Delices Restaurant Halal Épernon" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative z-10 text-center px-4">
          {/* Halal Badge */}
          <div className="flex justify-center mb-6">
            <HalalBadge />
          </div>
          
          {/* Logo */}
          <img 
            src="https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/y8c8rbve_oDelices%20LOGO.png" 
            alt="O'Delices Logo" 
            className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto mx-auto mb-4 drop-shadow-2xl"
            data-testid="hero-logo"
          />
          <p className="text-lg md:text-xl text-white/90 mb-2">
            Tacos • Burgers • Pizzas • Kebabs
          </p>
          <p className="text-base text-primary mb-8">
            Livraison à Épernon et environs
          </p>
          <Link to="/menu" data-testid="cta-commander">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all">
              COMMANDER EN LIGNE
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Halal Logo - Bottom Right Corner */}
        <img 
          src="https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/uegijlrg_halal%20white.png"
          alt="Certifié Halal"
          className="absolute bottom-6 right-6 md:bottom-10 md:right-10 h-16 md:h-24 w-auto z-10 opacity-90"
        />
      </section>

      {/* Promotions Section */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-b from-[#1a1a1a] to-[#222222]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Percent className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif text-white" data-testid="promotions-title">
                Nos Promotions
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-white/20 hover:bg-white/10"
                onClick={() => scrollCarousel(promoRef, 'left')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-white/20 hover:bg-white/10"
                onClick={() => scrollCarousel(promoRef, 'right')}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div
            ref={promoRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {PROMOTIONS.map(promo => (
              <Card
                key={promo.id}
                className="flex-shrink-0 w-[300px] bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border-0 rounded-2xl overflow-hidden group snap-start hover:ring-2 hover:ring-red-500 transition-all relative"
                data-testid={`promo-${promo.id}`}
              >
                {/* Promo Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {promo.badge}
                  </span>
                </div>
                
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-white mb-1">{promo.title}</h3>
                  <p className="text-sm text-white/60 mb-3">{promo.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/40 line-through">
                        {promo.originalPrice.toFixed(2)} €
                      </span>
                      <span className="text-xl font-bold text-red-500 font-mono">
                        {promo.promoPrice.toFixed(2)} €
                      </span>
                    </div>
                    <Link to="/menu">
                      <Button size="sm" className="rounded-full bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers Carousel */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-[#222222]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif text-white" data-testid="bestsellers-title">
                Nos Best-Sellers
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-white/20 hover:bg-white/10"
                onClick={() => scrollCarousel(carouselRef, 'left')}
                data-testid="carousel-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-white/20 hover:bg-white/10"
                onClick={() => scrollCarousel(carouselRef, 'right')}
                data-testid="carousel-next"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[280px] h-[360px] bg-[#2a2a2a] rounded-2xl animate-pulse" />
              ))
            ) : (
              bestSellers.map(product => (
                <Card
                  key={product.id}
                  className="flex-shrink-0 w-[280px] bg-[#2a2a2a] border-0 rounded-2xl overflow-hidden group snap-start hover:ring-2 hover:ring-primary transition-all"
                  data-testid={`bestseller-${product.id}`}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'}
                      alt={product.nom}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-white mb-1 line-clamp-1">{product.nom}</h3>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2 min-h-[2.5rem]">
                      {product.description || 'Préparé avec des ingrédients frais'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary font-mono">
                        {product.prix.toFixed(2)} €
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="rounded-full bg-primary hover:bg-primary/90 text-black"
                        data-testid={`add-bestseller-${product.id}`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 md:py-16 px-4 md:px-8 lg:px-16 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-white text-center mb-10" data-testid="categories-title">
            Nos Catégories
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((category) => (
              <Link 
                key={category.id}
                to={`/menu?category=${category.name}`}
                data-testid={`category-${category.id}`}
                className="group"
              >
                <Card className="overflow-hidden bg-[#2a2a2a] border-0 rounded-2xl hover:ring-2 hover:ring-primary transition-all duration-300">
                  <div className="relative h-48 md:h-56 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{category.name}</h3>
                      <p className="text-sm text-white/70">{category.description}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-primary font-semibold">VOIR LES PRODUITS</span>
                    <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="py-12 bg-[#222222]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {FEATURES.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner CTA with Halal */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={BANNER_IMAGE} alt="Burgers Halal O'Delices" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center px-4">
          <div className="flex justify-center mb-4">
            <HalalBadge />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white mb-6">
            Viandes 100% Halal
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Toutes nos viandes sont certifiées Halal et préparées avec soin
          </p>
          <Link to="/menu?category=Burgers">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full text-lg px-8 py-6">
              DÉCOUVRIR NOS BURGERS
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Delivery Zones */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-white mb-6">
            Zones de Livraison
          </h2>
          <p className="text-white/70 mb-8">
            Nous livrons dans un rayon de 5km autour d'Épernon
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Épernon', 'Maintenon', 'Hanches', 'Droue-sur-Drouette', 'Gas', 'Saint-Martin-de-Nigelles', 'Nogent-le-Roi'].map(town => (
              <span key={town} className="px-4 py-2 bg-[#2a2a2a] rounded-full text-white/80 text-sm">
                {town}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-[#222222]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#2a2a2a] rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Nous trouver</h3>
                <p className="text-white/70 mb-2">3 Rue à la Paille</p>
                <p className="text-white/70 mb-4">28230 Épernon, France</p>
                <p className="text-primary font-semibold">Tél: 02 19 02 30 94</p>
                <p className="text-primary font-semibold">&  06 26 79 16 29</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Horaires</h3>
                <p className="text-white/70 mb-2">Ouvert 6 jours sur 7</p>
                <p className="text-white/70 mb-1">11h30 - 14h30</p>
                <p className="text-white/70">18h00 - 22h30</p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10 text-center">
              <Link to="/menu">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-10">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Commander maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/y8c8rbve_oDelices%20LOGO.png" 
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
                src="https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/uegijlrg_halal%20white.png"
                alt="Certifié Halal"
                className="h-16 md:h-20 w-auto opacity-80"
              />
            </div>
          </div>

          {/* Privacy Policy */}
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
        </div>
      </footer>

      {/* Footer spacing for mobile nav */}
      <div className="h-20 md:h-0 bg-[#111111]" />
    </div>
  );
}
