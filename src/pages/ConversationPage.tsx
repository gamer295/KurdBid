import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, serverTimestamp, 
  doc, getDoc, orderBy, updateDoc, limit 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  Send, ChevronLeft, User as UserIcon, Tag, Package, Cpu, 
  Sparkles, Image as ImageIcon, X, Mic, Square, Play, Pause, Loader2 
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI } from "@google/genai";

const ConversationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { t, isRTL } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const startRecording = async (e: React.PointerEvent) => {
    e.preventDefault();
    if (isRecording) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(isRTL ? "بەداخەوە مایکڕۆفۆن لەم وێبگەڕەدا پشتگیری ناکرێت" : "Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            setAudioUrl(reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(200); // Collect data every 200ms
      setIsRecording(true);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert(isRTL 
          ? "تکایە ڕێگە بدە بە مایکڕۆفۆن بۆ ناردنی پەیامی دەنگی. ئەگەر لەناو ئەپەکەی گوگل دایت، پێشنیار دەکەین لە وێبگەڕی براوسەر بیکەیتەوە." 
          : "Microphone permission denied. If you are inside the Google App, we recommend opening in a regular browser.");
      } else {
        alert(isRTL 
          ? "هەڵەیەک ڕوویدا لە دەستگەیشتن بە مایکڕۆفۆن. تکایە پەرەکە نوێ بکەرەوە." 
          : "Could not access microphone. Please refresh or check browser settings.");
      }
    }
  };

  const stopRecording = (e: React.PointerEvent) => {
    e.preventDefault();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const aiBotId = 'ai-test-bot';

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 500;
          if (width > height) {
            if (width > max_size) { height *= max_size / width; width = max_size; }
          } else {
            if (height > max_size) { width *= max_size / height; height = max_size; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setSelectedImage(canvas.toDataURL('image/jpeg', 0.6));
          setUploading(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const callAiBot = async (userMessage: string, userImage?: string | null) => {
    setIsAiResponding(true);
    try {
      const ggen = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const sessionHistory = messages.slice(-10).map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        if (m.imageUrl) {
          parts.push({ 
            inlineData: { 
              mimeType: "image/jpeg", 
              data: m.imageUrl.split(',')[1] 
            } 
          });
        }
        return {
          role: m.senderId === user.uid ? 'user' : 'model',
          parts
        };
      });

      const chat = ggen.chats.create({
        model: "gemini-3-flash-preview",
        history: sessionHistory,
        config: {
          systemInstruction: "You are KurdBid AI Assistant. Friendly, concise, helpful. Site owners use you for testing the KurdBid platform. Reply in a mix of Kurdish and English when appropriate.",
        }
      });

      const currentParts: any[] = [];
      if (userMessage) currentParts.push({ text: userMessage });
      if (userImage) {
        currentParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: userImage.split(',')[1]
          }
        });
      }
      
      // If no text or image, handle fallback
      const messageParts = currentParts.length > 0 ? currentParts : [{ text: "What is in the context?" }];

      const result = await chat.sendMessage({ message: messageParts });
      const aiText = result.text || "I'm sorry, I couldn't generate a response.";

      // Add AI message to Firestore
      await addDoc(collection(db, 'conversations', id!, 'messages'), {
        senderId: aiBotId,
        senderName: 'KurdBid AI Assistant',
        text: aiText,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update conversation
      await updateDoc(doc(db, 'conversations', id!), {
        lastMessage: aiText,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAiResponding(false);
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    // Fetch Conversation Details
    const fetchConv = async () => {
      const docSnap = await getDoc(doc(db, 'conversations', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.participants.includes(user.uid)) {
          navigate('/messages');
          return;
        }
        setConversation(data);
        
        // Fetch Item details
        if (data.itemId) {
          const itemSnap = await getDoc(doc(db, 'items', data.itemId));
          if (itemSnap.exists()) {
            setItem({ id: itemSnap.id, ...itemSnap.data() });
          }
        }
      } else {
        navigate('/messages');
      }
    };
    fetchConv();

    // Fetch Messages
    const q = query(
      collection(db, 'conversations', id, 'messages')
      // orderBy removed to avoid index requirements
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client-side sort
      const sorted = data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB; // Ascending for chat
      });
      setMessages(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Conversation Messages Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage && !audioUrl) || !id || !user || !conversation) return;

    const chatText = newMessage.trim();
    const chatImage = selectedImage;
    const chatAudio = audioUrl;
    
    setNewMessage('');
    setSelectedImage(null);
    setAudioUrl(null);

    try {
      // Add message
      const messageData: any = {
        senderId: user.uid,
        senderName: user.displayName,
        createdAt: serverTimestamp(),
        read: false
      };

      if (chatText) {
        messageData.text = chatText;
        messageData.type = 'text';
      }
      if (chatImage) {
        messageData.imageUrl = chatImage;
        messageData.type = 'image';
      }
      if (chatAudio) {
        messageData.audioUrl = chatAudio;
        messageData.type = 'audio';
      }

      await addDoc(collection(db, 'conversations', id, 'messages'), messageData);

      let lastMsgText = chatText;
      if (chatImage) lastMsgText = isRTL ? '📷 وێنە' : '📷 Image';
      if (chatAudio) lastMsgText = isRTL ? '🎤 پەیامی دەنگی' : '🎤 Voice message';

      // Update conversation
      await updateDoc(doc(db, 'conversations', id), {
        lastMessage: lastMsgText,
        updatedAt: serverTimestamp()
      });

      const recipientId = conversation.participants.find((p: string) => p !== user.uid);
      
      if (recipientId === aiBotId) {
        callAiBot(chatText, chatImage);
      } else if (recipientId) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipientId,
          type: 'message',
          content: `${user.displayName}: ${chatText.substring(0, 50)}${chatText.length > 50 ? '...' : ''}`,
          relatedId: id,
          createdAt: serverTimestamp(),
          read: false
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return <div className="text-center py-20">{isRTL ? 'چاوەڕێبە...' : 'Loading chat...'}</div>;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-12rem)] bg-white md:rounded-3xl shadow-xl border-x md:border overflow-hidden">
      {/* Header */}
      <div className="p-3 md:p-4 border-b flex items-center justify-between bg-white z-10 sticky top-0">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <button onClick={() => navigate('/messages')} className="p-2 hover:bg-gray-100 rounded-full shrink-0">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          {item && conversation?.participants.includes(aiBotId) === false && (
            <Link to={`/item/${item.id}`} className="flex items-center gap-2 md:gap-3 group shrink overflow-hidden">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={item.imageUrls?.[0] || `https://picsum.photos/seed/${item.id}/100/100`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm md:text-base truncate">{item.title}</h2>
                <p className="text-xs md:text-sm font-bold text-indigo-600 leading-none mt-1">{item.price?.toLocaleString()} {isRTL ? 'د.ع' : 'IQD'}</p>
              </div>
            </Link>
          )}

          {conversation?.participants.includes(aiBotId) && (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md">
                <Cpu className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-gray-900 text-sm md:text-base">KurdBid AI Assistant</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{isRTL ? 'چالاک' : 'ONLINE'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50/50 flex flex-col">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id || idx}
              className={cn(
                "max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm relative group",
                isMe 
                  ? "self-end bg-primary text-white rounded-tr-none" 
                  : "self-start bg-white text-gray-800 border rounded-tl-none"
              )}
            >
              {!isMe && <p className="text-[9px] font-black uppercase tracking-wider mb-1.5 opacity-60 flex items-center gap-1">
                {msg.senderId === aiBotId && <Sparkles className="w-3 h-3 text-orange-400" />}
                {msg.senderName}
              </p>}
              
              {msg.imageUrl && (
                <div 
                  className="mb-2 rounded-xl overflow-hidden border border-black/5 cursor-zoom-in shadow-inner"
                  onClick={() => setZoomImage(msg.imageUrl)}
                >
                  <img src={msg.imageUrl} alt="" className="w-full h-auto max-h-60 md:max-h-80 object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              )}

              {msg.audioUrl && (
                <div className={cn(
                  "flex items-center gap-3 p-1 mb-2",
                  isMe ? "text-white" : "text-primary"
                )}>
                  <AudioPlayer src={msg.audioUrl} invert={isMe} />
                </div>
              )}

              {msg.text && <p className="leading-relaxed text-sm md:text-base font-medium">{msg.text}</p>}
              <p className={cn(
                "text-[9px] font-bold mt-2 text-right opacity-60 tracking-wider",
                isMe ? "text-blue-100/70" : "text-gray-400"
              )}>
                {formatDate(msg.createdAt)}
              </p>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {isAiResponding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="self-start bg-orange-50 text-orange-700 p-4 rounded-2xl rounded-tl-none border border-orange-100 flex items-center gap-3"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {isRTL ? 'AI خەریکی وەڵامدانەوەیە...' : 'AI is responding...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 bg-white border-t">
        <AnimatePresence>
          {(selectedImage || audioUrl) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-4 flex gap-4"
            >
              {selectedImage && (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border shadow-lg">
                  <img src={selectedImage} alt="" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full hover:bg-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {audioUrl && (
                <div className="relative flex-1 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      <Mic className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-indigo-900 uppercase tracking-widest block leading-none mb-1">
                         {isRTL ? "پەیامێکی دەنگی ئامادەیە" : "Voice Message Ready"}
                      </span>
                      <p className="text-[10px] text-indigo-600 font-bold opacity-70 uppercase tracking-tighter">Click send to deliver</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setAudioUrl(null)}
                    className="p-2 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-4 items-end">
          <div className="flex gap-2 shrink-0">
            <label className={cn(
              "cursor-pointer p-3 md:p-4 bg-gray-50 border rounded-2xl hover:bg-gray-100 transition shadow-sm shrink-0",
              uploading && "opacity-50 pointer-events-none"
            )}>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {uploading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-500 animate-spin" /> : <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />}
            </label>

            <button
              type="button"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              className={cn(
                "p-3 md:p-4 rounded-2xl transition shadow-sm shrink-0 flex items-center justify-center touch-none",
                isRecording ? "bg-red-500 text-white animate-pulse scale-110" : "bg-gray-50 border text-gray-500 hover:bg-gray-100"
              )}
            >
              {isRecording ? <Square className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          </div>
          
          <div className="flex-1 relative">
            {isRecording && (
              <div className="absolute inset-0 bg-gray-50 border rounded-2xl flex items-center px-4 md:px-6 z-10 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="text-xs md:text-sm font-black text-red-600 uppercase tracking-widest grow">
                    {isRTL ? 'خەریکی تۆمارکردنە...' : 'Recording...'} {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {isRTL ? 'بۆ سڕینەوە دەستی لێ هەڵگرە' : 'Release to stop'}
                  </span>
                </div>
              </div>
            )}
            <textarea
              rows={1}
              placeholder={t('typeMessage')}
              className="w-full bg-gray-50 border rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none max-h-32 font-medium text-sm md:text-base"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
            />
          </div>

          <button
            type="submit"
            className="bg-primary text-black p-3 md:p-4 rounded-2xl hover:bg-primary-hover transition border-2 border-primary disabled:opacity-50 disabled:shadow-none shrink-0"
            disabled={(!newMessage.trim() && !selectedImage && !audioUrl) || uploading || isRecording}
          >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </form>
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[110]"
            >
              <X className="w-8 h-8" />
            </button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={zoomImage}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AudioPlayer: React.FC<{ src: string, invert?: boolean }> = ({ src, invert }) => {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (playing) audioRef.current?.pause();
    else audioRef.current?.play();
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-3 min-w-[120px] md:min-w-[180px]">
      <audio 
        ref={audioRef} 
        src={src} 
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
      />
      <button onClick={toggle} className={cn(
        "p-2 rounded-full shadow-sm hover:scale-105 transition-transform",
        invert ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
      )}>
        {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 h-1 bg-current/20 rounded-full relative overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-current transition-all duration-100" 
          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        />
      </div>
      <span className="text-[10px] whitespace-nowrap opacity-80 font-mono">
        {Math.floor(currentTime)}s / {Math.floor(duration)}s
      </span>
    </div>
  );
};

export default ConversationPage;
