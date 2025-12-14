import { MapPin, Phone, Clock, Mail } from 'lucide-react';
import { Card } from '../components/ui/card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <div className="pt-20 md:pt-28 pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif mb-8" data-testid="contact-title">
            Contact
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Adresse</h3>
                  <p className="text-muted-foreground">
                    3 Rue à la Paille<br />
                    28230 Épernon, France
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Téléphone</h3>
                  <p className="text-muted-foreground">
                    02 37 83 XX XX
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-muted-foreground">
                    contact@odelices.fr
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Horaires</h3>
                  <p className="text-muted-foreground">
                    Ouvert 6 jours sur 7<br />
                    11h30 - 14h30<br />
                    18h00 - 22h30
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Nous trouver</h3>
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                <iframe
                  title="Localisation O'Delices"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2626.839!2d1.6621!3d48.6081!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDjCsDM2JzI5LjIiTiAxwrAzOSc0My42IkU!5e0!3m2!1sfr!2sfr!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Card>
          </div>

          <Card className="p-6 mt-8">
            <h3 className="font-semibold mb-4">Mentions légales</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Raison sociale:</strong> O'Delices SARL
              </p>
              <p>
                <strong>SIRET:</strong> XXX XXX XXX XXXXX
              </p>
              <p>
                <strong>TVA Intracommunautaire:</strong> FR XX XXXXXXXXX
              </p>
              <p className="pt-4">
                Conformément au RGPD, vous pouvez exercer vos droits d'accès, de rectification et de suppression 
                de vos données personnelles en nous contactant par email.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
