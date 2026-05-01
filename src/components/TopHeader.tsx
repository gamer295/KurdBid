import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Menu, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface TopHeaderProps {
  onMenuClick: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ku' ? 'en' : 'ku');
  };

  return (
    <header className="h-[70px] bg-white border-b border-border-polish px-4 md:px-[30px] flex items-center gap-3 md:gap-5 shrink-0 z-10 sticky top-0">
      <button 
        onClick={onMenuClick}
        className="p-2 -mx-2 text-text-light lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 relative max-w-xl">
        <Search className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light opacity-50" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 rounded-md border border-border-polish bg-[#fafbfc] text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-bg-polish transition-colors text-xs font-bold text-text-dark border border-border-polish"
        >
          <Languages className="w-4 h-4" />
          <span className="uppercase">{language}</span>
        </button>

        {user ? (
          <div className="flex items-center gap-2 md:gap-3">
             {isAdmin && (
                <div className="hidden sm:block bg-admin-bg text-admin-text px-2 py-0.5 rounded-[4px] border border-admin-border text-[10px] font-bold uppercase">
                  {t('admin')}
                </div>
             )}
             <div className="text-right hidden xs:block">
                <p 
                  onClick={() => navigate('/profile')}
                  className="text-[12px] md:text-[13px] font-semibold text-text-dark line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                >
                  {profile?.displayName || user.displayName}
                </p>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] text-text-light hover:text-danger font-medium uppercase tracking-wider"
                >
                  {t('logout')}
                </button>
             </div>
             <div 
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-border-polish overflow-hidden border border-border-polish cursor-pointer hover:border-primary transition-colors"
             >
                {(user.photoURL && user.photoURL.length > 0) ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-light font-bold">
                    {user.displayName?.charAt(0)}
                  </div>
                )}
             </div>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="bg-primary text-black border-2 border-primary px-5 py-2 rounded-[4px] text-xs font-bold hover:bg-primary-hover"
          >
            {t('login')}
          </button>
        )}
      </div>
    </header>
  );
};

export default TopHeader;
