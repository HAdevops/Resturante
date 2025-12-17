import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Bike, MapPin, Phone, User, Navigation, CheckCircle, RefreshCw, LogOut, 
  Package, Clock, Volume2, VolumeX, DollarSign, AlertCircle, Map, Banknote, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotificationSound } from '../../hooks/useNotificationSound';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playBeep, initAudio } = useNotificationSound();
  const previousDeliveryCount = useRef(0);
  const isFirstLoad = useRef(true);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/deliveries/my`);
      
      // Check for new deliveries
      const newDeliveriesCount = res.data.filter(d => ['PRÊTE', 'ASSIGNÉE_LIVREUR'].includes(d.status)).length;
      
      if (!isFirstLoad.current && soundEnabled && newDeliveriesCount > previousDeliveryCount.current) {
        playBeep('newOrder');
        toast.info('🔔 Nouvelle livraison assignée !', { duration: 5000 });
      }
      
      previousDeliveryCount.current = newDeliveriesCount;
      isFirstLoad.current = false;
      setDeliveries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, playBeep]);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 10000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleEnableSound = () => {
    initAudio();
    setSoundEnabled(true);
    playBeep('success');
    toast.success('Notifications sonores activées');
  };

  const startDelivery = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/out-for-delivery`);
      toast.success('Livraison démarrée');
      if (soundEnabled) playBeep('success');
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const markPaid = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/mark-paid`);
      toast.success('💰 Paiement encaissé !');
      if (soundEnabled) playBeep('success');
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const markDelivered = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/delivered`);
      toast.success('🎉 Livraison terminée !');
      if (soundEnabled) playBeep('success');
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const openWaze = (address) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
  };

  const openGoogleMaps = (address) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (dateStr) => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  };

  const pending = deliveries.filter(d => ['PRÊTE', 'ASSIGNÉE_LIVREUR'].includes(d.status));
  const inProgress = deliveries.filter(d => d.status === 'EN_LIVRAISON');
  const completed = deliveries.filter(d => d.status === 'LIVRÉE');

  // Stats
  const todayDelivered = completed.filter(d => new Date(d.created_at).toDateString() === new Date().toDateString()).length;
  const totalPending = pending.length + inProgress.length;
  const pendingCash = [...pending, ...inProgress].filter(d => d.payment_status !== 'PAID').reduce((sum, d) => sum + d.total_amount, 0);

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
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Bike className="w-7 h-7 text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="driver-title">Mes Livraisons</h1>
              <p className="text-gray-400 text-sm">{user?.nom}</p>
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
            
            <Button variant="outline" size="icon" onClick={fetchDeliveries} className="border-gray-600" data-testid="refresh-deliveries">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleLogout} className="border-gray-600" data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-700">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center">
            <p className="text-amber-400 text-sm">À livrer</p>
            <p className="text-2xl font-bold text-amber-300">{totalPending}</p>
          </div>
          <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-center">
            <p className="text-green-400 text-sm">Livrées aujourd'hui</p>
            <p className="text-2xl font-bold text-green-300">{todayDelivered}</p>
          </div>
          <div className="p-3 bg-orange-500/20 border border-orange-500/40 rounded-xl text-center">
            <p className="text-orange-400 text-sm">À encaisser</p>
            <p className="text-xl font-bold text-orange-300 font-mono">{pendingCash.toFixed(0)} €</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* In Progress Section */}
        {inProgress.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
              En cours de livraison ({inProgress.length})
            </h2>
            
            <div className="space-y-4">
              {inProgress.map(delivery => (
                <Card key={delivery.id} className="p-4 bg-gradient-to-r from-indigo-900/50 to-gray-800 border-2 border-indigo-500 rounded-xl" data-testid={`delivery-${delivery.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-2xl text-indigo-400">{delivery.order_number}</span>
                    <Badge className="bg-indigo-500 text-white animate-pulse">🚚 EN ROUTE</Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-lg font-semibold">{delivery.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <a href={`tel:${delivery.customer_phone}`} className="text-amber-400 text-lg font-bold underline">
                        📞 {delivery.customer_phone}
                      </a>
                    </div>
                    {delivery.delivery_address && (
                      <div className="flex items-start gap-3 p-3 bg-white/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <span className="text-white">{delivery.delivery_address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg mb-4">
                    <span className="text-gray-300">Total</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono text-white">{delivery.total_amount.toFixed(2)} €</span>
                      {delivery.payment_status !== 'PAID' ? (
                        <Badge className="bg-red-500 animate-pulse">💵 À ENCAISSER</Badge>
                      ) : (
                        <Badge className="bg-green-500">✓ PAYÉ</Badge>
                      )}
                    </div>
                  </div>

                  {/* Payment Button - Show if not paid */}
                  {delivery.payment_status !== 'PAID' && (
                    <Button 
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 mb-3"
                      onClick={() => markPaid(delivery.id)}
                      data-testid={`mark-paid-${delivery.id}`}
                    >
                      <Banknote className="w-6 h-6 mr-2" />
                      ENCAISSÉ - {delivery.total_amount.toFixed(2)} €
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {delivery.delivery_address && (
                      <>
                        <Button 
                          className="h-14 text-lg bg-blue-600 hover:bg-blue-700"
                          onClick={() => openWaze(delivery.delivery_address)}
                          data-testid={`waze-${delivery.id}`}
                        >
                          <Navigation className="w-6 h-6 mr-2" />
                          Waze
                        </Button>
                        <Button 
                          className="h-14 text-lg bg-green-600 hover:bg-green-700"
                          onClick={() => openGoogleMaps(delivery.delivery_address)}
                        >
                          <Map className="w-6 h-6 mr-2" />
                          Maps
                        </Button>
                      </>
                    )}
                    <Button 
                      className="h-16 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 col-span-2"
                      onClick={() => markDelivered(delivery.id)}
                      data-testid={`mark-delivered-${delivery.id}`}
                    >
                      <CheckCircle className="w-7 h-7 mr-2" />
                      LIVRÉE ✓
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pending Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            À récupérer ({pending.length})
          </h2>
          
          {pending.length === 0 ? (
            <Card className="p-8 bg-gray-800 border-gray-700 text-center">
              <Package className="w-16 h-16 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-lg">Aucune livraison en attente</p>
              <p className="text-gray-500 text-sm mt-1">Les nouvelles livraisons apparaîtront ici</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pending.map(delivery => (
                <Card key={delivery.id} className="p-4 bg-gray-800 border-2 border-amber-500/50 rounded-xl hover:border-amber-500 transition-colors" data-testid={`delivery-${delivery.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-2xl text-amber-400">{delivery.order_number}</span>
                    <Badge className="bg-amber-500 text-gray-900">⏳ {getTimeSince(delivery.created_at)}</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{delivery.customer_name}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${delivery.customer_phone}`} className="text-amber-400 underline">
                        {delivery.customer_phone}
                      </a>
                    </p>
                    {delivery.delivery_address && (
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <span className="text-gray-300">{delivery.delivery_address}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500">{formatTime(delivery.created_at)}</span>
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
                    {delivery.items.map((item, i) => (
                      <div key={i} className="text-gray-300 py-0.5">{item.quantite}x {item.nom_snapshot}</div>
                    ))}
                    <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t border-gray-700">
                      <span>Total</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl text-amber-400">{delivery.total_amount.toFixed(2)} €</span>
                        {delivery.payment_status === 'PAID' && (
                          <Badge className="bg-green-500 text-xs">✓ PAYÉ</Badge>
                        )}
                      </div>
                    </div>
                    {delivery.payment_status !== 'PAID' && (
                      <div className="mt-2 p-2 bg-red-500/20 rounded-lg text-center">
                        <span className="text-red-400 font-semibold">💵 À encaisser à la livraison</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {delivery.delivery_address && (
                      <Button 
                        variant="outline" 
                        className="h-12 border-gray-600 hover:bg-blue-900/50"
                        onClick={() => openWaze(delivery.delivery_address)}
                        data-testid={`waze-${delivery.id}`}
                      >
                        <Navigation className="w-5 h-5 mr-2" />
                        Itinéraire
                      </Button>
                    )}
                    <Button 
                      className={`h-12 text-lg font-bold bg-amber-500 hover:bg-amber-600 text-gray-900 ${!delivery.delivery_address ? 'col-span-2' : ''}`}
                      onClick={() => startDelivery(delivery.id)}
                      data-testid={`start-delivery-${delivery.id}`}
                    >
                      <Bike className="w-5 h-5 mr-2" />
                      GO !
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Today */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Terminées ({completed.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {completed.slice(0, 6).map(delivery => (
                <Card key={delivery.id} className="p-3 bg-gray-800/50 border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-green-400">{delivery.order_number}</span>
                    <span className="font-mono text-gray-400">{delivery.total_amount.toFixed(2)} €</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{delivery.customer_name}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
