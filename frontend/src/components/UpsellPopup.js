import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, ShoppingCart, Coffee, Cookie, IceCream } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useCart } from '../contexts/CartContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UPSELL_CATEGORIES = ['Boissons', 'Snacks', 'Desserts', 'Burgers', 'Sandwichs'];

const CATEGORY_ICONS = {
  'Boissons': Coffee,
  'Snacks': Cookie,
  'Desserts': IceCream,
  'Burgers': Cookie,
  'Sandwichs': Cookie
};

export default function UpsellPopup({ isOpen, onClose, onGoToCheckout }) {
  const { items, addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUpsellProducts();
    }
  }, [isOpen]);

  const fetchUpsellProducts = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API}/menu/categories`),
        axios.get(`${API}/menu/products`)
      ]);
      
      const cats = catRes.data.filter(c => UPSELL_CATEGORIES.includes(c.nom));
      setCategories(cats);
      
      // Filter products from upsell categories
      const catIds = cats.map(c => c.id);
      const upsellProducts = prodRes.data.filter(p => catIds.includes(p.category_id));
      
      // Take max 6 products per category
      const limitedProducts = [];
      cats.forEach(cat => {
        const catProducts = upsellProducts.filter(p => p.category_id === cat.id).slice(0, 6);
        limitedProducts.push(...catProducts);
      });
      
      setProducts(limitedProducts);
    } catch (err) {
      console.error('Error fetching upsell products:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (product) => {
    setSelectedItems(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleAddToCart = () => {
    selectedItems.forEach(product => {
      addItem(product, 1);
    });
    
    if (selectedItems.length > 0) {
      toast.success(`${selectedItems.length} article(s) ajouté(s) au panier`);
    }
    
    setSelectedItems([]);
    onClose();
    onGoToCheckout();
  };

  const handleSkip = () => {
    setSelectedItems([]);
    onClose();
    onGoToCheckout();
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.nom || 'Autre';
  };

  const totalSelected = selectedItems.reduce((sum, p) => sum + p.prix, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-[#1a1a1a] border-primary/20">
        <button 
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/10 transition-colors text-white/60 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-2xl font-serif text-white">
            Envie de compléter votre commande ? 🍟
          </DialogTitle>
          <p className="text-white/60 mt-2">
            Ajoutez facilement une boisson, un snack ou un dessert.
          </p>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[50vh] pr-2 -mr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {UPSELL_CATEGORIES.map(catName => {
                const cat = categories.find(c => c.nom === catName);
                if (!cat) return null;
                
                const catProducts = products.filter(p => p.category_id === cat.id);
                if (catProducts.length === 0) return null;
                
                const IconComponent = CATEGORY_ICONS[catName] || Coffee;
                
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-white">{catName}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {catProducts.map(product => {
                        const isSelected = selectedItems.some(p => p.id === product.id);
                        
                        return (
                          <Card
                            key={product.id}
                            onClick={() => toggleProduct(product)}
                            className={`p-3 cursor-pointer transition-all bg-[#2a2a2a] border-0 hover:ring-2 hover:ring-primary/50 ${
                              isSelected ? 'ring-2 ring-primary bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white text-sm truncate">{product.nom}</p>
                                <p className="text-primary font-mono text-sm">{product.prix.toFixed(2)} €</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-primary text-black' : 'bg-white/10 text-white/60'
                              }`}>
                                {isSelected ? '✓' : <Plus className="w-4 h-4" />}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10 mt-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Non merci
          </Button>
          
          <Button
            onClick={handleAddToCart}
            disabled={selectedItems.length === 0}
            className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {selectedItems.length > 0 ? (
              <>Ajouter {selectedItems.length} article(s) (+{totalSelected.toFixed(2)} €)</>
            ) : (
              <>Continuer vers le panier</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
