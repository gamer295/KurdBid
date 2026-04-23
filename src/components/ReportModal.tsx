import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  itemId: string;
  itemTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ itemId, itemTitle, isOpen, onClose }) => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reason.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        reporterName: user.displayName,
        itemId,
        itemTitle,
        reason: reason.trim(),
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
      }, 3000);
    } catch (error) {
      console.error("Error reporting item:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative"
          >
            <button 
              onClick={onClose}
              className={isRTL ? "absolute top-6 left-6 text-gray-400" : "absolute top-6 right-6 text-gray-400"}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{t('reportItem')}</h2>
                <p className="text-xs text-gray-500 font-medium">{itemTitle}</p>
              </div>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <X className="w-8 h-8 rotate-45" />
                  </motion.div>
                </div>
                <p className="text-sm font-bold text-gray-900">{t('reportSuccess')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('reportReason')}</label>
                  <textarea
                    required
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('reportPlaceholder')}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition disabled:opacity-50 text-sm"
                >
                  {submitting ? t('processing') : t('reportSubmit')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
