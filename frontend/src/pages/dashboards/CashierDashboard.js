import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Calculator, RefreshCw, LogOut, Plus, Phone, User, MapPin, 
  Truck, Package, CreditCard, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  'REÇUE': 'bg-blue-500',
  'ACCUSÉE_CUISINE': 'bg-yellow-500',
  'EN_PRÉPARATION': 'bg-orange-500',
  'PRÊTE': 'bg-green-500',
  'ASSIGNÉE_LIVREUR': 'bg-purple-500',
  'EN_LIVRAISON': 'bg-indigo-500',
  'LIVRÉE': 'bg-emerald-600',
  'ANNULÉE': 'bg-red-500',
};

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    type_fulfillment: 'LIVRAISON',
    items: [],
    payment_mode: 'A_LA_LIVRAISON'
  });

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, driversRes, productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/users/drivers`),
        axios.get(`${API}/menu/products`),
        axios.get(`${API}/menu/categories`)
      ]);
      setOrders(ordersRes.data);
      setDrivers(driversRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const assignDriver = async (orderId, driverId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/assign-delivery`, { driver_id: driverId });
      toast.success('Livreur assigné');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const markPaid = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/mark-paid`);
      toast.success('Paiement enregistré');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Annuler cette commande ?')) return;
    try {
      await axios.post(`${API}/orders/${orderId}/cancel`);
      toast.success('Commande annulée');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const addProductToOrder = (product) => {
    setNewOrder(prev => {
      const existingIndex = prev.items.findIndex(i => i.product_id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev.items];
        updated[existingIndex].quantite += 1;
        return { ...prev, items: updated };
      }
      return {
        ...prev,
        items: [...prev.items, { product_id: product.id, nom: product.nom, prix: product.prix, quantite: 1 }]
      };
    });
  };

  const removeProductFromOrder = (productId) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter(i => i.product_id !== productId)
    }));
  };

  const createManualOrder = async () => {
    if (!newOrder.customer_name || !newOrder.customer_phone || newOrder.items.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await axios.post(`${API}/orders/manual`, {
        items: newOrder.items.map(i => ({ product_id: i.product_id, quantite: i.quantite })),
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        delivery_address: newOrder.delivery_address || null,
        type_fulfillment: newOrder.type_fulfillment,
        payment_mode: newOrder.payment_mode
      });
      toast.success('Commande créée');
      setNewOrderOpen(false);
      setNewOrder({ customer_name: '', customer_phone: '', delivery_address: '', type_fulfillment: 'LIVRAISON', items: [], payment_mode: 'A_LA_LIVRAISON' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const newOrderTotal = newOrder.items.reduce((sum, i) => sum + i.prix * i.quantite, 0);

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Calculator className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold" data-testid="cashier-title">Caisse</h1>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-order-btn">
                <Plus className="w-4 h-4 mr-2" />
                Commande téléphone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Nouvelle commande téléphone
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Nom du client *</Label>
                    <Input
                      value={newOrder.customer_name}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                      placeholder="Nom"
                      data-testid="manual-order-name"
                    />
                  </div>
                  <div>
                    <Label>Téléphone *</Label>
                    <Input
                      value={newOrder.customer_phone}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                      placeholder="06 XX XX XX XX"
                      data-testid="manual-order-phone"
                    />
                  </div>
                  <div>
                    <Label>Mode</Label>
                    <Select value={newOrder.type_fulfillment} onValueChange={(v) => setNewOrder({ ...newOrder, type_fulfillment: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LIVRAISON">Livraison</SelectItem>
                        <SelectItem value="A_EMPORTER">À emporter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newOrder.type_fulfillment === 'LIVRAISON' && (
                    <div>
                      <Label>Adresse</Label>
                      <Input
                        value={newOrder.delivery_address}
                        onChange={(e) => setNewOrder({ ...newOrder, delivery_address: e.target.value })}
                        placeholder="Adresse de livraison"
                        data-testid="manual-order-address"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Paiement</Label>
                    <Select value={newOrder.payment_mode} onValueChange={(v) => setNewOrder({ ...newOrder, payment_mode: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A_LA_LIVRAISON">À la livraison</SelectItem>
                        <SelectItem value="SUR_PLACE">Sur place</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Produits</Label>
                  <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1 mb-4">
                    {products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProductToOrder(p)}
                        className="w-full text-left p-2 hover:bg-gray-100 rounded flex justify-between"
                        data-testid={`add-product-${p.id}`}
                      >
                        <span>{p.nom}</span>
                        <span className="font-mono">{p.prix.toFixed(2)} €</span>
                      </button>
                    ))}
                  </div>

                  <Label className="mb-2 block">Panier</Label>
                  <div className="border rounded p-2 space-y-2">
                    {newOrder.items.length === 0 ? (
                      <p className="text-gray-500 text-sm">Aucun produit</p>
                    ) : (
                      newOrder.items.map(item => (
                        <div key={item.product_id} className="flex items-center justify-between">
                          <span>{item.quantite}x {item.nom}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{(item.prix * item.quantite).toFixed(2)} €</span>
                            <Button variant="ghost" size="sm" onClick={() => removeProductFromOrder(item.product_id)}>
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="font-mono">{newOrderTotal.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={createManualOrder} className="w-full mt-4" data-testid="create-manual-order">
                Créer la commande
              </Button>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="icon" onClick={fetchData} data-testid="refresh-orders">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">{user?.nom}</span>
          <Button variant="outline" size="icon" onClick={handleLogout} data-testid="logout-btn">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="menu">Gérer le menu</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="mb-4 flex gap-2 flex-wrap">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>
                Toutes ({orders.length})
              </Button>
              {Object.keys(STATUS_COLORS).map(status => {
                const count = orders.filter(o => o.status === status).length;
                return (
                  <Button 
                    key={status} 
                    variant={statusFilter === status ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStatusFilter(status)}
                  >
                    {status.replace('_', ' ')} ({count})
                  </Button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map(order => (
                <Card key={order.id} className="p-4" data-testid={`order-card-${order.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold">{order.order_number}</span>
                    <Badge className={STATUS_COLORS[order.status]}>{order.status.replace('_', ' ')}</Badge>
                  </div>
                  
                  <div className="text-sm space-y-1 mb-3">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {order.customer_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {order.customer_phone}
                    </p>
                    <p className="flex items-center gap-2">
                      {order.type_fulfillment === 'LIVRAISON' ? <Truck className="w-4 h-4 text-gray-400" /> : <Package className="w-4 h-4 text-gray-400" />}
                      {order.type_fulfillment === 'LIVRAISON' ? 'Livraison' : 'À emporter'}
                    </p>
                    {order.delivery_address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {order.delivery_address}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {formatTime(order.created_at)}
                    </p>
                  </div>

                  <div className="border-t pt-2 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="text-sm flex justify-between">
                        <span>{item.quantite}x {item.nom_snapshot}</span>
                        <span className="font-mono">{(item.prix_unitaire * item.quantite).toFixed(2)} €</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total</span>
                      <span className="font-mono">{order.total_amount.toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {order.payment_mode.replace('_', ' ')}
                    </span>
                    <Badge variant={order.payment_status === 'PAID' ? 'default' : 'secondary'}>
                      {order.payment_status === 'PAID' ? 'Payé' : 'En attente'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {order.type_fulfillment === 'LIVRAISON' && ['PRÊTE', 'ASSIGNÉE_LIVREUR'].includes(order.status) && (
                      <Select onValueChange={(v) => assignDriver(order.id, v)}>
                        <SelectTrigger data-testid={`assign-driver-${order.id}`}>
                          <SelectValue placeholder={order.assigned_driver_name || "Assigner livreur"} />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {order.payment_status !== 'PAID' && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => markPaid(order.id)}
                        data-testid={`mark-paid-${order.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marquer payé
                      </Button>
                    )}
                    
                    {!['LIVRÉE', 'ANNULÉE'].includes(order.status) && (
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={() => cancelOrder(order.id)}
                        data-testid={`cancel-order-${order.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="menu">
            <Card className="p-6">
              <p className="text-muted-foreground">
                La gestion complète du menu (ajout/modification de produits et catégories) est disponible dans le dashboard Admin.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
