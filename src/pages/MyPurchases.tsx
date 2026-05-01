import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Tag } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

const MyPurchases: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // We fetch conversations where the user is a participant
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      // Filter out conversations where user is the seller
      const purchaseInquiries = [];
      for (const conv of convs) {
        if (conv.itemId) {
          const itemSnap = await getDoc(doc(db, 'items', conv.itemId));
          if (itemSnap.exists() && itemSnap.data().sellerId !== user.uid) {
            purchaseInquiries.push({ ...conv, item: itemSnap.data() });
          }
        }
      }
      
      setInquiries(purchaseInquiries.sort((a,b) => b.updatedAt?.seconds - a.updatedAt?.seconds));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="text-center py-20">{isRTL ? 'گەڕان بۆ کڕینەکانت...' : 'Loading your purchases...'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('myPurchasesTitle')}</h1>
        <p className="text-gray-500">{t('myPurchasesDesc')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {inquiries.length > 0 ? (
          inquiries.map((inquiry) => (
            <Link 
              key={inquiry.id} 
              to={`/messages/${inquiry.id}`}
              className="bg-white p-6 rounded-3xl shadow-sm border hover:shadow-md transition-all group flex flex-col sm:flex-row gap-6 items-start sm:items-center"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                 <img 
                  src={inquiry.item?.imageUrls?.[0] || `https://picsum.photos/seed/${inquiry.itemId}/200/200`} 
                  alt="" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {typeof inquiry.item?.category === 'object' ? (inquiry.item.category as any).label || (inquiry.item.category as any).id : inquiry.item?.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{inquiry.itemTitle}</h3>
                <p className="text-gray-500 text-sm italic">{t('lastMessage')}: {inquiry.lastMessage}</p>
                <div className="text-xs text-gray-400 flex items-center gap-4">
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('updated')} {formatDate(inquiry.updatedAt)}</span>
                   <span className="font-bold text-indigo-600">{inquiry.item?.price.toLocaleString()} {isRTL ? 'د.ع' : 'IQD'}</span>
                </div>
              </div>
              <div className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl text-sm font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {t('openChat')}
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-medium text-gray-900">{t('noPurchases')}</p>
            <p className="text-gray-500">{t('noPurchasesDesc')}</p>
            <Link to="/" className="mt-6 inline-block text-indigo-600 font-bold hover:underline">
              {t('browseMarketplace')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
