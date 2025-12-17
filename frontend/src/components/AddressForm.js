import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Common postal codes around Épernon with their associated towns
const POSTAL_CODE_DATA = {
  '28230': [
    { name: 'Épernon', isDefault: true },
  ],
  '28130': [
    { name: 'Hanches', isDefault: true },
    { name: 'Maintenon' },
    { name: 'Pierres' },
    { name: 'Villiers-le-Morhier' },
  ],
  '28500': [
    { name: 'Vernouillet', isDefault: true },
    { name: 'Luray' },
    { name: 'Sainte-Gemme-Moronval' },
    { name: 'Tréon' },
  ],
  '28300': [
    { name: 'Mainvilliers', isDefault: true },
    { name: 'Champhol' },
    { name: 'Gasville-Oisème' },
    { name: 'Lèves' },
    { name: 'Saint-Prest' },
  ],
  '28000': [
    { name: 'Chartres', isDefault: true },
  ],
  '28260': [
    { name: 'Anet', isDefault: true },
    { name: 'Rouvres' },
    { name: 'Saussay' },
  ],
  '28120': [
    { name: 'Illiers-Combray', isDefault: true },
  ],
  '28190': [
    { name: 'Courville-sur-Eure', isDefault: true },
    { name: 'Pontgouin' },
  ],
  '28210': [
    { name: 'Nogent-le-Roi', isDefault: true },
    { name: 'Coulombs' },
    { name: 'Lormaye' },
    { name: 'Villemeux-sur-Eure' },
  ],
  '28240': [
    { name: 'La Loupe', isDefault: true },
  ],
  '28170': [
    { name: 'Saint-Sauveur-Marville', isDefault: true },
    { name: 'Châteauneuf-en-Thymerais' },
  ],
  '28220': [
    { name: 'Cloyes-les-Trois-Rivières', isDefault: true },
  ],
  '28160': [
    { name: 'Brou', isDefault: true },
  ],
  '28150': [
    { name: 'Voves', isDefault: true },
  ],
  '28250': [
    { name: 'Senonches', isDefault: true },
  ],
  '28200': [
    { name: 'Châteaudun', isDefault: true },
  ],
  '28100': [
    { name: 'Dreux', isDefault: true },
  ],
  '28410': [
    { name: 'Bû', isDefault: true },
    { name: 'Abondant' },
  ],
  '28270': [
    { name: 'Brezolles', isDefault: true },
  ],
  '28310': [
    { name: 'Janville-en-Beauce', isDefault: true },
  ],
  '28700': [
    { name: 'Auneau-Bleury-Saint-Symphorien', isDefault: true },
  ],
  '28350': [
    { name: 'Saint-Lubin-des-Joncherets', isDefault: true },
  ],
  '28800': [
    { name: 'Bonneval', isDefault: true },
  ],
  '78125': [
    { name: 'Gazeran', isDefault: true },
  ],
  '78120': [
    { name: 'Rambouillet', isDefault: true },
  ],
  '78490': [
    { name: 'Montfort-l\'Amaury', isDefault: true },
  ],
  '78320': [
    { name: 'La Verrière', isDefault: true },
    { name: 'Le Mesnil-Saint-Denis' },
  ],
};

// Zone de livraison autour d'Épernon
const DELIVERY_ZONES = [
  '28230', '28130', '28210', '28300', '28500', '78125', '78120',
];

export default function AddressForm({ address, onChange }) {
  const [street, setStreet] = useState(address?.street || '');
  const [postalCode, setPostalCode] = useState(address?.postalCode || '');
  const [city, setCity] = useState(address?.city || '');
  const [availableCities, setAvailableCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInDeliveryZone, setIsInDeliveryZone] = useState(true);

  useEffect(() => {
    // Update parent when address changes
    if (street || postalCode || city) {
      const fullAddress = [street, postalCode, city, 'France'].filter(Boolean).join(', ');
      onChange(fullAddress);
    }
  }, [street, postalCode, city]);

  const handlePostalCodeChange = (value) => {
    // Only allow numbers and limit to 5 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    setPostalCode(cleaned);

    if (cleaned.length === 5) {
      setLoading(true);
      
      // Check if we have local data
      const localData = POSTAL_CODE_DATA[cleaned];
      
      if (localData) {
        setAvailableCities(localData.map(c => c.name));
        const defaultCity = localData.find(c => c.isDefault)?.name || localData[0].name;
        setCity(defaultCity);
        setIsInDeliveryZone(DELIVERY_ZONES.includes(cleaned));
        setLoading(false);
      } else {
        // Try to fetch from API geo.api.gouv.fr
        fetchCitiesFromAPI(cleaned);
      }
    } else {
      setAvailableCities([]);
      setCity('');
      setIsInDeliveryZone(true);
    }
  };

  const fetchCitiesFromAPI = async (code) => {
    try {
      const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${code}&fields=nom&format=json`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const cities = data.map(c => c.nom);
          setAvailableCities(cities);
          setCity(cities[0]);
          setIsInDeliveryZone(DELIVERY_ZONES.includes(code));
        } else {
          setAvailableCities([]);
          setCity('');
        }
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      setAvailableCities([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-primary" />
        <span className="font-semibold">Adresse de livraison</span>
      </div>

      {/* Street Address */}
      <div>
        <Label htmlFor="street">Numéro et rue *</Label>
        <Input
          id="street"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Ex: 15 Rue de la Paix"
          className="mt-1"
          data-testid="input-street"
        />
      </div>

      {/* Postal Code and City Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Code postal *</Label>
          <div className="relative mt-1">
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              placeholder="28230"
              maxLength={5}
              className="font-mono"
              data-testid="input-postal-code"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="city">Ville *</Label>
          {availableCities.length > 1 ? (
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="mt-1" data-testid="select-city">
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
              className="mt-1"
              data-testid="input-city"
            />
          )}
        </div>
      </div>

      {/* Country (Fixed) */}
      <div>
        <Label htmlFor="country">Pays</Label>
        <Input
          id="country"
          value="France"
          disabled
          className="mt-1 bg-muted cursor-not-allowed"
          data-testid="input-country"
        />
      </div>

      {/* Delivery Zone Warning */}
      {postalCode.length === 5 && !isInDeliveryZone && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-sm text-orange-400">
            ⚠️ Cette zone est en dehors de notre périmètre de livraison habituel. 
            Des frais supplémentaires peuvent s'appliquer. Contactez-nous au 02 19 02 30 94.
          </p>
        </div>
      )}

      {/* Delivery Zone Info */}
      <div className="text-xs text-muted-foreground">
        <p>🚚 Livraison gratuite à Épernon et communes environnantes</p>
      </div>
    </div>
  );
}
