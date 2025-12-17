import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Calculator, RefreshCw, LogOut, Plus, Phone, User, MapPin, 
  Truck, Package, CreditCard, CheckCircle, XCircle, Clock,
  Volume2, VolumeX, DollarSign, TrendingUp, AlertCircle, Search,
  Filter, Eye, Gift
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
import { useNotificationSound } from '../../hooks/useNotificationSound';
import useWebSocket from '../../hooks/useWebSocket';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  'REÇUE': { color: 'bg-blue-500', icon: '📥', label: 'Reçue' },
  'ACCUSÉE_CUISINE': { color: 'bg-yellow-500', icon: '👁️', label: 'Vue cuisine' },
  'EN_PRÉPARATION': { color: 'bg-orange-500', icon: '👨‍🍳', label: 'En préparation' },
  'PRÊTE': { color: 'bg-green-500', icon: '✅', label: 'Prête' },
  'ASSIGNÉE_LIVREUR': { color: 'bg-purple-500', icon: '🛵', label: 'Assignée' },
  'EN_LIVRAISON': { color: 'bg-indigo-500', icon: '🚚', label: 'En livraison' },
  'LIVRÉE': { color: 'bg-emerald-600', icon: '🎉', label: 'Livrée' },
  'ANNULÉE': { color: 'bg-red-500', icon: '❌', label: 'Annulée' },
};

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loyaltyOrder, setLoyaltyOrder] = useState(null);
  const { playBeep, initAudio } = useNotificationSound();
  const previousOrderCount = useRef(0);
  const isFirstLoad = useRef(true);

  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    type_fulfillment: 'LIVRAISON',
    items: [],
    payment_mode: 'A_LA_LIVRAISON'
  });

  // WebSocket connection for real-time updates
  const handleWebSocketMessage = useCallback((data) => {
    if (data.event === 'order.created' || data.event === 'order.status.updated') {
      fetchData();
    }
    if (data.event === 'loyalty.reward.eligible' && data.data) {
      setLoyaltyOrder(data.data);
      toast.info(
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          <span>{data.data.message || 'Client éligible fidélité!'}</span>
        </div>,
        { duration: 10000 }
      );
    }
  }, []);

  const { isConnected, playOrderNotification, playLoyaltyNotification } = useWebSocket('cashier', handleWebSocketMessage);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, driversRes, productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/users/drivers`),
        axios.get(`${API}/menu/products`),
        axios.get(`${API}/menu/categories`)
      ]);
      
      // Check for new orders
      const newOrdersCount = ordersRes.data.filter(o => o.status === 'REÇUE').length;
      
      if (!isFirstLoad.current && soundEnabled && newOrdersCount > previousOrderCount.current) {
        playBeep('newOrder');
        toast.info('🔔 Nouvelle commande !', { duration: 5000 });
      }
      
      previousOrderCount.current = newOrdersCount;
      isFirstLoad.current = false;
      
      setOrders(ordersRes.data);
      setDrivers(driversRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, playBeep]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleEnableSound = () => {
    initAudio();
    setSoundEnabled(true);
    playBeep('success');
    toast.success('Notifications sonores activées');
  };

  const claimLoyaltyReward = async (phone) => {
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      await axios.post(`${API}/loyalty/${cleanPhone}/claim`, {});
      toast.success('Récompense marquée comme donnée');
      setLoyaltyOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const assignDriver = async (orderId, driverId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/assign-delivery`, { driver_id: driverId });
      toast.success('Livreur assigné');
      if (soundEnabled) playBeep('success');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const markPaid = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/mark-paid`);
      toast.success('Paiement enregistré');
      if (soundEnabled) playBeep('success');
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

  const updateItemQuantity = (productId, delta) => {
    setNewOrder(prev => {
      const updated = prev.items.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantite + delta;
          return newQty > 0 ? { ...item, quantite: newQty } : null;
        }
        return item;
      }).filter(Boolean);
      return { ...prev, items: updated };
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
      if (soundEnabled) playBeep('success');
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

  // Filter orders
  const getFilteredOrders = () => {
    let filtered = orders;
    
    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(o => !['LIVRÉE', 'ANNULÉE'].includes(o.status));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.order_number.toLowerCase().includes(term) ||
        o.customer_name.toLowerCase().includes(term) ||
        o.customer_phone.includes(term)
      );
    }
    
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const newOrderTotal = newOrder.items.reduce((sum, i) => sum + i.prix * i.quantite, 0);

  // Stats
  const activeOrders = orders.filter(o => !['LIVRÉE', 'ANNULÉE'].includes(o.status));
  const todayRevenue = orders
    .filter(o => o.payment_status === 'PAID' && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total_amount, 0);
  const pendingPayments = orders.filter(o => o.payment_status !== 'PAID' && !['ANNULÉE'].includes(o.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="cashier-title">Caisse</h1>
              <p className="text-gray-500 text-sm">Gestion des commandes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* WebSocket Connection Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="hidden sm:inline">{isConnected ? 'Connecté' : 'Déconnecté'}</span>
            </div>
            
            {/* Sound Toggle */}
            <Button
              variant={soundEnabled ? 'default' : 'outline'}
              size="icon"
              onClick={() => soundEnabled ? setSoundEnabled(false) : handleEnableSound()}
              className={soundEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
              title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
              data-testid="toggle-sound"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            
            <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600" data-testid="new-order-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Commande téléphone</span>
                  <span className="sm:hidden">Nouvelle</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Phone className="w-6 h-6 text-amber-500" />
                    Nouvelle commande téléphone
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base">Nom du client *</Label>
                      <Input
                        value={newOrder.customer_name}
                        onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                        placeholder="Nom complet"
                        className="mt-1 h-12 text-lg"
                        data-testid="manual-order-name"
                      />
                    </div>
                    <div>
                      <Label className="text-base">Téléphone *</Label>
                      <Input
                        value={newOrder.customer_phone}
                        onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                        placeholder="06 XX XX XX XX"
                        className="mt-1 h-12 text-lg"
                        data-testid="manual-order-phone"
                      />
                    </div>
                    <div>
                      <Label className="text-base">Mode de retrait</Label>
                      <Select value={newOrder.type_fulfillment} onValueChange={(v) => setNewOrder({ ...newOrder, type_fulfillment: v })}>
                        <SelectTrigger className="mt-1 h-12 text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LIVRAISON">🚚 Livraison</SelectItem>
                          <SelectItem value="A_EMPORTER">🏃 À emporter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newOrder.type_fulfillment === 'LIVRAISON' && (
                      <div>
                        <Label className="text-base">Adresse de livraison</Label>
                        <Input
                          value={newOrder.delivery_address}
                          onChange={(e) => setNewOrder({ ...newOrder, delivery_address: e.target.value })}
                          placeholder="Adresse complète"
                          className="mt-1 h-12"
                          data-testid="manual-order-address"
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-base">Mode de paiement</Label>
                      <Select value={newOrder.payment_mode} onValueChange={(v) => setNewOrder({ ...newOrder, payment_mode: v })}>
                        <SelectTrigger className="mt-1 h-12 text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A_LA_LIVRAISON">💵 À la livraison</SelectItem>
                          <SelectItem value="SUR_PLACE">🏪 Sur place</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base">Produits</Label>
                    <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50">
                      {products.map(p => (
                        <button
                          key={p.id}
                          onClick={() => addProductToOrder(p)}
                          className="w-full text-left p-3 hover:bg-amber-50 border-b last:border-0 flex justify-between items-center transition-colors"
                          data-testid={`add-product-${p.id}`}
                        >
                          <span className="font-medium">{p.nom}</span>
                          <span className="font-mono text-amber-600 font-bold">{p.prix.toFixed(2)} €</span>
                        </button>
                      ))}
                    </div>

                    <Label className="text-base">Panier</Label>
                    <div className="border rounded-lg p-3 bg-white min-h-[150px]">
                      {newOrder.items.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Cliquez sur les produits pour les ajouter</p>
                      ) : (
                        <div className="space-y-2">
                          {newOrder.items.map(item => (
                            <div key={item.product_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="font-medium">{item.nom}</span>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => updateItemQuantity(item.product_id, -1)} className="h-8 w-8 p-0">-</Button>
                                <span className="w-8 text-center font-bold">{item.quantite}</span>
                                <Button size="sm" variant="outline" onClick={() => updateItemQuantity(item.product_id, 1)} className="h-8 w-8 p-0">+</Button>
                                <span className="font-mono w-20 text-right">{(item.prix * item.quantite).toFixed(2)} €</span>
                                <Button variant="ghost" size="sm" onClick={() => removeProductFromOrder(item.product_id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                  <XCircle className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t pt-3 mt-3 flex justify-between items-center">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-mono font-bold text-amber-600">{newOrderTotal.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={createManualOrder} className="w-full mt-4 h-14 text-lg bg-amber-500 hover:bg-amber-600" data-testid="create-manual-order">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Créer la commande
                </Button>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" size="icon" onClick={fetchData} data-testid="refresh-orders">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 hidden lg:inline">{user?.nom}</span>
            <Button variant="outline" size="icon" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Commandes actives</p>
              <p className="text-2xl font-bold text-blue-700">{activeOrders.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600">CA aujourd'hui</p>
              <p className="text-2xl font-bold text-green-700 font-mono">{todayRevenue.toFixed(0)} €</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-600">À encaisser</p>
              <p className="text-2xl font-bold text-orange-700">{pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher par n°, nom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-11">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">🔵 Actives ({activeOrders.length})</SelectItem>
              <SelectItem value="all">📋 Toutes ({orders.length})</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.icon} {config.label} ({orders.filter(o => o.status === status).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['REÇUE'];
            return (
              <Card key={order.id} className="p-4 bg-white border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: statusConfig.color.replace('bg-', '').includes('blue') ? '#3b82f6' : statusConfig.color.replace('bg-', '').includes('green') ? '#22c55e' : statusConfig.color.replace('bg-', '').includes('orange') ? '#f97316' : statusConfig.color.replace('bg-', '').includes('yellow') ? '#eab308' : statusConfig.color.replace('bg-', '').includes('purple') ? '#a855f7' : statusConfig.color.replace('bg-', '').includes('indigo') ? '#6366f1' : statusConfig.color.replace('bg-', '').includes('red') ? '#ef4444' : '#10b981' }} data-testid={`order-card-${order.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-xl text-gray-900">{order.order_number}</span>
                  <Badge className={`${statusConfig.color} text-white`}>
                    {statusConfig.icon} {statusConfig.label}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-3">
                  <p className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{order.customer_name}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">{order.customer_phone}</a>
                  </p>
                  <p className="flex items-center gap-2">
                    {order.type_fulfillment === 'LIVRAISON' ? (
                      <><Truck className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Livraison</span></>
                    ) : (
                      <><Package className="w-4 h-4 text-gray-400" /><span className="text-gray-600">À emporter</span></>
                    )}
                  </p>
                  {order.delivery_address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600 text-sm">{order.delivery_address}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {formatTime(order.created_at)}
                  </p>
                </div>

                <div className="border-t border-b py-2 my-3 max-h-32 overflow-y-auto">
                  {order.items.map((item, i) => (
                    <div key={i} className="text-sm flex justify-between py-0.5">
                      <span className="text-gray-700">{item.quantite}x {item.nom_snapshot}</span>
                      <span className="font-mono text-gray-900">{(item.prix_unitaire * item.quantite).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{order.payment_mode === 'EN_LIGNE' ? 'Carte' : order.payment_mode === 'A_LA_LIVRAISON' ? 'Livraison' : 'Sur place'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.payment_status === 'PAID' ? 'default' : 'outline'} className={order.payment_status === 'PAID' ? 'bg-green-500' : 'border-orange-500 text-orange-500'}>
                      {order.payment_status === 'PAID' ? '✓ Payé' : '⏳ En attente'}
                    </Badge>
                    <span className="font-mono font-bold text-lg text-gray-900">{order.total_amount.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.type_fulfillment === 'LIVRAISON' && ['PRÊTE', 'ASSIGNÉE_LIVREUR'].includes(order.status) && (
                    <Select onValueChange={(v) => assignDriver(order.id, v)}>
                      <SelectTrigger className="h-10" data-testid={`assign-driver-${order.id}`}>
                        <SelectValue placeholder={order.assigned_driver_name ? `🛵 ${order.assigned_driver_name}` : "🛵 Assigner un livreur"} />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <div className="flex gap-2">
                    {order.payment_status !== 'PAID' && !['ANNULÉE'].includes(order.status) && (
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10 border-green-500 text-green-600 hover:bg-green-50" 
                        onClick={() => markPaid(order.id)}
                        data-testid={`mark-paid-${order.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Encaisser
                      </Button>
                    )}
                    
                    {!['LIVRÉE', 'ANNULÉE'].includes(order.status) && (
                      <Button 
                        variant="outline" 
                        className="h-10 border-red-300 text-red-500 hover:bg-red-50" 
                        onClick={() => cancelOrder(order.id)}
                        data-testid={`cancel-order-${order.id}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucune commande trouvée</p>
            <p className="text-gray-400 text-sm mt-1">Modifiez les filtres ou créez une nouvelle commande</p>
          </div>
        )}
      </div>
    </div>
  );
}
