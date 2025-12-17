import { useState, useEffect } from 'react';
import { Gift, X, PartyPopper } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import confetti from 'canvas-confetti';

export default function LoyaltyPopup({ phone, isOpen, onClose }) {
  const [loyaltyStatus, setLoyaltyStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && phone) {
      checkLoyaltyStatus();
    }
  }, [isOpen, phone]);

  const checkLoyaltyStatus = async () => {
    if (!phone) return;
    
    setLoading(true);
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      const cleanPhone = phone.replace(/\s/g, '');
      const res = await fetch(`${API}/loyalty/check/${cleanPhone}`);
      if (res.ok) {
        const data = await res.json();
        setLoyaltyStatus(data);
        
        // Trigger confetti if eligible
        if (data.is_eligible) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 300);
        }
      }
    } catch (err) {
      console.error('Loyalty check error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || loading || !loyaltyStatus?.is_eligible) {
    return null;
  }

  return (
    <Dialog open={isOpen && loyaltyStatus?.is_eligible} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 border-0 text-white">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center py-6">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <Gift className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <PartyPopper className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-white mb-2">
              Félicitations ! 🎉
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <p className="text-lg text-white/90">
              Vous avez passé <span className="font-bold text-yellow-300">{loyaltyStatus.orders_count}</span> commandes chez O'Delices !
            </p>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
              <p className="text-xl font-semibold text-white">
                Vous êtes éligible à un <span className="text-yellow-300">cadeau</span> !
              </p>
              <p className="text-white/80 text-sm mt-2">
                Signalez-le au comptoir lors du retrait ou au livreur.
              </p>
            </div>
            
            <Button 
              onClick={onClose}
              className="w-full mt-6 bg-white text-orange-600 hover:bg-white/90 font-bold py-6 text-lg rounded-full"
            >
              Continuer ma commande
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
