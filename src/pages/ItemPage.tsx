import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatDate, cn } from '../lib/utils';
import { 
  MessageCircle, 
  User as UserIcon, 
  Calendar, 
  Tag, 
  ChevronLeft, 
  ShieldAlert, 
  Phone, 
  AlertTriangle,
  X,
  Gavel,
  Clock,
  TrendingUp,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReportModal from '../components/ReportModal';
import AdBanner from '../components/AdBanner';

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrls: string[];
  sellerId: string;
  sellerName: string;
  createdAt: any;
  category: string;
  status: 'active' | 'removed' | 'sold';
  isAuction?: boolean;
  startingPrice?: number;
  currentBid?: number;
  bidCount?: number;
  endsAt?: any;
  highestBidderId?: string;
  highestBidderName?: string;
}

import { useLanguage } from '../context/LanguageContext';

const ItemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [biddingLoading, setBiddingLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    // Use onSnapshot for real-time updates (critical for auctions)
    const unsubItem = onSnapshot(doc(db, 'items', id), async (docSnap) => {
      if (docSnap.exists()) {
        const itemData = { id: docSnap.id, ...docSnap.data() } as Item;
        setItem(itemData);
        
        // Fetch seller profile if not already fetched
        if (!sellerProfile) {
          const sellerSnap = await getDoc(doc(db, 'users', itemData.sellerId));
          if (sellerSnap.exists()) {
            setSellerProfile(sellerSnap.data());
          }
        }
      }
      setLoading(false);
    });

    return () => unsubItem();
  }, [id]);

  useEffect(() => {
    if (!item?.isAuction || !item?.endsAt) return;

    const timer = setInterval(() => {
      const endsAt = item.endsAt?.toDate?.() || new Date(item.endsAt);
      const now = new Date();
      const diff = endsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(t('auctionEnded'));
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [item?.isAuction, item?.endsAt, isRTL]);

  const handlePlaceBid = async () => {
    if (!user || !item) {
      navigate('/login');
      return;
    }

    const amount = parseFloat(bidAmount);
    const minBid = (item.currentBid || item.startingPrice || 0) + 1;

    if (isNaN(amount) || amount < minBid) {
      alert(isRTL ? t('higherBidRequired').replace('{n}', minBid.toLocaleString()) : `Minimum bid is ${minBid.toLocaleString()} IQD`);
      return;
    }

    setBiddingLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, 'items', item.id);
        const itemDoc = await transaction.get(itemRef);
        
        if (!itemDoc.exists()) throw t('errorOccurred');
        
        const data = itemDoc.data();
        const currentDataBid = data.currentBid || data.startingPrice || 0;

        if (amount <= currentDataBid) {
          throw t('bidTooLow');
        }

        if (data.endsAt?.toDate() < new Date()) {
          throw t('auctionEnded');
        }

        // 1. Create Bid Record
        const bidRef = doc(collection(db, 'bids'));
        transaction.set(bidRef, {
          itemId: item.id,
          bidderId: user.uid,
          bidderName: user.displayName || 'Bider',
          amount: amount,
          createdAt: serverTimestamp()
        });

        // 2. Update Item State
        transaction.update(itemRef, {
          currentBid: amount,
          bidCount: (data.bidCount || 0) + 1,
          highestBidderId: user.uid,
          highestBidderName: user.displayName || 'Bidder',
          updatedAt: serverTimestamp()
        });

        // 3. Notify Seller (and previous bidder in future maybe)
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          userId: item.sellerId,
          type: 'bid',
          content: isRTL 
            ? `گرەوی نوێ ی ${amount.toLocaleString()} د.ع بۆ ${item.title}` 
            : `New bid of ${amount.toLocaleString()} IQD for ${item.title}`,
          relatedId: item.id,
          createdAt: serverTimestamp(),
          read: false
        });
      });

      setBidAmount('');
      // Success will be handled by onSnapshot
    } catch (err: any) {
      console.error("Bidding error:", err);
      alert(typeof err === 'string' ? err : (isRTL ? "هەڵەیەک ڕوویدا لە کاتی گرەوکردن" : "Error placing bid. Please try again."));
    } finally {
      setBiddingLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!user || !item) {
      navigate('/login');
      return;
    }

    // Check if conversation already exists between these two for this item
    // Simplified query to avoid composite index requirements
    const convsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    try {
      const querySnapshot = await getDocs(convsQuery);
      let conversationId = '';

      // Find identifying conversation client-side
      const existingConv = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.itemId === item.id && data.participants.includes(item.sellerId);
      });

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const newConv = await addDoc(collection(db, 'conversations'), {
          participants: [user.uid, item.sellerId],
          itemTitle: item.title,
          itemId: item.id,
          updatedAt: serverTimestamp(),
          lastMessage: `Inquiry about ${item.title}`
        });
        conversationId = newConv.id;
        
        // Send initial notification to seller
        await addDoc(collection(db, 'notifications'), {
          userId: item.sellerId,
          type: 'message',
          content: isRTL 
            ? `داواکاری نوێ لە لایەن ${user.displayName} بۆ ${item.title}` 
            : `New inquiry from ${user.displayName} about ${item.title}`,
          relatedId: conversationId,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error initiating message:", error);
      alert(isRTL ? "هەڵەیەک ڕوویدا لە کاتی پەیوەندیکردن" : "Error starting conversation. Please try again.");
    }
  };

  const handleTakeDown = async () => {
    if (!item || !user) return;
    const isOwner = user.uid === item.sellerId;
    const canDelete = profile?.isAdmin || isOwner;
    
    if (!canDelete) return;

    if (confirm(t('ku') === 'ku' ? 'ئایا دڵنیای لە سڕینەوەی ئەم کاڵایە؟' : 'Are you sure you want to take down this listing?')) {
      try {
        await updateDoc(doc(db, 'items', item.id), { status: 'removed' });
        navigate('/');
      } catch (err) {
        console.error("Take down error:", err);
        alert(isRTL ? "هەڵەیەک ڕوویدا لە کاتی سڕینەوەدا. تکایە دواتر هەوڵ بدەرەوە." : "Error taking down item. Please try again.");
      }
    }
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item && zoomImageIndex !== null) {
      setZoomImageIndex((zoomImageIndex + 1) % item.imageUrls.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item && zoomImageIndex !== null) {
      setZoomImageIndex((zoomImageIndex - 1 + item.imageUrls.length) % item.imageUrls.length);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">{t('ku') === 'ku' ? 'چاوەڕێبە...' : 'Loading...'}</div>;
  if (!item) return <div className="text-center py-20">{t('noItemsFound')}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold uppercase text-xs"
      >
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        {t('backToItems')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white p-8 rounded-3xl shadow-sm border border-border-polish">
        {/* Images */}
        <div className="space-y-4">
          <div 
            onClick={() => setZoomImageIndex(0)}
            className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-border-polish shadow-inner translate-z-0 cursor-zoom-in group"
          >
            <img
              src={item.imageUrls?.[0] || `https://picsum.photos/seed/${item.id}/800/800`}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {item.imageUrls?.slice(1).map((url, i) => (
              <div 
                key={i} 
                onClick={() => setZoomImageIndex(i + 1)}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-border-polish cursor-zoom-in group"
              >
                <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col h-full space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest">
              <Tag className="w-4 h-4" />
              {typeof item.category === 'object' ? (item.category as any).label || (item.category as any).id : item.category}
            </div>
            <h1 className="text-4xl font-extrabold text-text-dark leading-[1.1]">{item.title}</h1>
            {item.isAuction ? (
               <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <Gavel className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-widest">{t('liveAuction')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold font-mono">{timeLeft}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-text-light font-bold uppercase tracking-widest">{t('currentBid')}</p>
                      <p className="text-3xl font-black text-text-dark">
                        {(item.currentBid || item.price).toLocaleString()} <span className="text-lg text-primary">{isRTL ? 'د.ع' : 'IQD'}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-text-light font-bold uppercase tracking-widest">{t('bidCount')}</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <p className="text-xl font-bold text-text-dark">{item.bidCount || 0}</p>
                      </div>
                    </div>
                  </div>

                  {item.highestBidderName && (
                    <div className="flex items-center gap-2 py-2 border-t border-primary/10">
                      <div className="p-1.5 bg-primary/10 rounded-full">
                        <History className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-[11px] font-bold text-text-light">
                        {t('highestBidder')}: <span className="text-primary">{item.highestBidderName}</span>
                      </p>
                    </div>
                  )}
               </div>
            ) : (
              <p className="text-3xl font-bold text-primary">
                {item.price.toLocaleString()} {isRTL ? 'د.ع' : 'IQD'}
              </p>
            )}
          </div>

          <div className="bg-bg-polish p-6 rounded-2xl space-y-4 border border-border-polish">
            <h3 className="text-xs font-bold text-text-light uppercase tracking-widest">
              {t('description')}
            </h3>
            <p className="text-text-dark leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {item.description}
            </p>
          </div>

          <div className="flex-1" />

          <AdBanner />

          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-border-polish flex items-center justify-center text-text-light font-bold">
                  {item.sellerName?.[0]}
                </div>
                <div>
                  <p className="font-bold text-text-dark">{item.sellerName}</p>
                  <p className="text-[11px] text-text-light flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t('postedOn')} {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {user?.uid === item.sellerId ? (
              <div className="space-y-4">
                <div className="bg-[#ebecf0] text-text-light p-4 rounded-md text-center text-sm font-bold uppercase tracking-widest">
                  {t('thisIsYourListing')}
                </div>
                {item.isAuction && (
                   <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-center text-xs font-bold border border-blue-100 uppercase tracking-widest">
                     {t('liveAuction')} {t('active')}
                   </div>
                )}
                <button
                  onClick={handleTakeDown}
                  className="btn-polish btn-polish-danger w-full py-4 uppercase tracking-wider font-bold text-sm"
                >
                  {t('deleteListing')}
                </button>
              </div>
            ) : item.status !== 'active' ? (
              <div className="bg-red-50 text-danger p-4 rounded-md text-center text-sm font-bold border border-danger/20 uppercase tracking-widest">
                {t('soldOrUnavailable')}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {item.isAuction && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-border-polish mb-2">
                    <div className="flex items-center justify-between px-1">
                       <span className="text-[10px] font-black text-text-light uppercase tracking-widest">{t('minimumBidValue')}</span>
                       <span className={cn(
                         "text-[10px] font-mono font-bold transition-colors",
                         (bidAmount !== '' && parseFloat(bidAmount) < (item.currentBid || item.startingPrice || 0) + 1) ? "text-danger animate-pulse" : "text-primary"
                       )}>
                         {((item.currentBid || item.price) + 1).toLocaleString()} {isRTL ? 'د.ع' : 'IQD'}
                       </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input 
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={t('enterBidAmount')}
                          className={cn(
                             "w-full p-4 bg-white border rounded-xl outline-none transition-all font-bold text-lg shadow-sm",
                             (bidAmount !== '' && parseFloat(bidAmount) < (item.currentBid || item.startingPrice || 0) + 1) 
                                ? "border-danger ring-2 ring-danger/10" 
                                : "border-border-polish focus:ring-2 focus:ring-primary"
                          )}
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 text-xs font-bold text-text-light pointer-events-none uppercase">{isRTL ? 'د.ع' : 'IQD'}</div>
                      </div>
                      <button 
                        onClick={handlePlaceBid}
                        disabled={biddingLoading || (bidAmount !== '' && parseFloat(bidAmount) < (item.currentBid || item.startingPrice || 0) + 1) || (item.endsAt && new Date(item.endsAt?.toDate?.() || item.endsAt) < new Date())}
                        className="bg-primary text-black px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary-hover transition-all disabled:opacity-50 active:scale-95 shadow-sm border-2 border-primary"
                      >
                        {biddingLoading ? (
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          t('placeBid')
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {!item.isAuction && (
                  <button
                    onClick={handleMessageSeller}
                    className="btn-polish btn-polish-primary w-full py-4 text-sm uppercase tracking-wider font-bold h-[56px]"
                  >
                    {t('contactSeller')}
                  </button>
                )}
                {sellerProfile?.phone && (
                  <a
                    href={`tel:${sellerProfile.phone}`}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-[4px] py-4 text-sm font-bold uppercase tracking-widest hover:bg-green-700 transition-colors h-[56px]"
                  >
                    <Phone className="w-4 h-4" />
                    {t('call')}
                  </a>
                )}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest pt-4"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('reportItem')}
                </button>
              </div>
            )}

            {profile?.isAdmin && user?.uid !== item.sellerId && (
              <div className="pt-2">
                <button
                  onClick={handleTakeDown}
                  className="btn-polish btn-polish-danger w-full py-3 uppercase tracking-wider font-bold text-xs"
                >
                  {t('deleteListing')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImageIndex(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          >
            <button 
              onClick={() => setZoomImageIndex(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[110]"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center">
              {item.imageUrls.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-4 text-white/30 hover:text-white transition-colors ltr:rotate-0 rtl:rotate-180"
                  >
                    <ChevronLeft className="w-12 h-12" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-white/30 hover:text-white transition-colors ltr:rotate-180 rtl:rotate-0"
                  >
                    <ChevronLeft className="w-12 h-12" />
                  </button>
                </>
              )}

              <motion.img
                key={zoomImageIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={item.imageUrls[zoomImageIndex]}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {item.imageUrls.map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      i === zoomImageIndex ? "bg-primary w-6" : "bg-white/20"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal 
        itemId={item.id} 
        itemTitle={item.title} 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </div>
  );
};

export default ItemPage;
