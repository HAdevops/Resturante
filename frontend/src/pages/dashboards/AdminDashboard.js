import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, UtensilsCrossed, Settings, LogOut, RefreshCw,
  Plus, Edit, Trash2, Save, ChevronRight, X, ShoppingCart, DollarSign,
  Clock, TrendingUp
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', email: '', password: '', telephone: '', role: 'CLIENT' });
  
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ nom: '', ordre: 0 });
  
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ nom: '', description: '', prix: '', category_id: '', image_url: '' });
  
  const [editProduct, setEditProduct] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, usersRes, categoriesRes, productsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/menu/categories`),
        axios.get(`${API}/menu/products`),
        axios.get(`${API}/admin/settings`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCategories(categoriesRes.data);
      setProducts(productsRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
          <h1 className="text-2xl font-bold" data-testid="admin-title">Super Admin</h1>
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
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Commandes totales</p>
                  <p className="text-2xl font-bold">{stats.total_orders}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold font-mono">{stats.total_revenue.toFixed(2)} €</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aujourd'hui</p>
                  <p className="text-2xl font-bold">{stats.today_orders}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">En attente</p>
                  <p className="text-2xl font-bold">{stats.pending_orders}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="menu">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Catégories</h3>
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
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <span className="text-gray-900 font-medium">{cat.nom}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Produits ({products.length})</h3>
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
                    <div key={prod.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
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

          <TabsContent value="users">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Utilisateurs ({users.length})</h3>
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
                    <tr className="border-b">
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Rôle</th>
                      <th className="text-left p-2">Statut</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b">
                        <td className="p-2">{u.nom}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">
                          <Badge variant="outline">{u.role}</Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant={u.is_active ? 'default' : 'secondary'}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="p-2">
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

          <TabsContent value="settings">
            {settings && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Restaurant</h3>
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

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Paiement (Stripe)</h3>
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

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Notifications Email (SendGrid)</h3>
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

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Notifications SMS (Twilio)</h3>
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

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Stockage Images (Cloudflare)</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Account ID Cloudflare</Label>
                      <Input
                        value={settings.cloudflare_account_id || ''}
                        onChange={(e) => setSettings({ ...settings, cloudflare_account_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>API Token Cloudflare</Label>
                      <Input
                        type="password"
                        value={settings.cloudflare_api_token || ''}
                        onChange={(e) => setSettings({ ...settings, cloudflare_api_token: e.target.value })}
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
    </div>
  );
}
