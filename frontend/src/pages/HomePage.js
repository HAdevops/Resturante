import { Link } from 'react-router-dom';
import { ChevronRight, Truck, Clock, Award, Users, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Navbar from '../components/Navbar';

const HERO_IMAGE = "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=1920&q=85";

const CATEGORIES = [
  {
    id: 'tacos',
    name: 'Tacos',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
    description: 'Tacos français généreux'
  },
  {
    id: 'kebab',
    name: 'Kebab',
    image: 'https://images.unsplash.com/photo-1644364935906-792b2245a2c0?w=600&q=80',
    description: 'Viande grillée savoureuse'
  },
  {
    id: 'burgers',
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    description: 'Burgers artisanaux'
  },
  {
    id: 'sandwichs',
    name: 'Sandwichs',
    image: 'https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80',
    description: 'Pain frais et garnitures'
  },
  {
    id: 'snacks',
    name: 'Snacks',
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80',
    description: 'Frites, nuggets et plus'
  },
  {
    id: 'boissons',
    name: 'Boissons',
    image: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=600&q=80',
    description: 'Rafraîchissements'
  }
];

const FEATURES = [
  {
    icon: Award,
    title: 'Produits Frais',
    description: 'Ingrédients sélectionnés avec soin'
  },
  {
    icon: Truck,
    title: 'Livraison Rapide',
    description: 'Chez vous en 30 minutes'
  },
  {
    icon: Clock,
    title: 'Recettes Originales',
    description: 'Préparées avec passion'
  },
  {
    icon: Users,
    title: 'Convivialité',
    description: 'En famille ou entre amis'
  }
];

const BANNER_IMAGE = "https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?w=1920&q=80";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navbar />
      
      {/* Hero Banner */}
      <section className="relative h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGE} 
            alt="O'Delices" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-6 drop-shadow-lg" data-testid="hero-title">
            O'Delices
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Tacos, Kebabs, Burgers artisanaux<br />
            Livraison et à emporter à Épernon
          </p>
          <Link to="/menu" data-testid="cta-commander">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all">
              COMMANDER EN LIGNE
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
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

      {/* Banner CTA */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={BANNER_IMAGE} 
            alt="Burgers" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center px-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white mb-6">
            Nos Burgers Artisanaux
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Préparés avec des ingrédients frais et de qualité
          </p>
          <Link to="/menu?category=Burgers">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full text-lg px-8 py-6">
              DÉCOUVRIR
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#2a2a2a] rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Nous trouver</h3>
                <p className="text-white/70 mb-2">3 Rue à la Paille</p>
                <p className="text-white/70 mb-4">28230 Épernon, France</p>
                <p className="text-primary font-semibold">Tél: 02 37 83 XX XX</p>
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

      {/* Footer spacing for mobile nav */}
      <div className="h-20 md:h-0 bg-[#1a1a1a]" />
    </div>
  );
}
