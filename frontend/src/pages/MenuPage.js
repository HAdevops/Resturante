import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import Navbar from '../components/Navbar';
import { useCart } from '../contexts/CartContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_IMAGES = {
  'Tacos': 'https://images.unsplash.com/photo-1715601104221-bdf02645d6c2?w=400&q=80',
  'Kebab': 'https://images.pexels.com/photos/6419686/pexels-photo-6419686.jpeg?w=400',
  'Burgers': 'https://images.unsplash.com/photo-1634737119182-4d09e1305ba7?w=400&q=80',
  'Sandwichs': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  'Snacks': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80',
  'Boissons': 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80'
};

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    fetchMenu();
  }, []);

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
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <div className="pt-20 md:pt-28 pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-8" data-testid="menu-title">
            Notre Menu
          </h1>

          <div className="mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                className="rounded-full whitespace-nowrap"
                data-testid="category-all"
              >
                Tous
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.nom ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.nom)}
                  className="rounded-full whitespace-nowrap"
                  data-testid={`category-btn-${cat.nom.toLowerCase()}`}
                >
                  {cat.nom}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Aucun produit disponible dans cette catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.category_id);
                const categoryImage = CATEGORY_IMAGES[category?.nom] || CATEGORY_IMAGES['Burgers'];
                
                return (
                  <Card 
                    key={product.id} 
                    className="card-product group overflow-hidden"
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={product.image_url || categoryImage}
                        alt={product.nom}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-3 left-3 text-xs px-3 py-1 rounded-full bg-primary/90 text-primary-foreground font-medium">
                        {category?.nom || 'Menu'}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.nom}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                        {product.description || 'Préparé avec des ingrédients frais'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary font-mono">
                          {product.prix.toFixed(2)} €
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="rounded-full"
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
    </div>
  );
}
