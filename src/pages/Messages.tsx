import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Clock, User as UserIcon, Tag, ShieldCheck, Cpu } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

const Messages: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t, isRTL } = useLanguage();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort client-side to avoid index requirements for array-contains + orderBy
      const sortedData = data
        .filter(conv => isAdmin || conv.type !== 'ai_test')
        .sort((a, b) => {
          const timeA = a.updatedAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });
      setConversations(sortedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleContactAI = async () => {
    if (!user) return;
    const aiBotId = 'ai-test-bot';
    const conversationId = `ai-chat-${user.uid}`;
    
    try {
      const convSnap = await getDoc(doc(db, 'conversations', conversationId));
      if (!convSnap.exists()) {
        await setDoc(doc(db, 'conversations', conversationId), {
          participants: [user.uid, aiBotId],
          participantNames: {
            [user.uid]: user.displayName || 'Admin',
            [aiBotId]: 'KurdBid AI Assistant'
          },
          itemId: 'ai_test',
          itemTitle: 'AI Test Channel',
          lastMessage: 'Welcome to the AI test channel!',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          type: 'ai_test'
        });
      }
      navigate(`/messages/${conversationId}`);
    } catch (err) {
      console.error("AI chat error:", err);
    }
  };

  if (loading) return <div className="text-center py-20">{isRTL ? 'گەڕان بۆ نامەکان...' : 'Loading messages...'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('messages')}</h1>
          <p className="text-gray-500">{isRTL ? 'مێژووی گفتوگۆکانت لەگەڵ کڕیار و فرۆشیارەکان.' : 'Your chat history with buyers and sellers.'}</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleContactAI}
            className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-2xl font-bold hover:bg-primary-hover transition-all active:scale-95 border-2 border-primary"
          >
            <ShieldCheck className="w-5 h-5" />
            {isRTL ? 'قسەکردن لەگەڵ AI' : 'Talk to AI'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        {conversations.length > 0 ? (
          <div className="divide-y">
            {conversations.map((conv) => (
              <Link 
                key={conv.id} 
                to={`/messages/${conv.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all",
                      conv.type === 'ai_test' ? "bg-orange-100 text-orange-600" : "bg-indigo-100 text-indigo-700"
                    )}>
                      {conv.type === 'ai_test' ? <Cpu className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {conv.itemTitle}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-1 italic">
                        "{conv.lastMessage}"
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(conv.updatedAt)}
                    </span>
                    <div className="flex -space-x-2">
                      {conv.participants.map((p: string, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-gray-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl">{t('noConversations')}</p>
            <p className="text-sm">{isRTL ? 'کاتێک نامە بۆ فرۆشیارێک دەنێریت، چاتەکە لێرە دەردەکەوێت.' : 'When you message a seller, the chat will appear here.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
