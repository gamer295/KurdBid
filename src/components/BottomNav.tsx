import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, User, PlusSquare, ShoppingBag, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  isVisible: boolean;
  onToggle: (show: boolean) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ isVisible, onToggle }) => {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: t('homeShort') },
    { to: '/messages', icon: MessageSquare, label: t('messagesShort') },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: t('adminShort') }] : []),
    { to: '/my-sales', icon: PlusSquare, label: t('postShort') },
    { to: '/my-purchases', icon: ShoppingBag, label: t('purchasesShort') },
    { to: '/profile', icon: User, label: t('settingsShort') },
  ];

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-none p-4 flex justify-center">
        <AnimatePresence>
          {!isVisible && (
            <motion.button
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={() => onToggle(true)}
              className="bg-white/95 backdrop-blur-xl border border-border-polish shadow-2xl rounded-full p-2 text-primary ring-1 ring-black/5 pointer-events-auto"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-2 pb-2 pt-4 bg-gradient-to-t from-bg-polish via-bg-polish/80 to-transparent pointer-events-none"
          >
            <nav className="bg-white/95 backdrop-blur-xl border border-border-polish shadow-2xl rounded-2xl flex items-center justify-between h-16 px-1 ring-1 ring-black/5 pointer-events-auto relative">
              <button 
                onClick={() => onToggle(false)}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-border-polish rounded-full p-0.5 text-text-light hover:text-primary shadow-sm"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center gap-0.5 transition-all duration-300 flex-1 min-w-0 rounded-xl py-1",
                    isActive 
                      ? "text-primary bg-primary/5" 
                      : "text-text-light hover:text-primary hover:bg-gray-50/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", item.to === '/my-sales' && "text-primary")} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center px-0.5">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
