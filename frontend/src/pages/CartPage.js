import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, MapPin, FileText, ChevronRight, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    removeItem,
    updateQuantity,
    total,
    fulfillmentType,
    setFulfillmentType,
    deliveryAddress,
    setDeliveryAddress,
    deliveryNotes,
    setDeliveryNotes,
    customerInfo,
    setCustomerInfo
  } = useCart();

  const handleProceed = () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Veuillez renseigner votre nom et téléphone');
      return;
    }
    
    if (fulfillmentType === 'LIVRAISON' && !deliveryAddress) {
      toast.error('Veuillez renseigner votre adresse de livraison');
      return;
    }
    
    navigate('/paiement');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background noise-bg">
        <Navbar />
        <div className="pt-20 md:pt-28 pb-28 px-4 md:px-8 flex flex-col items-center justify-center min-h-[60vh]">
          <ShoppingBag className="w-24 h-24 text-muted-foreground/30 mb-6" />
          <h1 className="text-2xl font-serif mb-4" data-testid="empty-cart-title">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-8">Découvrez notre menu et commencez votre commande</p>
          <Link to="/menu">
            <Button className="rounded-full btn-glow" data-testid="go-to-menu">
              Voir le menu
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <div className="pt-20 md:pt-28 pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-8" data-testid="cart-title">
            Votre Panier
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <Card key={index} className="p-4" data-testid={`cart-item-${index}`}>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.image_url || 'https://images.unsplash.com/photo-1634737119182-4d09e1305ba7?w=200&q=80'}
                        alt={item.product.nom}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.nom}</h3>
                      <p className="text-primary font-mono font-bold">
                        {item.product.prix.toFixed(2)} €
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`remove-item-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-2 bg-secondary rounded-full">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          data-testid={`decrease-${index}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-mono">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          data-testid={`increase-${index}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Mode de réception
                  </h3>
                  <RadioGroup
                    value={fulfillmentType}
                    onValueChange={setFulfillmentType}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="LIVRAISON" id="livraison" data-testid="radio-livraison" />
                      <Label htmlFor="livraison">Livraison</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A_EMPORTER" id="emporter" data-testid="radio-emporter" />
                      <Label htmlFor="emporter">À emporter</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Vos coordonnées</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                        placeholder="Votre nom"
                        className="mt-1"
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        placeholder="06 XX XX XX XX"
                        className="mt-1"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="votre@email.fr"
                      className="mt-1"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                {fulfillmentType === 'LIVRAISON' && (
                  <div>
                    <Label htmlFor="address">Adresse de livraison *</Label>
                    <Textarea
                      id="address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Numéro, rue, code postal, ville"
                      className="mt-1"
                      data-testid="input-address"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes pour la cuisine
                  </Label>
                  <Textarea
                    id="notes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Allergies, préférences, instructions spéciales..."
                    className="mt-1"
                    data-testid="input-notes"
                  />
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-28">
                <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>
                
                <div className="space-y-3 mb-6">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.product.nom}
                      </span>
                      <span className="font-mono">
                        {(item.product.prix * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary font-mono" data-testid="cart-total">
                      {total.toFixed(2)} €
                    </span>
                  </div>
                </div>
                
                <Button
                  className="w-full rounded-full btn-glow"
                  size="lg"
                  onClick={handleProceed}
                  data-testid="proceed-to-checkout"
                >
                  Procéder au paiement
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer showPrivacyPolicy={false} />
    </div>
  );
}
