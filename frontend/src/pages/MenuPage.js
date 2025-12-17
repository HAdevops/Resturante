import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import Navbar from '../components/Navbar';
import UpsellPopup from '../components/UpsellPopup';
import { useCart } from '../contexts/CartContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_IMAGES = {
  'Tacos': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  'Kebab': 'https://images.unsplash.com/photo-1644364935906-792b2245a2c0?w=600&q=80',
  'Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  'Sandwichs': 'https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80',
  'Pizzas': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
  'Assiettes': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  'Salades': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  'Paninis': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  'Snacks': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80',
  'Desserts': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
  'Boissons': 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=600&q=80',
  'Menus': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80'
};

export default function MenuPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || null);
  const [loading, setLoading] = useState(true);
  const { addItem, showUpsellPopup, triggerUpsellPopup, closeUpsellPopup, itemCount } = useCart();

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  const fetchMenu = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API}/menu/categories`),
        axios.get(`${API}/menu/products`)
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        return cat?.nom === selectedCategory;
      })
    : products;

  const handleAddToCart = (product) => {
    addItem(product, 1);
    toast.success(`${product.nom} ajouté au panier`);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Helmet>
        <title>Menu - O'Delices Épernon | Tacos, Burgers, Pizzas Halal</title>
        <meta name="description" content="Découvrez notre menu complet: Tacos, Burgers, Pizzas, Kebabs, Sandwichs et plus. Tous nos produits sont 100% Halal. Commande en ligne à Épernon." />
      </Helmet>

      <Navbar />
      
      <div className="pt-20 md:pt-28 pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-8 text-white" data-testid="menu-title">
            Notre Menu
          </h1>

          {/* Category Tabs - Styled like homepage */}
          <div className="mb-8">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedCategory === null
                    ? 'bg-primary text-black shadow-lg shadow-primary/30'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] border border-white/10'
                }`}
                data-testid="category-all"
              >
                Tous
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.nom)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition-all ${
                    selectedCategory === cat.nom
                      ? 'bg-primary text-black shadow-lg shadow-primary/30'
                      : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] border border-white/10'
                  }`}
                  data-testid={`category-btn-${cat.nom.toLowerCase()}`}
                >
                  {cat.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Products count */}
          <div className="mb-6">
            <p className="text-white/60">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} 
              {selectedCategory && ` dans ${selectedCategory}`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden bg-[#2a2a2a] border-0">
                  <Skeleton className="h-48 w-full bg-[#333]" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4 bg-[#333]" />
                    <Skeleton className="h-4 w-full bg-[#333]" />
                    <Skeleton className="h-10 w-full bg-[#333]" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/60 text-lg">Aucun produit disponible dans cette catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.category_id);
                const categoryImage = CATEGORY_IMAGES[category?.nom] || CATEGORY_IMAGES['Burgers'];
                
                return (
                  <Card 
                    key={product.id} 
                    className="group overflow-hidden bg-[#2a2a2a] border-0 rounded-2xl hover:ring-2 hover:ring-primary transition-all"
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={product.image_url || categoryImage}
                        alt={product.nom}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-3 left-3 text-xs px-3 py-1 rounded-full bg-primary text-black font-medium">
                        {category?.nom || 'Menu'}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-white">{product.nom}</h3>
                      <p className="text-sm text-white/60 mb-4 line-clamp-2 min-h-[2.5rem]">
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
                          data-testid={`add-to-cart-${product.id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
