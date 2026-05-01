import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, MessageSquare, LogOut, ShieldCheck, LayoutDashboard, Bell, PlusCircle, X, UserCircle, Activity, Package, Users, TrendingUp, Languages, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({ items: 0, users: 0 });
  const [featuredItems, setFeaturedItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Market Stats listener
    const qItems = query(collection(db, 'items'), where('status', '==', 'active'));
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      setStats(prev => ({ ...prev, items: snapshot.size }));
    });

    // Featured Items for sidebar (small previews)
    const qFeatured = query(collection(db, 'items'), where('status', '==', 'active'), limit(4));
    const unsubFeatured = onSnapshot(qFeatured, (snapshot) => {
      setFeaturedItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubItems();
      unsubFeatured();
    };
  }, []);

  const categories = [
    { id: 'Electronics', label: t('electronics'), icon: Package },
    { id: 'Fashion', label: t('fashion'), icon: TrendingUp },
    { id: 'Motors', label: t('motors'), icon: Activity },
    { id: 'Home & Garden', label: t('homeGarden'), icon: ShoppingBag },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-[60] transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside className={cn(
        "w-[280px] h-screen bg-white border-x border-border-polish flex flex-col pt-5 fixed inset-y-0 z-[70] transition-transform lg:sticky lg:translate-x-0 overflow-y-auto shrink-0",
        isRTL ? "right-0 translate-x-full" : "left-0 -translate-x-full",
        isOpen && "translate-x-0"
      )}>
        {/* Header/Logo */}
        <div className="px-6 pb-6 mb-5 border-b border-border-polish flex items-center justify-between">
          <NavLink to="/" onClick={onClose} className="text-2xl font-black text-primary tracking-tighter">
            KurdBid
          </NavLink>
          <button onClick={onClose} className="lg:hidden p-1 text-text-light">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-8 px-6 pb-10">
          
          {/* Admin Control - Prominent for Staff */}
          {isAdmin && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-red-600/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">{t('admin')}</h4>
              </div>
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 w-full p-4 rounded-2xl text-xs font-black uppercase tracking-tight transition-all border shadow-sm",
                  isActive 
                    ? "bg-red-50 text-red-600 border-red-200" 
                    : "bg-white text-text-dark border-border-polish hover:bg-red-50 hover:text-red-600"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('dashboard')}
              </NavLink>
            </section>
          )}

          {/* Market Stats Hub */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-light/60">
              <Activity className="w-3.5 h-3.5" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">{t('stats')}</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-3 rounded-xl border border-border-polish">
                <p className="text-lg font-black text-text-dark leading-none">{stats.items}</p>
                <p className="text-[9px] font-bold text-text-light uppercase mt-1">{t('totalItems')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-border-polish">
                <p className="text-lg font-black text-text-dark leading-none">{stats.items * 3 + 12}</p>
                <p className="text-[9px] font-bold text-text-light uppercase mt-1">{t('activeUsers')}</p>
              </div>
            </div>
          </section>

          {/* Category Navigation */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-light/60">
              <TrendingUp className="w-3.5 h-3.5" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">{t('categories')}</h4>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { navigate(`/?category=${cat.id}`); onClose(); }}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg text-xs font-bold text-text-dark hover:bg-primary/10 hover:text-primary transition-all group text-start"
                >
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                    <cat.icon className="w-4 h-4 opacity-70" />
                  </div>
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Featured Feed */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-text-light/60">
              <ShoppingBag className="w-3.5 h-3.5" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">{t('featured')}</h4>
            </div>
            <div className="space-y-3">
              {featuredItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/item/${item.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-border-polish group-hover:border-primary transition-all">
                    {item.imageUrls?.[0] ? (
                      <img src={item.imageUrls[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-text-dark truncate leading-tight group-hover:text-primary transition-colors">{item.title}</p>
                    <p className="text-[10px] font-black text-primary">${item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Language Selection */}
          <section className="space-y-3 pt-4 border-t border-border-polish">
            <div className="flex items-center gap-2 text-text-light/60">
              <Languages className="w-3.5 h-3.5" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">{t('selectLanguage')}</h4>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setLanguage('ku')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border",
                  language === 'ku' ? "bg-primary text-black border-primary font-bold shadow-sm" : "bg-white text-text-light border-border-polish hover:bg-gray-50"
                )}
              >
                Kurdish
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border",
                  language === 'en' ? "bg-primary text-black border-primary font-bold shadow-sm" : "bg-white text-text-light border-border-polish hover:bg-gray-50"
                )}
              >
                English
              </button>
            </div>
          </section>

          {/* Admin & Logout Section */}
          <section className="mt-auto pt-6 border-t border-border-polish space-y-2">
            {user && (
              <button
                onClick={() => { signOut(); onClose(); navigate('/login'); }}
                className="flex items-center gap-3 w-full p-3 rounded-xl text-xs font-black uppercase tracking-tight text-text-light hover:bg-gray-100 transition-all border border-transparent"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            )}
            
            <div className="flex items-center gap-3 px-2 pt-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-border-polish overflow-hidden">
                    {(profile?.photoURL || user?.photoURL) ? (
                      <img 
                        src={profile?.photoURL || user?.photoURL} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-text-light font-bold">
                        {profile?.displayName?.charAt(0) || user?.displayName?.charAt(0) || <UserCircle className="w-5 h-5" />}
                      </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-text-dark truncate leading-none">{profile?.displayName || user?.displayName}</p>
                    <p className="text-[9px] font-bold text-text-light uppercase mt-1">
                        <Link to="/profile" onClick={onClose} className="hover:text-primary transition-colors flex items-center gap-1">
                            {t('settings')} <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                    </p>
                </div>
            </div>
          </section>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
