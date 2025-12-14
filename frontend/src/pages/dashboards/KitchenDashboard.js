import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Clock, ChefHat, CheckCircle, XCircle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  'REÇUE': 'bg-blue-500 animate-pulse',
  'ACCUSÉE_CUISINE': 'bg-yellow-500',
  'EN_PRÉPARATION': 'bg-orange-500',
  'PRÊTE': 'bg-green-500',
};

export default function KitchenDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/orders`);
      const kitchenOrders = res.data.filter(o => 
        ['REÇUE', 'ACCUSÉE_CUISINE', 'EN_PRÉPARATION', 'PRÊTE'].includes(o.status)
      );
      setOrders(kitchenOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const acknowledgeOrder = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/kitchen-ack`);
      toast.success('Commande accusée');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const startPreparation = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/start-preparation`);
      toast.success('Préparation commencée');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const markReady = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/ready`);
      toast.success('Commande prête !');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  const newOrders = orders.filter(o => o.status === 'REÇUE');
  const inProgress = orders.filter(o => ['ACCUSÉE_CUISINE', 'EN_PRÉPARATION'].includes(o.status));
  const ready = orders.filter(o => o.status === 'PRÊTE');

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-white text-black p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ChefHat className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold" data-testid="kitchen-title">Cuisine - KDS</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.nom}</span>
          <Button variant="outline" size="icon" onClick={fetchOrders} data-testid="refresh-orders">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleLogout} data-testid="logout-btn">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-100 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">Nouvelles ({newOrders.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {newOrders.map(order => (
              <Card key={order.id} className="p-3 border-2 border-blue-500 bg-blue-50" data-testid={`order-${order.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-lg">{order.order_number}</span>
                  <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTime(order.created_at)}
                </p>
                <div className="space-y-1 mb-3 text-sm">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-medium">{item.quantite}x {item.nom_snapshot}</span>
                    </div>
                  ))}
                </div>
                {order.delivery_notes && (
                  <p className="text-xs bg-yellow-100 p-2 rounded mb-2 text-yellow-800">
                    Note: {order.delivery_notes}
                  </p>
                )}
                <Button 
                  className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
                  onClick={() => acknowledgeOrder(order.id)}
                  data-testid={`ack-${order.id}`}
                >
                  Accusé réception
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 p-2 bg-orange-100 rounded-lg">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-800">En préparation ({inProgress.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {inProgress.map(order => (
              <Card key={order.id} className="p-3 border-2 border-orange-500 bg-orange-50" data-testid={`order-${order.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-lg">{order.order_number}</span>
                  <Badge className={STATUS_COLORS[order.status]}>{order.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTime(order.created_at)}
                </p>
                <div className="space-y-1 mb-3 text-sm">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-medium">{item.quantite}x {item.nom_snapshot}</span>
                    </div>
                  ))}
                </div>
                {order.status === 'ACCUSÉE_CUISINE' ? (
                  <Button 
                    className="w-full h-12 text-lg font-bold bg-orange-600 hover:bg-orange-700"
                    onClick={() => startPreparation(order.id)}
                    data-testid={`start-${order.id}`}
                  >
                    Commencer préparation
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
                    onClick={() => markReady(order.id)}
                    data-testid={`ready-${order.id}`}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Prête
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Prêtes ({ready.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {ready.map(order => (
              <Card key={order.id} className="p-3 border-2 border-green-500 bg-green-50" data-testid={`order-${order.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-lg">{order.order_number}</span>
                  <Badge className={STATUS_COLORS[order.status]}>PRÊTE</Badge>
                </div>
                <p className="text-sm mb-2">
                  <strong>{order.type_fulfillment === 'LIVRAISON' ? 'Livraison' : 'À emporter'}</strong>
                </p>
                <p className="text-sm text-gray-600">{order.customer_name}</p>
                <div className="space-y-1 mt-2 text-sm">
                  {order.items.map((item, i) => (
                    <div key={i}>{item.quantite}x {item.nom_snapshot}</div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
