import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';

export default function Navbar() {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { itemCount } = useCart();

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/panier', icon: ShoppingBag, label: 'Panier', badge: itemCount },
  ];

  const getDashboardPath = () => {
    if (!user) return null;
    if (user.role === 'SUPER_ADMIN') return '/dashboard/admin';
    if (user.role === 'CUISINE') return '/dashboard/cuisine';
    if (user.role === 'CAISSE') return '/dashboard/caisse';
    if (user.role === 'LIVREUR') return '/dashboard/livreur';
    return null;
  };

  const dashboardPath = getDashboardPath();

  return (
    <>
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <span className="text-2xl font-bold text-primary font-serif">O'Delices</span>
          </Link>
          
          <div className="flex items-center gap-6">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            
            {dashboardPath && (
              <Link
                to={dashboardPath}
                data-testid="nav-dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{user.nom}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  data-testid="nav-logout"
                  className="rounded-full"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Link to="/connexion" data-testid="nav-connexion">
                <Button variant="outline" className="rounded-full">
                  <User className="w-5 h-5 mr-2" />
                  Connexion
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 px-4 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all relative ${
                location.pathname === item.path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          
          {user ? (
            <Link
              to={dashboardPath || '/'}
              data-testid="mobile-nav-profile"
              className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Profil</span>
            </Link>
          ) : (
            <Link
              to="/connexion"
              data-testid="mobile-nav-connexion"
              className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
            >
              <User className="w-6 h-6" />
              <span className="text-xs">Connexion</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
