import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

// Categories that should skip the upsell popup
const UPSELL_SKIP_CATEGORIES = ['Boissons', 'Snacks', 'Desserts'];

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [fulfillmentType, setFulfillmentType] = useState('LIVRAISON');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryNote, setDeliveryNote] = useState(''); // Note for driver (digicode, floor, etc.)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [deliverySlot, setDeliverySlot] = useState(null);
  const [showUpsellPopup, setShowUpsellPopup] = useState(false);
  const [upsellShownThisSession, setUpsellShownThisSession] = useState(() => {
    return sessionStorage.getItem('upsell_shown') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1, options = null, categoryName = null) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && JSON.stringify(item.options) === JSON.stringify(options)
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, options, categoryName }];
    });
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    setItems(prev => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setDeliveryAddress('');
    setDeliveryNotes('');
    setDeliveryNote('');
    setDeliverySlot(null);
  };

  // Check if cart already contains upsell category items
  const hasUpsellCategoryItems = () => {
    return items.some(item => 
      UPSELL_SKIP_CATEGORIES.includes(item.categoryName)
    );
  };

  // Trigger upsell popup if conditions are met
  const triggerUpsellPopup = () => {
    // Skip if already shown this session
    if (upsellShownThisSession) return;
    
    // Skip if cart has upsell category items
    if (hasUpsellCategoryItems()) return;
    
    setShowUpsellPopup(true);
    setUpsellShownThisSession(true);
    sessionStorage.setItem('upsell_shown', 'true');
  };

  const closeUpsellPopup = () => {
    setShowUpsellPopup(false);
  };

  const total = items.reduce((sum, item) => sum + item.product.prix * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      fulfillmentType,
      setFulfillmentType,
      deliveryAddress,
      setDeliveryAddress,
      deliveryNotes,
      setDeliveryNotes,
      customerInfo,
      setCustomerInfo,
      deliverySlot,
      setDeliverySlot,
      showUpsellPopup,
      triggerUpsellPopup,
      closeUpsellPopup,
      hasUpsellCategoryItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
