import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

import { useLanguage } from '../context/LanguageContext';

const Login: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-sm border border-border-polish text-center space-y-8"
      >
        <div className="space-y-2">
          <div className="w-16 h-16 bg-bg-polish text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-polish">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-text-dark tracking-tight">
            {t('welcome')}
          </h1>
          <p className="text-text-light text-sm">
            {t('loginDesc')}
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white border border-border-polish py-4 rounded-xl font-bold hover:bg-bg-polish transition shadow-sm text-sm uppercase tracking-wider group"
        >
          <img src="https://lh3.googleusercontent.com/COxitUu9qwDXp6Y-90qS8S953Y99-9m8Y653XpNoat6u1N_1t1n7_59yhOOKv2-9rR4" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-all" />
          {t('signInGoogle')}
        </button>

        <p className="text-[10px] text-text-light mt-8">
          {t('termsAgreement')}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
