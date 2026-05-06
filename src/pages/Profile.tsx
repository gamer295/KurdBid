import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, Phone, TextQuote, Save, CheckCircle2, ShieldAlert, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { useLanguage } from '../context/LanguageContext';

const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    phone: '',
    photoURL: ''
  });
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        photoURL: profile.photoURL || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Unique Name Check
      if (formData.displayName !== profile.displayName) {
        const q = query(collection(db, 'users'), where('displayName', '==', formData.displayName));
        const snapshots = await getDocs(q);
        if (!snapshots.empty) {
          setError(t('nameTaken'));
          setLoading(false);
          return;
        }
      }

      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || (t('ku') === 'ku' ? 'هەڵەیەک ڕوویدا' : 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('ku') === 'ku' ? 'تەنها وێنە ڕێگەپێدراوە' : 'Only images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t('ku') === 'ku' ? 'وێنەکە بێجگە لە ٢ مێگابایت بێت' : 'Image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, photoURL: reader.result as string });
      setIsEditingPhoto(true);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleProfileClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileChange(file);
    };
    input.click();
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-dark tracking-tight">{t('customizeProfile')}</h1>
        <p className="text-text-light mt-2">{t('managePublicInfo')}</p>
      </div>

      <div className="card-polish p-8 bg-white mt-12 mb-8 border-l-4 border-orange-500 bg-orange-50/50">
        <div className="flex gap-4">
          <div className="shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-orange-900 uppercase tracking-widest mb-1">
              {t('privacyNoticeTitle')}
            </h3>
            <p className="text-xs text-orange-800 leading-relaxed font-medium">
              {t('privacyNoticeContent')}
            </p>
          </div>
        </div>
      </div>

      <div className="card-polish p-8 bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border-polish relative">
            <div 
              className={cn(
                "relative group cursor-pointer transition-all duration-300",
                isDragging && "scale-110"
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={handleProfileClick}
            >
              <div className={cn(
                "w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl font-bold overflow-hidden shadow-inner transition-all",
                isDragging 
                  ? "bg-primary/20 border-primary border-dashed" 
                  : "bg-[#ebecf0] border-border-polish"
              )}>
                {(formData.photoURL && formData.photoURL.length > 0) ? (
                  <img src={formData.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  isDragging ? <Upload className="w-8 h-8 text-primary animate-bounce" /> : profile.displayName?.charAt(0)
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white transition-opacity font-bold uppercase tracking-tighter">
                  <Upload className="w-4 h-4 mb-0.5" />
                  {t('uploadPhoto')}
                </div>
              </div>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingPhoto(!isEditingPhoto);
                }}
                className="absolute -bottom-1 -right-1 bg-primary text-black p-1.5 rounded-full shadow-lg border border-white hover:scale-110 transition-transform z-20"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-text-dark">{profile.displayName}</h2>
                {profile.isAdmin && (
                  <span className="bg-admin-bg text-admin-text px-2 py-0.5 rounded-[4px] border border-admin-border text-[10px] font-bold uppercase">
                    {t('admin')}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-light">{profile.email}</p>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center">
                  <p className="text-xs font-black text-text-dark">{profile.followersCount || 0}</p>
                  <p className="text-[10px] font-bold text-text-light uppercase tracking-tighter">{t('followers')}</p>
                </div>
                <div className="w-px h-6 bg-border-polish" />
                <div className="text-center">
                  <p className="text-xs font-black text-text-dark">{profile.followingCount || 0}</p>
                  <p className="text-[10px] font-bold text-text-light uppercase tracking-tighter">{t('following')}</p>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isEditingPhoto && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 z-10 mt-2 p-4 bg-white border border-border-polish shadow-xl rounded-xl space-y-3"
                >
                  <label className="text-[10px] font-black text-text-light uppercase tracking-widest block">{t('changePhoto')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={formData.photoURL}
                      onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      placeholder={t('photoUrlPlaceholder')}
                      className="flex-1 p-2 text-xs border border-border-polish rounded bg-gray-50 outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button 
                      type="button"
                      onClick={() => setIsEditingPhoto(false)}
                      className="bg-primary text-black px-3 py-1 text-xs font-bold rounded"
                    >
                      {t('close')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" /> {t('displayName')}
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full p-3 bg-[#fafbfc] border border-border-polish rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder={t('displayName')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-2">
                <TextQuote className="w-3 h-3" /> {t('bio')}
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-3 bg-[#fafbfc] border border-border-polish rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all h-32 resize-none"
                placeholder={t('bio')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> {t('location')}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-3 bg-[#fafbfc] border border-border-polish rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="Erbil, Kurdistan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {t('phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 bg-[#fafbfc] border border-border-polish rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="+964..."
                />
                {formData.phone && (
                  <p className="text-[10px] text-orange-600 font-medium bg-orange-50 p-2 rounded border border-orange-100 mt-1">
                    {t('phoneWarning')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-red-50 text-danger border border-danger/20 rounded-md text-xs font-medium"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> {t('ku') === 'ku' ? 'بە سەرکەوتوویی نوێکرایەوە' : 'Profile updated successfully!'}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 flex ltr:justify-end rtl:justify-start">
            <button
              type="submit"
              disabled={loading}
              className="btn-polish btn-polish-primary py-3 px-8 flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? (t('ku') === 'ku' ? 'چاوەڕێبە...' : 'Saving...') : t('saveProfile')}
            </button>
          </div>
        </form>
      </div>

      {/* More Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="card-polish p-6 bg-white space-y-4">
          <h3 className="text-sm font-bold text-text-dark uppercase tracking-wider">{t('preferences')}</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-text-light group-hover:text-text-dark transition-colors">{t('emailNotifications')}</span>
              <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-text-light group-hover:text-text-dark transition-colors">{t('safetyAlerts')}</span>
              <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-text-light group-hover:text-text-dark transition-colors">{t('publicProfile')}</span>
              <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
            </label>
          </div>
        </div>

        <div className="card-polish p-6 bg-white space-y-4">
          <h3 className="text-sm font-bold text-text-dark uppercase tracking-wider">{t('accountSecurity')}</h3>
          <p className="text-xs text-text-light leading-relaxed">{t('ku') === 'ku' ? 'هەژمارەکەت پارێزراوە لە ڕێگەی گووگڵەوە.' : 'Your account is secured via Google Authentication.'}</p>
        </div>
      </div>

    </div>
  );
};

export default Profile;
