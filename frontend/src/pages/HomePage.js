import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';

const HERO_IMAGE = "https://images.unsplash.com/photo-1634737119182-4d09e1305ba7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <section className="relative h-[85vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGE} 
            alt="Gourmet burger" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 hero-gradient" />
        </div>
        
        <div className="relative z-10 w-full px-6 pb-16 md:pb-24 md:px-12 lg:px-24">
          <div className="max-w-3xl animate-slide-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-foreground mb-4 leading-tight" data-testid="hero-title">
              Le Goût de<br />
              <span className="text-primary">l'Excellence</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Tacos, Kebabs, Burgers artisanaux. Savourez le meilleur du fast-food à Épernon.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/menu" data-testid="cta-commander">
                <Button size="lg" className="btn-glow rounded-full text-lg px-8 py-6 w-full sm:w-auto">
                  Commander maintenant
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/menu" data-testid="cta-menu">
                <Button variant="outline" size="lg" className="rounded-full text-lg px-8 py-6 w-full sm:w-auto border-white/20 hover:bg-white/10">
                  Voir le menu
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 lg:px-24 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-12" data-testid="info-title">
            Informations
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 animate-slide-up">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Adresse</h3>
              <p className="text-muted-foreground text-sm">
                3 Rue à la Paille<br />
                28230 Épernon, France
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 animate-slide-up animation-delay-100">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Horaires</h3>
              <p className="text-muted-foreground text-sm">
                Ouvert 6j/7<br />
                11h30 - 14h30 / 18h - 22h30
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 animate-slide-up animation-delay-200">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-muted-foreground text-sm">
                Tél: 02 37 83 XX XX<br />
                contact@odelices.fr
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif mb-6" data-testid="categories-title">
            Nos Spécialités
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Des produits frais préparés avec passion, du pain artisanal aux sauces maison.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Tacos', 'Kebab', 'Burgers', 'Sandwichs', 'Snacks', 'Boissons'].map((cat, i) => (
              <Link 
                key={cat} 
                to={`/menu?category=${cat}`}
                data-testid={`category-${cat.toLowerCase()}`}
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all card-glow"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-3xl mb-3 block">
                  {cat === 'Tacos' && '🌮'}
                  {cat === 'Kebab' && '🥙'}
                  {cat === 'Burgers' && '🍔'}
                  {cat === 'Sandwichs' && '🥪'}
                  {cat === 'Snacks' && '🍟'}
                  {cat === 'Boissons' && '🥤'}
                </span>
                <span className="font-medium group-hover:text-primary transition-colors">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="h-24 md:h-0" />
    </div>
  );
}
