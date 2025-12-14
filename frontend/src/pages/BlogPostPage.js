import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { Calendar, User, ArrowLeft, ArrowRight, Share2, Facebook, Twitter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Navbar from '../components/Navbar';
import ReactMarkdown from 'react-markdown';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ODELICES_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/y8c8rbve_oDelices%20LOGO.png";
const HALAL_LOGO = "https://customer-assets.emergentagent.com/job_09defda6-ae44-405e-ae59-cb2fa63eebe7/artifacts/uegijlrg_halal%20white.png";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
    fetchRelatedPosts();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`${API}/blog/posts/${slug}`);
      setPost(res.data);
      setError(null);
    } catch (err) {
      setError('Article non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const res = await axios.get(`${API}/blog/posts`);
      setRelatedPosts(res.data.filter(p => p.slug !== slug).slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post?.title)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Lien copié !');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <h1 className="text-3xl font-bold text-white mb-4">Article non trouvé</h1>
          <p className="text-white/60 mb-8">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
          <Link to="/blog">
            <Button className="bg-primary hover:bg-primary/90 text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // JSON-LD Schema for Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description,
    "image": post.image_url,
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "name": post.author
    },
    "publisher": {
      "@type": "Restaurant",
      "name": "O'Delices",
      "logo": {
        "@type": "ImageObject",
        "url": ODELICES_LOGO
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${window.location.origin}/blog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": window.location.href
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Helmet>
        <title>{post.title} - O'Delices Blog</title>
        <meta name="description" content={post.meta_description} />
        <meta name="keywords" content={post.meta_keywords?.join(', ')} />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.meta_description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={post.image_url} />
        <meta property="og:locale" content="fr_FR" />
        <meta property="article:published_time" content={post.created_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:author" content={post.author} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.meta_description} />
        <meta name="twitter:image" content={post.image_url} />
        
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <Navbar />

      {/* Breadcrumb */}
      <nav className="bg-[#222222] py-3 px-4">
        <div className="max-w-4xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-white/60">
            <li><Link to="/" className="hover:text-primary">Accueil</Link></li>
            <li>/</li>
            <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
            <li>/</li>
            <li className="text-white truncate max-w-[200px]">{post.title}</li>
          </ol>
        </div>
      </nav>

      {/* Article Header */}
      <header className="relative">
        <div className="h-64 md:h-96 overflow-hidden">
          <img
            src={post.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-black/50 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 text-sm text-white/70 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Share Buttons */}
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/10">
            <span className="text-white/60 text-sm">Partager :</span>
            <button 
              onClick={shareOnFacebook}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
              aria-label="Partager sur Facebook"
            >
              <Facebook className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={shareOnTwitter}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center transition-colors"
              aria-label="Partager sur Twitter"
            >
              <Twitter className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={copyLink}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Copier le lien"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-invert max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-primary
            prose-p:text-white/80 prose-p:leading-relaxed prose-p:mb-4
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:text-white/80 prose-li:mb-2
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Keywords/Tags */}
          {post.meta_keywords && post.meta_keywords.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/10">
              <h3 className="text-white font-semibold mb-4">Mots-clés :</h3>
              <div className="flex flex-wrap gap-2">
                {post.meta_keywords.map((keyword, i) => (
                  <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/70">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-2xl text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Envie de goûter ?</h3>
            <p className="text-white/70 mb-6">Commandez en ligne et faites-vous livrer à Épernon et environs</p>
            <Link to="/menu">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-8">
                COMMANDER MAINTENANT
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-4 bg-[#222222]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">PLUS D'ARTICLES</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map(relatedPost => (
                <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                  <Card className="bg-[#2a2a2a] border-0 overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all h-full">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={relatedPost.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400'}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-white/50 text-xs mb-2">{formatDate(relatedPost.created_at)}</p>
                      <h3 className="text-white font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-white/60 text-sm mt-2 line-clamp-2">{relatedPost.excerpt}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link to="/blog">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-black">
                  VOIR TOUS LES ARTICLES
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
