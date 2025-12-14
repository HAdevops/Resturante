import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Package, Clock, ChefHat, Bike, CheckCircle, XCircle, Home, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Navbar from '../components/Navbar';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  'REÇUE': { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/20', label: 'Commande reçue' },
  'ACCUSÉE_CUISINE': { icon: ChefHat, color: 'text-yellow-500', bg: 'bg-yellow-500/20', label: 'En cuisine' },
  'EN_PRÉPARATION': { icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-500/20', label: 'En préparation' },
  'PRÊTE': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20', label: 'Prête' },
  'ASSIGNÉE_LIVREUR': { icon: Bike, color: 'text-purple-500', bg: 'bg-purple-500/20', label: 'Livreur assigné' },
  'EN_LIVRAISON': { icon: Bike, color: 'text-indigo-500', bg: 'bg-indigo-500/20', label: 'En livraison' },
  'LIVRÉE': { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/20', label: 'Livrée' },
  'ANNULÉE': { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20', label: 'Annulée' }
};

const STEPS = ['REÇUE', 'ACCUSÉE_CUISINE', 'EN_PRÉPARATION', 'PRÊTE', 'EN_LIVRAISON', 'LIVRÉE'];

export default function TrackingPage() {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderNumber);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder(orderNumber);
      const interval = setInterval(() => fetchOrder(orderNumber), 10000);
      return () => clearInterval(interval);
    }
  }, [orderNumber]);

  const fetchOrder = async (num) => {
    try {
      const res = await axios.get(`${API}/orders/${num}`);
      setOrder(res.data);
      setError(null);
    } catch (err) {
      setError('Commande non trouvée');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/suivi/${searchInput.trim()}`;
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    if (order.status === 'ANNULÉE') return -1;
    if (order.status === 'ASSIGNÉE_LIVREUR') return STEPS.indexOf('PRÊTE') + 0.5;
    return STEPS.indexOf(order.status);
  };

  const statusConfig = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG['REÇUE'] : null;
  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <div className="pt-20 md:pt-28 pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-8" data-testid="tracking-title">
            Suivi de commande
          </h1>

          {!orderNumber && (
            <Card className="p-6 mb-8">
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Numéro de commande (ex: OD250115ABCD)"
                  className="flex-1"
                  data-testid="order-search-input"
                />
                <Button type="submit" data-testid="search-order-btn">
                  Rechercher
                </Button>
              </form>
            </Card>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          )}

          {error && (
            <Card className="p-8 text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">{error}</h2>
              <p className="text-muted-foreground mb-6">Vérifiez le numéro de commande et réessayez.</p>
              <Link to="/">
                <Button variant="outline" className="rounded-full">
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
            </Card>
          )}

          {order && (
            <>
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Commande</p>
                    <p className="text-xl font-mono font-bold" data-testid="order-number">{order.order_number}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg}`}>
                    <statusConfig.icon className={`w-5 h-5 ${statusConfig.color}`} />
                    <span className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                </div>

                {order.status !== 'ANNULÉE' && (
                  <div className="relative">
                    <div className="absolute top-4 left-0 right-0 h-1 bg-secondary rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(0, (currentStep / (STEPS.length - 1)) * 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between relative">
                      {STEPS.map((step, i) => {
                        const config = STATUS_CONFIG[step];
                        const isActive = i <= currentStep;
                        const isCurrent = Math.floor(currentStep) === i;
                        
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                              isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}>
                              <config.icon className="w-4 h-4" />
                            </div>
                            <span className={`text-xs mt-2 text-center max-w-[60px] ${
                              isActive ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {config.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6 mb-6">
                <h3 className="font-semibold mb-4">Détails de la commande</h3>
                
                <div className="space-y-3 mb-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.quantite}x {item.nom_snapshot}</span>
                      <span className="font-mono">{(item.prix_unitaire * item.quantite).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary font-mono">{order.total_amount.toFixed(2)} €</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Informations</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Client:</span> {order.customer_name}</p>
                  <p><span className="text-muted-foreground">Téléphone:</span> {order.customer_phone}</p>
                  <p><span className="text-muted-foreground">Mode:</span> {order.type_fulfillment === 'LIVRAISON' ? 'Livraison' : 'À emporter'}</p>
                  {order.delivery_address && (
                    <p><span className="text-muted-foreground">Adresse:</span> {order.delivery_address}</p>
                  )}
                  <p><span className="text-muted-foreground">Paiement:</span> {order.payment_status === 'PAID' ? 'Payé' : 'En attente'}</p>
                  {order.assigned_driver_name && (
                    <p><span className="text-muted-foreground">Livreur:</span> {order.assigned_driver_name}</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
