import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, MessageSquare, Tag, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface NotificationsProps {
  isBottomNavVisible: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({ isBottomNavVisible }) => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      limit(50) // Fetch more to allow client-side sorting/filtering
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const sorted = data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setNotifications(sorted.slice(0, 5));
    }, (error) => {
      console.error("Notifications listener error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notif: any) => {
    await updateDoc(doc(db, 'notifications', notif.id), { read: true });
    setShowDropdown(false);
    if (notif.type === 'message') {
      navigate(`/messages/${notif.relatedId}`);
    } else if (notif.type === 'sale') {
      navigate('/my-sales');
    }
    // For follow, just clearing it is fine for now
  };

  if (!user) return null;

  return (
    <div className={cn(
      "fixed z-[100] transition-all duration-300 right-6",
      isBottomNavVisible ? "bottom-20 md:bottom-6" : "bottom-6"
    )}>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={cn(
            "p-3 md:p-4 rounded-full shadow-2xl transition-all relative group",
            notifications.length > 0 ? "bg-primary text-white" : "bg-white text-text-light border border-border-polish"
          )}
        >
          <Bell className="w-5 h-5 md:w-6 h-6 group-hover:rotate-12 transition-transform" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-danger border-2 border-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden"
            >
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{t('notifications')}</h3>
                <button onClick={() => setShowDropdown(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full p-4 hover:bg-indigo-50 transition-colors text-left flex gap-3 items-start"
                    >
                      <div className="mt-1">
                        {notif.type === 'message' ? (
                          <MessageSquare className="w-4 h-4 text-indigo-500" />
                        ) : notif.type === 'follow' ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <Tag className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className={cn("text-sm text-gray-800 line-clamp-2", isRTL && "text-right")}>{notif.content}</p>
                        <p className={cn("text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider", isRTL && "text-right")}>{t('justNow')}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm">{t('allCaughtUp')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notifications;
