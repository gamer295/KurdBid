import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, User, PlusSquare, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const BottomNav: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/messages', icon: MessageSquare, label: t('messages') },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: t('admin') }] : []),
    { to: '/my-sales', icon: PlusSquare, label: t('postItem') },
    { to: '/my-purchases', icon: ShoppingBag, label: t('myPurchases') },
    { to: '/profile', icon: User, label: t('settings') },
  ];

  return (
    <div className="lg:hidden fixed bottom-1 left-0 right-0 z-[100] px-3 pb-2">
      <nav className="bg-white/90 backdrop-blur-xl border border-border-polish shadow-2xl rounded-2xl flex items-center justify-around h-16 p-2 ring-1 ring-black/5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 transition-all duration-300 px-3 py-1.5 rounded-xl",
              isActive 
                ? "text-primary bg-primary/10 scale-110" 
                : "text-text-light hover:text-primary hover:bg-gray-50"
            )}
          >
            <item.icon className={cn("w-5 h-5", item.to === '/my-sales' && "text-primary")} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default BottomNav;
