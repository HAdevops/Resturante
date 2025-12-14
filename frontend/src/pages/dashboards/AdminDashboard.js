import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, UtensilsCrossed, Settings, LogOut, RefreshCw,
  Plus, Edit, Trash2, Save, X, ShoppingCart, DollarSign, Banknote,
  Clock, TrendingUp, CreditCard, Ticket, CheckCircle, AlertCircle,
  Package, Eye, ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', email: '', password: '', telephone: '', role: 'CLIENT' });
  
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ nom: '', ordre: 0 });
  
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ nom: '', description: '', prix: '', category_id: '', image_url: '' });
  
  const [editProduct, setEditProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes, categoriesRes, productsRes, settingsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/menu/categories`),
        axios.get(`${API}/menu/products`),
        axios.get(`${API}/admin/settings`),
        axios.get(`${API}/orders`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data);
      setSettings(settingsRes.data);
      setOrders(ordersRes.data);
      
      // Calculate detailed stats from orders
      calculateDetailedStats(ordersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateDetailedStats = (ordersData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = ordersData.filter(o => new Date(o.created_at) >= today);
    
    // Revenue by payment method
    const cardRevenue = ordersData
      .filter(o => o.payment_mode === 'EN_LIGNE' && o.payment_status === 'PAID')
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    const cashRevenue = ordersData
      .filter(o => (o.payment_mode === 'A_LA_LIVRAISON' || o.payment_mode === 'SUR_PLACE') && o.payment_status === 'PAID')
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    const pendingRevenue = ordersData
      .filter(o => o.payment_status === 'PENDING')
      .reduce((sum, o) => sum + o.total_amount, 0);
    
    // Orders by status
    const completedOrders = ordersData.filter(o => o.status === 'LIVRÉE');
    const pendingOrders = ordersData.filter(o => !['LIVRÉE', 'ANNULÉE'].includes(o.status));
    const cancelledOrders = ordersData.filter(o => o.status === 'ANNULÉE');
    
    setDetailedStats({
      cardRevenue,
      cashRevenue,
      pendingRevenue,
      todayOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders
    });
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createUser = async () => {
    try {
      await axios.post(`${API}/admin/users`, newUser);
      toast.success('Utilisateur créé');
      setNewUserOpen(false);
      setNewUser({ nom: '', email: '', password: '', telephone: '', role: 'CLIENT' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const toggleUserActive = async (userId) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/toggle-active`);
      toast.success('Statut modifié');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const createCategory = async () => {
    try {
      await axios.post(`${API}/menu/categories`, newCategory);
      toast.success('Catégorie créée');
      setNewCategoryOpen(false);
      setNewCategory({ nom: '', ordre: 0 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const deleteCategory = async (catId) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await axios.delete(`${API}/menu/categories/${catId}`);
      toast.success('Catégorie supprimée');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const createProduct = async () => {
    try {
      await axios.post(`${API}/menu/products`, {
        ...newProduct,
        prix: parseFloat(newProduct.prix)
      });
      toast.success('Produit créé');
      setNewProductOpen(false);
      setNewProduct({ nom: '', description: '', prix: '', category_id: '', image_url: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const updateProduct = async () => {
    try {
      await axios.put(`${API}/menu/products/${editProduct.id}`, {
        ...editProduct,
        prix: parseFloat(editProduct.prix)
      });
      toast.success('Produit modifié');
      setEditProduct(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await axios.delete(`${API}/menu/products/${productId}`);
      toast.success('Produit supprimé');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const updateSettings = async () => {
    try {
      await axios.put(`${API}/admin/settings`, settings);
      toast.success('Paramètres sauvegardés');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900" data-testid="admin-title">Super Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={fetchData} data-testid="refresh-data">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">{user?.nom}</span>
          <Button variant="outline" size="icon" onClick={handleLogout} data-testid="logout-btn">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white p-1 rounded-lg shadow">
            <TabsTrigger value="overview" className="px-6">
              <TrendingUp className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="orders" className="px-6">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="menu" className="px-6">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="users" className="px-6">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="settings" className="px-6">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commandes totales</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.total_orders || 0}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                    <p className="text-2xl font-bold text-gray-900 font-mono">{(stats?.total_revenue || 0).toFixed(2)} €</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aujourd'hui</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.today_orders || 0}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">En attente</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.pending_orders || 0}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            {detailedStats && (
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-white border-l-4 border-blue-500">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Paiements Carte</p>
                      <p className="text-xl font-bold text-gray-900 font-mono">{detailedStats.cardRevenue.toFixed(2)} €</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-white border-l-4 border-green-500">
                  <div className="flex items-center gap-3">
                    <Banknote className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Paiements Espèces</p>
                      <p className="text-xl font-bold text-gray-900 font-mono">{detailedStats.cashRevenue.toFixed(2)} €</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-white border-l-4 border-orange-500">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">En attente de paiement</p>
                      <p className="text-xl font-bold text-gray-900 font-mono">{detailedStats.pendingRevenue.toFixed(2)} €</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Today's Orders */}
            {detailedStats && (
              <Card className="p-4 bg-white mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Commandes du jour ({detailedStats.todayOrders.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold text-gray-700">N° Commande</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Client</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Total</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Paiement</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Statut</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Heure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedStats.todayOrders.slice(0, 10).map(order => (
                        <tr key={order.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                          <td className="p-3 font-mono font-bold text-gray-900">{order.order_number}</td>
                          <td className="p-3 text-gray-700">{order.customer_name}</td>
                          <td className="p-3 font-mono text-gray-900">{order.total_amount.toFixed(2)} €</td>
                          <td className="p-3">
                            <Badge variant={order.payment_status === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                              {order.payment_mode === 'EN_LIGNE' ? 'Carte' : 'Espèces'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={`${STATUS_COLORS[order.status]} text-xs`}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-500">{formatTime(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Order Status Summary */}
            {detailedStats && (
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Terminées
                    </h4>
                    <span className="text-2xl font-bold text-green-600">{detailedStats.completedOrders.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detailedStats.completedOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex justify-between text-sm p-2 bg-green-50 rounded">
                        <span className="font-mono text-gray-700">{order.order_number}</span>
                        <span className="font-mono text-gray-900">{order.total_amount.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-500" />
                      En cours
                    </h4>
                    <span className="text-2xl font-bold text-orange-600">{detailedStats.pendingOrders.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detailedStats.pendingOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex justify-between text-sm p-2 bg-orange-50 rounded">
                        <span className="font-mono text-gray-700">{order.order_number}</span>
                        <Badge className={`${STATUS_COLORS[order.status]} text-xs`}>
                          {order.status.split('_')[0]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <X className="w-5 h-5 text-red-500" />
                      Annulées
                    </h4>
                    <span className="text-2xl font-bold text-red-600">{detailedStats.cancelledOrders.length}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detailedStats.cancelledOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex justify-between text-sm p-2 bg-red-50 rounded">
                        <span className="font-mono text-gray-700">{order.order_number}</span>
                        <span className="font-mono text-gray-900">{order.total_amount.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="p-4 bg-white">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Toutes les commandes ({orders.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">N° Commande</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Client</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Téléphone</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Total</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Paiement</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Statut</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-gray-900">{order.order_number}</td>
                        <td className="p-3 text-gray-700">{order.customer_name}</td>
                        <td className="p-3 text-gray-700">{order.customer_phone}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {order.type_fulfillment === 'LIVRAISON' ? 'Livraison' : 'Emporter'}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono font-bold text-gray-900">{order.total_amount.toFixed(2)} €</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-xs">
                              {order.payment_mode === 'EN_LIGNE' ? 'Carte' : 'Espèces'}
                            </Badge>
                            <Badge variant={order.payment_status === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                              {order.payment_status === 'PAID' ? 'Payé' : 'En attente'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={`${STATUS_COLORS[order.status]} text-xs`}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-500 text-xs">{formatTime(order.created_at)}</td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Catégories ({categories.length})</h3>
                  <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="add-category-btn">
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouvelle catégorie</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Nom</Label>
                          <Input
                            value={newCategory.nom}
                            onChange={(e) => setNewCategory({ ...newCategory, nom: e.target.value })}
                            data-testid="category-name-input"
                          />
                        </div>
                        <div>
                          <Label>Ordre d'affichage</Label>
                          <Input
                            type="number"
                            value={newCategory.ordre}
                            onChange={(e) => setNewCategory({ ...newCategory, ordre: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <Button onClick={createCategory} className="w-full" data-testid="save-category-btn">
                          Créer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900 font-medium">{cat.nom}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Produits ({products.length})</h3>
                  <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="add-product-btn">
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouveau produit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label>Nom</Label>
                          <Input
                            value={newProduct.nom}
                            onChange={(e) => setNewProduct({ ...newProduct, nom: e.target.value })}
                            data-testid="product-name-input"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Prix (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newProduct.prix}
                            onChange={(e) => setNewProduct({ ...newProduct, prix: e.target.value })}
                            data-testid="product-price-input"
                          />
                        </div>
                        <div>
                          <Label>Catégorie</Label>
                          <Select value={newProduct.category_id} onValueChange={(v) => setNewProduct({ ...newProduct, category_id: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>URL Image (optionnel)</Label>
                          <Input
                            value={newProduct.image_url}
                            onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                          />
                        </div>
                        <Button onClick={createProduct} className="w-full" data-testid="save-product-btn">
                          Créer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map(prod => (
                    <div key={prod.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{prod.nom}</p>
                        <p className="text-sm text-gray-600 font-mono">{prod.prix.toFixed(2)} €</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditProduct(prod)}>
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(prod.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Edit Product Dialog */}
            <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le produit</DialogTitle>
                </DialogHeader>
                {editProduct && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={editProduct.nom}
                        onChange={(e) => setEditProduct({ ...editProduct, nom: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editProduct.description || ''}
                        onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Prix (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editProduct.prix}
                        onChange={(e) => setEditProduct({ ...editProduct, prix: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select value={editProduct.category_id} onValueChange={(v) => setEditProduct({ ...editProduct, category_id: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>URL Image</Label>
                      <Input
                        value={editProduct.image_url || ''}
                        onChange={(e) => setEditProduct({ ...editProduct, image_url: e.target.value })}
                      />
                    </div>
                    <Button onClick={updateProduct} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Utilisateurs ({users.length})</h3>
                <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="add-user-btn">
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvel utilisateur</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={newUser.nom}
                          onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                          data-testid="user-name-input"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          data-testid="user-email-input"
                        />
                      </div>
                      <div>
                        <Label>Mot de passe</Label>
                        <Input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          data-testid="user-password-input"
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input
                          value={newUser.telephone}
                          onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Rôle</Label>
                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENT">Client</SelectItem>
                            <SelectItem value="CUISINE">Cuisine</SelectItem>
                            <SelectItem value="CAISSE">Caisse</SelectItem>
                            <SelectItem value="LIVREUR">Livreur</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={createUser} className="w-full" data-testid="save-user-btn">
                        Créer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-700">Nom</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Téléphone</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Rôle</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Statut</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{u.nom}</td>
                        <td className="p-3 text-gray-700">{u.email}</td>
                        <td className="p-3 text-gray-700">{u.telephone || '-'}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`
                            ${u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' : ''}
                            ${u.role === 'CUISINE' ? 'bg-orange-100 text-orange-700' : ''}
                            ${u.role === 'CAISSE' ? 'bg-blue-100 text-blue-700' : ''}
                            ${u.role === 'LIVREUR' ? 'bg-purple-100 text-purple-700' : ''}
                            ${u.role === 'CLIENT' ? 'bg-gray-100 text-gray-700' : ''}
                          `}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={u.is_active ? 'default' : 'secondary'}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserActive(u.id)}
                            data-testid={`toggle-user-${u.id}`}
                          >
                            {u.is_active ? 'Désactiver' : 'Activer'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            {settings && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4 bg-white">
                  <h3 className="font-semibold text-gray-900 mb-4">Restaurant</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Adresse</Label>
                      <Input
                        value={settings.restaurant_address || ''}
                        onChange={(e) => setSettings({ ...settings, restaurant_address: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Rayon de livraison (km)</Label>
                      <Input
                        type="number"
                        value={settings.delivery_radius_km || ''}
                        onChange={(e) => setSettings({ ...settings, delivery_radius_km: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Frais de livraison (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.delivery_fee || ''}
                        onChange={(e) => setSettings({ ...settings, delivery_fee: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Commande minimum (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.minimum_order || ''}
                        onChange={(e) => setSettings({ ...settings, minimum_order: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Paiement hors ligne</Label>
                      <Switch
                        checked={settings.paiement_hors_ligne_enabled}
                        onCheckedChange={(v) => setSettings({ ...settings, paiement_hors_ligne_enabled: v })}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white">
                  <h3 className="font-semibold text-gray-900 mb-4">Paiement (Stripe)</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Stripe activé</Label>
                      <Switch
                        checked={settings.stripe_enabled}
                        onCheckedChange={(v) => setSettings({ ...settings, stripe_enabled: v })}
                      />
                    </div>
                    <div>
                      <Label>Clé API Stripe</Label>
                      <Input
                        type="password"
                        value={settings.stripe_api_key || ''}
                        onChange={(e) => setSettings({ ...settings, stripe_api_key: e.target.value })}
                        placeholder="sk_..."
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white">
                  <h3 className="font-semibold text-gray-900 mb-4">Notifications Email (SendGrid)</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Clé API SendGrid</Label>
                      <Input
                        type="password"
                        value={settings.sendgrid_api_key || ''}
                        onChange={(e) => setSettings({ ...settings, sendgrid_api_key: e.target.value })}
                        placeholder="SG..."
                      />
                    </div>
                    <div>
                      <Label>Email expéditeur</Label>
                      <Input
                        value={settings.sender_email || ''}
                        onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
                        placeholder="contact@odelices.fr"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white">
                  <h3 className="font-semibold text-gray-900 mb-4">Notifications SMS (Twilio)</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Account SID</Label>
                      <Input
                        type="password"
                        value={settings.twilio_account_sid || ''}
                        onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Auth Token</Label>
                      <Input
                        type="password"
                        value={settings.twilio_auth_token || ''}
                        onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Numéro Twilio</Label>
                      <Input
                        value={settings.twilio_phone_number || ''}
                        onChange={(e) => setSettings({ ...settings, twilio_phone_number: e.target.value })}
                        placeholder="+33..."
                      />
                    </div>
                  </div>
                </Card>

                <div className="md:col-span-2">
                  <Button onClick={updateSettings} className="w-full" data-testid="save-settings-btn">
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder les paramètres
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Commande {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Badge className={STATUS_COLORS[selectedOrder.status]}>
                  {selectedOrder.status.replace('_', ' ')}
                </Badge>
                <Badge variant={selectedOrder.payment_status === 'PAID' ? 'default' : 'secondary'}>
                  {selectedOrder.payment_status === 'PAID' ? 'Payé' : 'En attente'}
                </Badge>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-gray-900"><strong>Client:</strong> {selectedOrder.customer_name}</p>
                <p className="text-gray-700"><strong>Téléphone:</strong> {selectedOrder.customer_phone}</p>
                <p className="text-gray-700"><strong>Type:</strong> {selectedOrder.type_fulfillment === 'LIVRAISON' ? 'Livraison' : 'À emporter'}</p>
                {selectedOrder.delivery_address && (
                  <p className="text-gray-700"><strong>Adresse:</strong> {selectedOrder.delivery_address}</p>
                )}
                <p className="text-gray-700"><strong>Paiement:</strong> {selectedOrder.payment_mode === 'EN_LIGNE' ? 'Carte' : 'Espèces'}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Articles commandés</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.quantite}x {item.nom_snapshot}</span>
                      <span className="font-mono text-gray-900">{(item.prix_unitaire * item.quantite).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-4 pt-2 border-t">
                  <span>Total</span>
                  <span className="font-mono text-primary">{selectedOrder.total_amount.toFixed(2)} €</span>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Commandé le {formatTime(selectedOrder.created_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
