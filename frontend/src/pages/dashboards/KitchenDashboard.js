import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Clock, ChefHat, CheckCircle, RefreshCw, LogOut, AlertCircle, Utensils, Volume2, VolumeX, Wifi, WifiOff, Gift, Bell } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotificationSound } from '../../hooks/useNotificationSound';
import useWebSocket from '../../hooks/useWebSocket';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function KitchenDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playBeep, initAudio } = useNotificationSound();
  const previousOrderCount = useRef(0);
  const isFirstLoad = useRef(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/orders`);
      const kitchenOrders = res.data.filter(o => 
        ['REÇUE', 'ACCUSÉE_CUISINE', 'EN_PRÉPARATION', 'PRÊTE'].includes(o.status)
      );
      
      // Check for new orders and play sound
      const newOrdersCount = kitchenOrders.filter(o => o.status === 'REÇUE').length;
      
      if (!isFirstLoad.current && soundEnabled && newOrdersCount > previousOrderCount.current) {
        playBeep('newOrder');
        toast.info('🔔 Nouvelle commande !', {
          duration: 5000,
          className: 'bg-blue-600 text-white',
        });
      }
      
      previousOrderCount.current = newOrdersCount;
      isFirstLoad.current = false;
      setOrders(kitchenOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, playBeep]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Enable audio on first interaction
  const handleEnableSound = () => {
    initAudio();
    setSoundEnabled(true);
    playBeep('success');
    toast.success('Notifications sonores activées');
  };

  const acknowledgeOrder = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/kitchen-ack`);
      toast.success('Commande accusée');
      if (soundEnabled) playBeep('success');
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
      if (soundEnabled) playBeep('orderReady');
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

  const getTimeSince = (dateStr) => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  };

  // Time-based urgency colors
  const getUrgencyClass = (dateStr) => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (minutes > 20) return 'border-red-500 bg-red-500/10 animate-pulse';
    if (minutes > 10) return 'border-orange-500 bg-orange-500/10';
    return 'border-blue-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="kitchen-title">Cuisine - KDS</h1>
              <p className="text-gray-400 text-sm">Écran de préparation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <Button
              variant={soundEnabled ? 'default' : 'outline'}
              size="icon"
              onClick={() => soundEnabled ? setSoundEnabled(false) : handleEnableSound()}
              className={soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'border-gray-600'}
              title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
              data-testid="toggle-sound"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-sm text-gray-400">Connecté</p>
              <p className="font-semibold">{user?.nom}</p>
            </div>
            <Button variant="outline" size="icon" onClick={fetchOrders} className="border-gray-600" data-testid="refresh-orders">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout} className="border-gray-600" data-testid="logout-btn">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4 sm:gap-6 mt-4 pt-4 border-t border-gray-700 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-blue-400 font-bold text-lg">{newOrders.length}</span>
            <span className="text-blue-400 hidden sm:inline">Nouvelles</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-orange-400 font-bold text-lg">{inProgress.length}</span>
            <span className="text-orange-400 hidden sm:inline">En cours</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-green-400 font-bold text-lg">{ready.length}</span>
            <span className="text-green-400 hidden sm:inline">Prêtes</span>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-[calc(100vh-180px)]">
        {/* New Orders Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-xl">
            <Bell className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-blue-300 text-lg">NOUVELLES</span>
            <Badge className="bg-blue-500 ml-auto text-lg px-3 py-1">{newOrders.length}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {newOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">Aucune nouvelle commande</p>
                <p className="text-sm mt-1">En attente...</p>
              </div>
            ) : (
              newOrders.map(order => (
                <Card 
                  key={order.id} 
                  className={`p-4 bg-gray-800 border-2 rounded-xl ${getUrgencyClass(order.created_at)}`}
                  data-testid={`order-${order.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-2xl text-blue-400">{order.order_number}</span>
                    <Badge className="bg-red-500 text-white text-sm px-2 py-1">
                      ⏱️ {getTimeSince(order.created_at)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(order.created_at)}</span>
                    <Badge variant="outline" className="ml-auto border-gray-600 text-gray-300">
                      {order.type_fulfillment === 'LIVRAISON' ? '🚚 Livraison' : '🏃 Emporter'}
                    </Badge>
                  </div>

                  <div className="bg-gray-900/60 rounded-lg p-3 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-700 last:border-0">
                        <span className="text-amber-500 font-bold text-xl min-w-[2rem]">{item.quantite}x</span>
                        <span className="text-white font-medium text-lg">{item.nom_snapshot}</span>
                      </div>
                    ))}
                  </div>

                  {order.delivery_notes && (
                    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-3">
                      <p className="text-yellow-300 text-sm">
                        <strong>📝 Note:</strong> {order.delivery_notes}
                      </p>
                    </div>
                  )}

                  <Button 
                    className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 transition-all hover:scale-[1.02]"
                    onClick={() => acknowledgeOrder(order.id)}
                    data-testid={`ack-${order.id}`}
                  >
                    <CheckCircle className="w-6 h-6 mr-2" />
                    ACCUSÉ RÉCEPTION
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4 p-3 bg-orange-500/20 border border-orange-500/50 rounded-xl">
            <Utensils className="w-6 h-6 text-orange-400" />
            <span className="font-bold text-orange-300 text-lg">EN PRÉPARATION</span>
            <Badge className="bg-orange-500 ml-auto text-lg px-3 py-1">{inProgress.length}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {inProgress.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">Aucune commande en préparation</p>
              </div>
            ) : (
              inProgress.map(order => (
                <Card key={order.id} className="p-4 bg-gray-800 border-2 border-orange-500 rounded-xl" data-testid={`order-${order.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-2xl text-orange-400">{order.order_number}</span>
                    <Badge className="bg-orange-500 text-white text-sm px-2 py-1">
                      ⏱️ {getTimeSince(order.created_at)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={order.status === 'ACCUSÉE_CUISINE' ? 'bg-yellow-600' : 'bg-orange-600'}>
                      {order.status === 'ACCUSÉE_CUISINE' ? '⏳ À démarrer' : '👨‍🍳 En cours'}
                    </Badge>
                    <Badge variant="outline" className="ml-auto border-gray-600 text-gray-300">
                      {order.type_fulfillment === 'LIVRAISON' ? '🚚' : '🏃'}
                    </Badge>
                  </div>

                  <div className="bg-gray-900/60 rounded-lg p-3 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b border-gray-700 last:border-0">
                        <span className="text-amber-500 font-bold text-xl min-w-[2rem]">{item.quantite}x</span>
                        <span className="text-white font-medium text-lg">{item.nom_snapshot}</span>
                      </div>
                    ))}
                  </div>

                  {order.status === 'ACCUSÉE_CUISINE' ? (
                    <Button 
                      className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 transition-all hover:scale-[1.02]"
                      onClick={() => startPreparation(order.id)}
                      data-testid={`start-${order.id}`}
                    >
                      <ChefHat className="w-6 h-6 mr-2" />
                      COMMENCER
                    </Button>
                  ) : (
                    <Button 
                      className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 transition-all hover:scale-[1.02]"
                      onClick={() => markReady(order.id)}
                      data-testid={`ready-${order.id}`}
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      PRÊTE
                    </Button>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="font-bold text-green-300 text-lg">PRÊTES</span>
            <Badge className="bg-green-500 ml-auto text-lg px-3 py-1">{ready.length}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {ready.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">Aucune commande prête</p>
              </div>
            ) : (
              ready.map(order => (
                <Card key={order.id} className="p-4 bg-gray-800 border-2 border-green-500 rounded-xl" data-testid={`order-${order.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-2xl text-green-400">{order.order_number}</span>
                    <Badge className="bg-green-500 text-white">✓ PRÊTE</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-white text-lg">{order.customer_name}</span>
                    <Badge variant="outline" className="ml-auto border-gray-600 text-gray-300">
                      {order.type_fulfillment === 'LIVRAISON' ? '🚚 Livraison' : '🏃 Emporter'}
                    </Badge>
                  </div>

                  <div className="bg-gray-900/60 rounded-lg p-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="text-gray-300 text-sm py-0.5">
                        {item.quantite}x {item.nom_snapshot}
                      </div>
                    ))}
                  </div>

                  {order.assigned_driver_name && (
                    <div className="mt-3 p-3 bg-purple-500/20 border border-purple-500/40 rounded-lg">
                      <p className="text-purple-300 flex items-center gap-2">
                        <span className="text-lg">🛵</span>
                        <span>Livreur: <strong>{order.assigned_driver_name}</strong></span>
                      </p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
