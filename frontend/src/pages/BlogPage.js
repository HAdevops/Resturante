import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ODELICES_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/y8c8rbve_oDelices%20LOGO.png";
const HALAL_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/uegijlrg_halal%20white.png";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/blog/posts`);
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // JSON-LD Schema for Blog
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog O'Delices - Actualités et Recettes Halal",
    "description": "Découvrez nos articles sur la cuisine halal, nos recettes de tacos, burgers, pizzas et kebabs, et les actualités d'O'Delices Épernon.",
    "url": window.location.href,
    "publisher": {
      "@type": "Restaurant",
      "name": "O'Delices",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "3 Rue à la Paille",
        "addressLocality": "Épernon",
        "postalCode": "28230",
        "addressCountry": "FR"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Helmet>
        <title>Blog - O'Delices | Actualités Fast Food Halal Épernon</title>
        <meta name="description" content="Blog O'Delices : découvrez nos articles sur la cuisine halal, recettes de tacos, burgers, pizzas et kebabs. Actualités du fast food halal à Épernon 28230." />
        <meta name="keywords" content="blog halal épernon, recettes halal, tacos halal, burger halal, pizza halal, kebab halal, fast food 28230" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Blog O'Delices - Actualités Fast Food Halal Épernon" />
        <meta property="og:description" content="Découvrez nos articles sur la cuisine halal et les actualités d'O'Delices Épernon." />
        <meta property="og:type" content="blog" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={ODELICES_LOGO} />
        <meta property="og:locale" content="fr_FR" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog O'Delices - Actualités Fast Food Halal Épernon" />
        <meta name="twitter:description" content="Découvrez nos articles sur la cuisine halal et les actualités d'O'Delices." />
        <meta name="twitter:image" content={ODELICES_LOGO} />
        
        <script type="application/ld+json">
          {JSON.stringify(blogSchema)}
        </script>
      </Helmet>

      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Notre Blog
          </h1>
          <p className="text-lg text-white/70 mb-8">
            Découvrez nos articles, recettes et actualités sur la cuisine halal
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-white/50 mt-4">Chargement des articles...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/50 text-lg">Aucun article trouvé</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <article key={post.id}>
                  <Link to={`/blog/${post.slug}`}>
                    <Card className="bg-[#2a2a2a] border-0 overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600'}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading={index < 3 ? 'eager' : 'lazy'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      
                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-4 text-sm text-white/50 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author}
                          </span>
                        </div>
                        
                        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        
                        <p className="text-white/60 text-sm mb-4 line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                          LIRE L'ARTICLE
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-[#222222]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Envie de goûter nos spécialités ?
          </h2>
          <p className="text-white/70 mb-8">
            Commandez en ligne et faites-vous livrer à Épernon et environs
          </p>
          <Link 
            to="/menu"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-8 py-4 rounded-full transition-colors"
          >
            VOIR NOTRE MENU
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={ODELICES_LOGO} alt="O'Delices Logo" className="h-12 w-auto" />
          <p className="text-white/50 text-sm text-center">
            © {new Date().getFullYear()} O'Delices Épernon. Tous droits réservés.
          </p>
          <img src={HALAL_LOGO} alt="Certifié Halal" className="h-14 w-auto opacity-80" />
        </div>
      </footer>
    </div>
  );
}
