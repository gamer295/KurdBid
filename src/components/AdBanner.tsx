import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const AdBanner: React.FC = () => {
  const { isRTL } = useLanguage();
  const [ads, setAds] = useState<any[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Check if ads are enabled globally
    const unsubConfig = onSnapshot(doc(db, 'appConfig', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setAdsEnabled(snapshot.data().adsEnabled !== false);
      }
    });

    const q = query(collection(db, 'ads'), where('active', '==', true));
    const unsubAds = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(data);
    });

    return () => {
      unsubConfig();
      unsubAds();
    };
  }, []);

  // Auto-rotate ads
  useEffect(() => {
    if (ads.length <= 1) return;
    
    // If it's a video, we'll transition on 'onEnded'
    // But we still have a fallback timer just in case (e.g. video fails to load/end)
    const currentAd = ads[currentIndex];
    const isVideo = currentAd?.mediaType === 'video' || currentAd?.videoUrl;
    const duration = (currentAd?.videoDuration ? currentAd.videoDuration * 1000 : 5000);
    
    if (isVideo) {
      // For videos, use custom duration or larger fallback safety net
      const adSpecificDuration = currentAd?.videoDuration ? currentAd.videoDuration * 1000 : 60000;
      const timeout = setTimeout(() => {
        handleNext();
      }, adSpecificDuration);
      return () => clearTimeout(timeout);
    }

    const timer = setTimeout(() => {
      handleNext();
    }, duration);
    return () => clearTimeout(timer);
  }, [ads.length, currentIndex, ads]);

  if (!adsEnabled || ads.length === 0 || !ads[currentIndex]) return null;

  const currentAd = ads[currentIndex];
  const isCurrentlyVideo = currentAd?.mediaType === 'video' || currentAd?.videoUrl;

  const handleNext = () => {
    setAds(prev => {
      if (prev.length <= 1) return prev;
      setCurrentIndex((curr) => (curr + 1) % prev.length);
      return prev;
    });
  };

  const renderMedia = (ad: any) => {
    const isVideo = ad.mediaType === 'video' || ad.videoUrl;
    const mediaUrl = ad.videoUrl || ad.imageUrl;

    if (isVideo && mediaUrl) {
      return (
        <video 
          key={ad.id}
          src={mediaUrl} 
          autoPlay 
          muted
          playsInline
          controls={false}
          disablePictureInPicture
          onEnded={handleNext}
          className="w-full h-auto min-h-[160px] object-cover bg-black"
        />
      );
    }

    return (
      <img 
        src={mediaUrl || `https://picsum.photos/seed/${ad.id}/1200/400`} 
        alt="" 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${ad.id}/1200/400`;
        }}
      />
    );
  };

  const nextAd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    handleNext();
  };

  const prevAd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl border-2 border-primary transition-all duration-500 bg-black">
      <AnimatePresence mode="wait">
        <motion.a
          key={currentAd.id}
          href={currentAd.link}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="block relative w-full h-auto"
        >
          {renderMedia(currentAd)}
          
          {!isCurrentlyVideo && (
            <>
              <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                <div className="bg-primary text-black text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest flex items-center gap-1 shadow-sm">
                  <Megaphone className="w-3 h-3" />
                  {currentAd.mediaType === 'video' ? 'VIDEO AD' : 'OFFER'}
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4 md:p-8 pointer-events-none">
                <div className="text-white max-w-lg">
                  <h3 className="text-sm md:text-2xl font-black uppercase tracking-tight line-clamp-1">{currentAd.title}</h3>
                  <p className="text-[10px] md:text-sm font-semibold text-gray-300 line-clamp-1 opacity-90">{currentAd.description}</p>
                </div>
              </div>
            </>
          )}
          
          <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-white/50">{currentIndex + 1} / {ads.length}</span>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg backdrop-blur-sm border border-white/10">
              <button onClick={prevAd} className="p-1 hover:bg-white/10 rounded transition-colors text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextAd} className="p-1 hover:bg-white/10 rounded transition-colors text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.a>
      </AnimatePresence>
    </div>
  );
};

export default AdBanner;
