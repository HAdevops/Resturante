import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, User, LogOut, LayoutDashboard, BookOpen, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/blog', icon: BookOpen, label: 'Blog' },
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
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#1a1a1a] to-[#1a1a1a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto w-full px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/y8c8rbve_oDelices%20LOGO.png" 
              alt="O'Delices Logo" 
              className="h-14 w-auto transition-transform group-hover:scale-105"
            />
          </Link>
          
          {/* Center Navigation */}
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1.5 border border-white/10">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`
                    relative flex items-center gap-2.5 px-5 py-2.5 rounded-full font-medium text-sm
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse" style={{animationDuration: '2s'}}></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Phone Number */}
            <a 
              href="tel:0219023094" 
              className="hidden lg:flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors text-sm"
            >
              <Phone className="w-4 h-4" />
              <span>02 19 02 30 94</span>
            </a>

            {/* Cart Button */}
            <Link to="/panier" data-testid="nav-panier">
              <Button 
                className={`
                  relative rounded-full px-5 py-2.5 font-semibold transition-all duration-300
                  ${itemCount > 0 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105' 
                    : 'bg-white/10 hover:bg-white/20 text-gray-300 border border-white/10'
                  }
                `}
              >
                <ShoppingBag className="w-4.5 h-4.5 mr-2" />
                Panier
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce shadow-lg">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {/* Dashboard Link */}
            {dashboardPath && (
              <Link to={dashboardPath} data-testid="nav-dashboard">
                <Button 
                  variant="ghost" 
                  className="rounded-full px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all duration-300"
                >
                  <LayoutDashboard className="w-4.5 h-4.5 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            
            {/* User Actions */}
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.nom?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 max-w-[100px] truncate">{user.nom}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  data-testid="nav-logout"
                  className="rounded-full w-9 h-9 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                  title="Déconnexion"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </Button>
              </div>
            ) : (
              <Link to="/connexion" data-testid="nav-connexion">
                <Button 
                  className="rounded-full px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 transition-all duration-300 font-medium"
                >
                  <User className="w-4.5 h-4.5 mr-2" />
                  Connexion
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a]/98 backdrop-blur-lg border-t border-white/10 px-2 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 relative
                  ${isActive 
                    ? 'text-amber-400' 
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-lg shadow-amber-500/10' 
                    : ''
                  }
                `}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : ''}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-amber-400' : ''}`}>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400"></span>
                )}
              </Link>
            );
          })}
          
          {/* Cart Mobile */}
          <Link
            to="/panier"
            data-testid="mobile-nav-panier"
            className={`
              flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 relative
              ${location.pathname === '/panier' 
                ? 'text-amber-400' 
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            <div className={`
              p-2 rounded-xl transition-all duration-300 relative
              ${location.pathname === '/panier' 
                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' 
                : ''
              }
            `}>
              <ShoppingBag className={`w-5 h-5 ${location.pathname === '/panier' ? 'text-amber-400' : ''}`} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                  {itemCount}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium ${location.pathname === '/panier' ? 'text-amber-400' : ''}`}>Panier</span>
          </Link>
          
          {/* Profile/Login Mobile */}
          {user ? (
            <Link
              to={dashboardPath || '/'}
              data-testid="mobile-nav-profile"
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-300 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-amber-500/20">
                {user.nom?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium">Profil</span>
            </Link>
          ) : (
            <Link
              to="/connexion"
              data-testid="mobile-nav-connexion"
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-300 transition-all duration-300"
            >
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Connexion</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
