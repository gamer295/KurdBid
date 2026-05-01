import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, User, PlusSquare, ShoppingBag, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const BottomNav: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/messages', icon: MessageSquare, label: t('messages') },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: t('admin') }] : []),
    { to: '/my-sales', icon: PlusSquare, label: t('postItem') },
    { to: '/my-purchases', icon: ShoppingBag, label: t('myPurchases') },
    { to: '/profile', icon: User, label: t('settings') },
  ];

  return (
    <div 
      id="bottom-nav-container"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-3 pb-3 pointer-events-none"
    >
      <div className="max-w-md mx-auto w-full relative min-h-[64px] flex flex-col justify-end">
        <AnimatePresence mode="wait">
          {isVisible ? (
            <motion.div
              key="nav-body"
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ 
                type: 'spring', 
                damping: 28, 
                stiffness: 220,
                mass: 0.8
              }}
              className="pointer-events-auto"
            >
              <nav className="bg-white/95 backdrop-blur-xl border border-border-polish shadow-2xl rounded-2xl flex flex-col ring-1 ring-black/5 overflow-hidden">
                {/* Drag/Collapse Handle */}
                <button 
                  onClick={() => setIsVisible(false)}
                  className="w-full py-2 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  aria-label="Hide Navigation"
                >
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full group-hover:bg-primary/50 transition-colors" />
                </button>

                <div className="flex items-center justify-around h-16 px-2 pb-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => cn(
                        "flex flex-col items-center justify-center gap-1 transition-all duration-300 px-3 py-1.5 rounded-xl",
                        isActive 
                          ? "text-primary bg-primary/10 scale-105" 
                          : "text-text-light hover:text-primary hover:bg-gray-50 font-medium"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 transition-transform", item.to === '/my-sales' && "text-primary")} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </nav>
            </motion.div>
          ) : (
            <motion.div
              key="nav-toggle"
              initial={{ y: 20, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={cn(
                "pointer-events-auto absolute bottom-2",
                isRTL ? "left-2" : "right-2"
              )}
            >
              <button
                onClick={() => setIsVisible(true)}
                className="w-12 h-12 bg-white/95 backdrop-blur-md border border-border-polish shadow-xl rounded-full flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-90 border-b-2"
              >
                <ChevronUp className="w-6 h-6 animate-bounce-subtle" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BottomNav;
