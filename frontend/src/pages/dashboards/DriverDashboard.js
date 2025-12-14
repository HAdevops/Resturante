import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Bike, MapPin, Phone, User, Navigation, CheckCircle, RefreshCw, LogOut, Package, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/deliveries/my`);
      setDeliveries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 10000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const startDelivery = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/out-for-delivery`);
      toast.success('Livraison démarrée');
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const markDelivered = async (orderId) => {
    try {
      await axios.post(`${API}/orders/${orderId}/delivered`);
      toast.success('Livraison terminée !');
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const openWaze = (address) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const pending = deliveries.filter(d => ['PRÊTE', 'ASSIGNÉE_LIVREUR'].includes(d.status));
  const inProgress = deliveries.filter(d => d.status === 'EN_LIVRAISON');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bike className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold" data-testid="driver-title">Mes Livraisons</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={fetchDeliveries} className="border-gray-600" data-testid="refresh-deliveries">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400">{user?.nom}</span>
          <Button variant="outline" size="icon" onClick={handleLogout} className="border-gray-600" data-testid="logout-btn">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            À récupérer ({pending.length})
          </h2>
          
          {pending.length === 0 ? (
            <Card className="p-6 bg-gray-800 border-gray-700 text-center">
              <p className="text-gray-400">Aucune livraison en attente</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pending.map(delivery => (
                <Card key={delivery.id} className="p-4 bg-gray-800 border-gray-700" data-testid={`delivery-${delivery.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-lg">{delivery.order_number}</span>
                    <Badge className="bg-amber-500">Prête</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {delivery.customer_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${delivery.customer_phone}`} className="text-amber-400 underline">
                        {delivery.customer_phone}
                      </a>
                    </p>
                    {delivery.delivery_address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {delivery.delivery_address}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {formatTime(delivery.created_at)}
                    </p>
                  </div>

                  <div className="text-sm mb-4 p-2 bg-gray-700 rounded">
                    {delivery.items.map((item, i) => (
                      <div key={i}>{item.quantite}x {item.nom_snapshot}</div>
                    ))}
                    <div className="font-bold mt-2 pt-2 border-t border-gray-600">
                      Total: {delivery.total_amount.toFixed(2)} €
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {delivery.delivery_address && (
                      <Button 
                        variant="outline" 
                        className="border-gray-600"
                        onClick={() => openWaze(delivery.delivery_address)}
                        data-testid={`waze-${delivery.id}`}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Waze
                      </Button>
                    )}
                    <Button 
                      className="bg-amber-500 hover:bg-amber-600 col-span-full"
                      onClick={() => startDelivery(delivery.id)}
                      data-testid={`start-delivery-${delivery.id}`}
                    >
                      <Bike className="w-4 h-4 mr-2" />
                      Démarrer livraison
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bike className="w-5 h-5 text-indigo-500" />
            En cours ({inProgress.length})
          </h2>
          
          {inProgress.length === 0 ? (
            <Card className="p-6 bg-gray-800 border-gray-700 text-center">
              <p className="text-gray-400">Aucune livraison en cours</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {inProgress.map(delivery => (
                <Card key={delivery.id} className="p-4 bg-gray-800 border-indigo-500 border-2" data-testid={`delivery-${delivery.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-lg">{delivery.order_number}</span>
                    <Badge className="bg-indigo-500">En livraison</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {delivery.customer_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${delivery.customer_phone}`} className="text-amber-400 underline">
                        {delivery.customer_phone}
                      </a>
                    </p>
                    {delivery.delivery_address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {delivery.delivery_address}
                      </p>
                    )}
                  </div>

                  <div className="text-sm mb-4 p-2 bg-gray-700 rounded">
                    <div className="font-bold">
                      Total: {delivery.total_amount.toFixed(2)} €
                      {delivery.payment_status !== 'PAID' && (
                        <span className="text-red-400 ml-2">(À encaisser)</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {delivery.delivery_address && (
                      <Button 
                        variant="outline" 
                        className="border-gray-600"
                        onClick={() => openWaze(delivery.delivery_address)}
                        data-testid={`waze-${delivery.id}`}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Waze
                      </Button>
                    )}
                    <Button 
                      className="bg-green-600 hover:bg-green-700 col-span-full"
                      onClick={() => markDelivered(delivery.id)}
                      data-testid={`mark-delivered-${delivery.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Livrée
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
