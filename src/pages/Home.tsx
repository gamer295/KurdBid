import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Search, SlidersHorizontal, Package, Tag, ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import ItemCard from '../components/ItemCard';
import AdBanner from '../components/AdBanner';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from 'react-router-dom';

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
  isFake?: boolean;
  expiresAt?: any;
}

const Home: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');

  const categories = [
    { id: 'All', label: t('all') },
    { id: 'Users', label: t('users') },
    { id: 'Electronics', label: t('electronics') },
    { id: 'Fashion', label: t('fashion') },
    { id: 'Home & Garden', label: t('homeGarden') },
    { id: 'Motors', label: t('motors') },
    { id: 'Collectibles', label: t('collectibles') },
    { id: 'Sports', label: t('sports') },
    { id: 'Other', label: t('other') },
  ];
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Items - Limit to 50 for performance
    const qItems = query(
      collection(db, 'items'),
      where('status', '==', 'active'),
      limit(50)
    );

    const unsubItems = onSnapshot(qItems, (snapshot) => {
      const now = Date.now();
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Item))
        .filter(i => {
          if (i.isFake) {
            // Only show fake posts to admins if they haven't expired
            const expiration = i.expiresAt?.toDate?.() || i.expiresAt;
            const isExpired = expiration && new Date(expiration).getTime() < now;
            return isAdmin && !isExpired;
          }
          return true;
        });
      // Sort client-side to avoid index requirements
      const sortedData = data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setItems(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Items listener error:", error);
      setLoading(false);
    });

    // Fetch Users (for user search) - Only if signed in to avoid permission errors for guests
    let unsubUsers = () => {};
    if (user) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubItems();
      unsubUsers();
    };
  }, [user]); // Removed category to prevent unnecessary re-fetches

  const filteredItems = items
    .filter(item => {
      const matchesStatus = item.status === 'active';
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'All' || item.category === category;
      const matchesMinPrice = minPrice === '' || item.price >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === '' || item.price <= parseFloat(maxPrice);
      return matchesStatus && matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt?.seconds - a.createdAt?.seconds;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <AdBanner />

      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-[250px]" />
            ))}
          </div>
        ) : category === 'Users' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredUsers.length > 0 ? filteredUsers.map(u => (
               <div key={u.id} className="card-polish p-6 bg-white flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-border-polish overflow-hidden">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-text-light">{u.displayName?.[0]}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-dark">{u.displayName}</h3>
                    {u.location && <p className="text-xs text-text-light flex items-center justify-center gap-1 mt-1 font-medium"><Tag className="w-3 h-3"/> {u.location}</p>}
                  </div>
                  {u.bio && <p className="text-xs text-text-light line-clamp-2 italic">"{u.bio}"</p>}
                  <button className="btn-polish w-full font-bold uppercase tracking-wider text-[10px] mt-2">{t('viewListings')}</button>
               </div>
             )) : (
              <div className="col-span-full text-center py-20 bg-white rounded-lg border border-border-polish">
                <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-text-dark">{t('noItemsFound')}</h3>
                <p className="text-text-light text-sm">{t('tryAdjustFilters')}</p>
              </div>
             )}
          </div>
        ) : filteredItems.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index % 6 * 0.05,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <ItemCard item={item} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-border-polish">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-text-dark">{t('noItemsFound')}</h3>
            <p className="text-text-light text-sm">{t('tryAdjustFilters')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
