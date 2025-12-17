import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DeliverySlotSelector({ onSlotSelected, selectedSlot }) {
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacityInfo();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCapacityInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCapacityInfo = async () => {
    try {
      const res = await axios.get(`${API}/checkout/available-slots`);
      setCapacityInfo(res.data);
      
      // Auto-select forced slot if at capacity
      if (res.data.is_at_capacity && res.data.forced_slot && onSlotSelected) {
        onSlotSelected({
          type: 'forced',
          start_time: res.data.forced_slot.start_time,
          end_time: res.data.forced_slot.end_time
        });
      }
    } catch (err) {
      console.error('Error fetching capacity info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectImmediate = () => {
    if (onSlotSelected) {
      onSlotSelected({ type: 'immediate' });
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-[#2a2a2a] border-0">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-white/60">Vérification des créneaux...</span>
        </div>
      </Card>
    );
  }

  // At capacity - forced slot
  if (capacityInfo?.is_at_capacity && capacityInfo?.forced_slot) {
    return (
      <Card className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">Forte affluence</h4>
            <p className="text-white/70 text-sm mb-3">
              {capacityInfo.message}
            </p>
            
            <div className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-white font-medium">
                  Créneau: {capacityInfo.forced_slot.start_time} - {capacityInfo.forced_slot.end_time}
                </span>
              </div>
              <Badge className="bg-orange-500">Confirmé</Badge>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Normal operation - immediate delivery available
  return (
    <Card 
      className={`p-4 cursor-pointer transition-all ${
        selectedSlot?.type === 'immediate' 
          ? 'bg-primary/10 border-primary ring-2 ring-primary' 
          : 'bg-[#2a2a2a] border-0 hover:ring-2 hover:ring-primary/50'
      }`}
      onClick={handleSelectImmediate}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Livraison immédiate</h4>
            <p className="text-white/60 text-sm">Estimation: 30-45 minutes</p>
          </div>
        </div>
        
        {selectedSlot?.type === 'immediate' && (
          <Badge className="bg-green-500">Sélectionné</Badge>
        )}
      </div>
    </Card>
  );
}
