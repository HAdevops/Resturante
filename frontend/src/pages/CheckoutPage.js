import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Banknote, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoyaltyPopup from '../components/LoyaltyPopup';
import DeliverySlotSelector from '../components/DeliverySlotSelector';
import { useCart } from '../contexts/CartContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const {
    items,
    total,
    fulfillmentType,
    deliveryAddress,
    deliveryNotes,
    deliveryNote,
    customerInfo,
    deliverySlot,
    setDeliverySlot,
    clearCart
  } = useCart();

  const [paymentMode, setPaymentMode] = useState('EN_LIGNE');
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(!!sessionId);
  const [showLoyaltyPopup, setShowLoyaltyPopup] = useState(false);
  const [loyaltyChecked, setLoyaltyChecked] = useState(false);
  const [checkoutConfig, setCheckoutConfig] = useState({ delivery_time_slots_enabled: true });

  useEffect(() => {
    fetchCheckoutConfig();
  }, []);

  const fetchCheckoutConfig = async () => {
    try {
      const res = await axios.get(`${API}/checkout/config`);
      setCheckoutConfig(res.data);
    } catch (err) {
      console.error('Error fetching checkout config:', err);
    }
  };

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [sessionId]);

  // Check loyalty status on mount
  useEffect(() => {
    if (customerInfo.phone && !loyaltyChecked) {
      setShowLoyaltyPopup(true);
      setLoyaltyChecked(true);
    }
  }, [customerInfo.phone, loyaltyChecked]);

  const pollPaymentStatus = async (sid, attempts = 0) => {
    const maxAttempts = 5;
    if (attempts >= maxAttempts) {
      setCheckingPayment(false);
      toast.error('Impossible de vérifier le paiement. Veuillez vérifier votre email.');
      return;
    }

    try {
      const res = await axios.get(`${API}/payments/status/${sid}`);
      if (res.data.payment_status === 'paid') {
        clearCart();
        toast.success('Paiement réussi !');
        const orderNumber = localStorage.getItem('pending_order_number');
        if (orderNumber) {
          localStorage.removeItem('pending_order_number');
          navigate(`/suivi/${orderNumber}`);
        } else {
          navigate('/');
        }
        return;
      }
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), 2000);
    } catch (err) {
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), 2000);
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      navigate('/menu');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product.id,
          quantite: item.quantity,
          options_snapshot_json: item.options
        })),
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email || null,
        type_fulfillment: fulfillmentType,
        delivery_address: fulfillmentType === 'LIVRAISON' ? deliveryAddress : null,
        delivery_notes: deliveryNotes || null,
        delivery_note: fulfillmentType === 'LIVRAISON' ? deliveryNote : null,
        payment_mode: paymentMode
      };

      const orderRes = await axios.post(`${API}/orders`, orderData);
      const order = orderRes.data;

      if (paymentMode === 'EN_LIGNE') {
        localStorage.setItem('pending_order_number', order.order_number);
        
        const checkoutRes = await axios.post(`${API}/payments/create-checkout`, {
          order_id: order.id,
          origin_url: window.location.origin
        });

        window.location.href = checkoutRes.data.url;
      } else {
        clearCart();
        toast.success('Commande enregistrée !');
        navigate(`/suivi/${order.order_number}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (checkingPayment) {
    return (
      <div className="min-h-screen bg-background noise-bg">
        <Navbar />
        <div className="pt-20 md:pt-28 pb-28 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
          <h1 className="text-2xl font-serif mb-2">Vérification du paiement...</h1>
          <p className="text-muted-foreground">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/menu');
    return null;
  }

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <div className="pt-20 md:pt-28 pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-8" data-testid="checkout-title">
            Paiement
          </h1>

          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">Récapitulatif de commande</h2>
            
            <div className="space-y-3 mb-4">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}x {item.product.nom}</span>
                  <span className="font-mono">{(item.product.prix * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary font-mono">{total.toFixed(2)} €</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
              <p><strong>Client:</strong> {customerInfo.name}</p>
              <p><strong>Téléphone:</strong> {customerInfo.phone}</p>
              <p><strong>Mode:</strong> {fulfillmentType === 'LIVRAISON' ? 'Livraison' : 'À emporter'}</p>
              {deliveryAddress && <p><strong>Adresse:</strong> {deliveryAddress}</p>}
            </div>
          </Card>

          {/* Delivery Slot Selector - Only for delivery orders */}
          {fulfillmentType === 'LIVRAISON' && (
            <Card className="p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Créneau de livraison</h2>
              <DeliverySlotSelector 
                onSlotSelected={setDeliverySlot}
                selectedSlot={deliverySlot}
              />
            </Card>
          )}

          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">Mode de paiement</h2>
            
            <RadioGroup value={paymentMode} onValueChange={setPaymentMode} className="space-y-3">
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="EN_LIGNE" id="online" data-testid="payment-online" />
                <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer flex-1">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium">Paiement en ligne</p>
                    <p className="text-sm text-muted-foreground">Carte bancaire sécurisée</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="A_LA_LIVRAISON" id="delivery" data-testid="payment-delivery" />
                <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Banknote className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium">Paiement à la {fulfillmentType === 'LIVRAISON' ? 'livraison' : 'récupération'}</p>
                    <p className="text-sm text-muted-foreground">Espèces ou carte sur place</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          <Button
            className="w-full rounded-full btn-glow"
            size="lg"
            onClick={handleSubmit}
            disabled={loading}
            data-testid="confirm-order"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Traitement...
              </>
            ) : paymentMode === 'EN_LIGNE' ? (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Payer {total.toFixed(2)} €
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirmer la commande
              </>
            )}
          </Button>
        </div>
      </div>

      <Footer showPrivacyPolicy={false} />

      {/* Loyalty Popup */}
      <LoyaltyPopup 
        phone={customerInfo.phone}
        isOpen={showLoyaltyPopup}
        onClose={() => setShowLoyaltyPopup(false)}
      />
    </div>
  );
}
