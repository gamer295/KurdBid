import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Plus, Package, Trash2, CheckCircle, Tag, DollarSign, Image as ImageIcon, X, ShieldCheck, Sparkles, Gavel, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ItemCard from '../components/ItemCard';

import { useDropzone } from 'react-dropzone';
import { useLanguage } from '../context/LanguageContext';

const MySales: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t, isRTL } = useLanguage();

  const categories = [
    { id: "Electronics", label: t('electronics') },
    { id: "Fashion", label: t('fashion') },
    { id: "Home & Garden", label: t('homeGarden') },
    { id: "Motors", label: t('motors') },
    { id: "Collectibles", label: t('collectibles') },
    { id: "Sports", label: t('sports') },
    { id: "Other", label: t('other') }
  ];
  const [items, setItems] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState("Electronics");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isFake, setIsFake] = useState(false);
  const [isAuction, setIsAuction] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState("3"); // days

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'items'),
      where('sellerId', '==', user.uid),
      limit(50)
      // orderBy removed to avoid index-related permission errors
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Client-side sorting
      const sorted = data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setItems(sorted.filter((i: any) => i.status !== 'removed'));
      setLoading(false);
    }, (error) => {
      console.error("MySales Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 600; // Reduced from 800 to prevent hitting Firestore 1MB limit

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5)); // Reduced quality from 0.7 to 0.5 for stability
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (images.length >= 4) return;
    
    setProcessingImages(true);
    try {
      const remaining = 4 - images.length;
      const filesToUpload = acceptedFiles.slice(0, remaining);
      
      const base64Images = await Promise.all(
        filesToUpload.map(file => resizeImage(file).catch(err => {
          console.error(err);
          return null;
        }))
      );
      
      const filtered = base64Images.filter((img): img is string => img !== null);
      setImages(prev => [...prev, ...filtered]);
    } catch (err) {
      console.error("Drop processing failed", err);
    } finally {
      setProcessingImages(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 4,
    disabled: images.length >= 4
  } as any);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !price || !description) return;

    setSubmitting(true);
    try {
      if (images.length === 0) {
        throw new Error(isRTL ? 'تکایە وێنەیەک دابنێ' : 'Please add at least one image');
      }

      const itemData = {
        title,
        description,
        price: parseFloat(price),
        category,
        imageUrls: images,
        updatedAt: serverTimestamp(),
        isFake: isAdmin ? isFake : false,
        expiresAt: isAdmin && isFake ? new Date(Date.now() + 10 * 60 * 1000) : null,
        isAuction,
        startingPrice: isAuction ? parseFloat(price) : null,
        currentBid: isAuction ? parseFloat(price) : null,
        bidCount: isAuction ? 0 : null,
        endsAt: isAuction ? new Date(Date.now() + parseInt(auctionDuration) * 24 * 60 * 60 * 1000) : null,
        status: 'active'
      };

      if (editingItemId) {
        await updateDoc(doc(db, 'items', editingItemId), itemData);
      } else {
        await addDoc(collection(db, 'items'), {
          ...itemData,
          sellerId: user.uid,
          sellerName: user.displayName,
          createdAt: serverTimestamp(),
        });
      }

      setShowAddForm(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving document: ", error);
      alert(isRTL ? `هەڵەیەک ڕوویدا: ${error.message}` : `Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingItemId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setImages([]);
    setCategory(categories[0].id);
    setIsFake(false);
  };

  const handleEditClick = (item: any) => {
    setEditingItemId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price.toString());
    setCategory(typeof item.category === 'object' ? item.category.id : item.category);
    setImages(item.imageUrls || []);
    setIsFake(item.isFake || false);
    setIsAuction(item.isAuction || false);
    setShowAddForm(true);
  };

  const handleMarkAsSold = async (itemId: string) => {
    try {
      await updateDoc(doc(db, 'items', itemId), { status: 'sold' });
    } catch (error) {
      console.error("Error marking as sold:", error);
      alert(isRTL ? "هەڵەیەک ڕوویدا لە کاتی گۆڕینی دۆخی کاڵاکە" : "Error marking as sold");
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await updateDoc(doc(db, 'items', itemToDelete), { status: 'removed' });
      setItemToDelete(null);
    } catch (error) {
      console.error("Detailed Delete Error:", error);
      alert(isRTL ? "هەڵەیەک ڕوویدا لە کاتی سڕینەوەی کاڵاکە" : "Error deleting listing. Check console for details.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-dark tracking-tight">{t('mySalesTitle')}</h1>
          <p className="text-text-light">{t('manageListings')}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="flex items-center justify-center gap-2 bg-primary text-black border-2 border-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('listNewItem')}
        </button>
      </div>

      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm p-8 rounded-3xl border shadow-sm text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-danger rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-text-dark">
                  {isRTL ? 'دڵنیای لە سڕینەوە؟' : 'Are you sure?'}
                </h3>
                <p className="text-text-light text-sm mt-2">
                  {isRTL ? 'ئەم پڕۆسەیە ناگەڕێتەوە و کاڵاکە لە لیستەکە نامێنێت.' : 'This action cannot be undone and your listing will be removed.'}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  disabled={deleting}
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-text-light bg-bg-polish border border-border-polish hover:bg-gray-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-danger hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : <Trash2 className="w-4 h-4" />}
                  {isRTL ? 'بیسڕەوە' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl p-8 rounded-3xl border shadow-sm relative overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => { setShowAddForm(false); resetForm(); }}
                className="absolute top-6 ltr:right-6 rtl:left-6 text-text-light hover:text-text-dark"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-text-dark">{editingItemId ? t('editItem') : t('listNewItem')}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-light uppercase tracking-wider">{t('itemTitle')}</label>
                  <input
                    required
                    className="w-full p-4 bg-bg-polish border border-border-polish rounded-2xl outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium text-sm"
                    placeholder={t('itemTitle')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> {t('price')} (IQD)
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full p-4 bg-bg-polish border border-border-polish rounded-2xl outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold"
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {t('categories')}
                    </label>
                    <select
                      className="w-full p-4 bg-bg-polish border border-border-polish rounded-2xl outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold text-sm"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-primary/5 p-6 rounded-3xl border-2 border-primary/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-bold text-text-dark">{t('auctionMode')}</p>
                          <p className="text-[10px] text-text-light font-bold uppercase tracking-widest">{t('usersCanBid')}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isAuction} 
                          onChange={(e) => setIsAuction(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  {isAuction && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t('auctionDuration')}
                      </label>
                      <select
                        className="w-full p-4 bg-white border border-border-polish rounded-2xl outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold text-sm shadow-inner"
                        value={auctionDuration}
                        onChange={(e) => setAuctionDuration(e.target.value)}
                      >
                        <option value="1">{isRTL ? '١ ڕۆژ' : '1 Day'}</option>
                        <option value="3">{isRTL ? '٣ ڕۆژ' : '3 Days'}</option>
                        <option value="7">{isRTL ? '٧ ڕۆژ' : '7 Days'}</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-light uppercase tracking-wider">{t('itemDescription')}</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full p-4 bg-bg-polish border border-border-polish rounded-2xl outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    placeholder={t('itemDescription')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-text-light uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> {isRTL ? 'وێنەکان' : 'Images'}
                  </label>
                  
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
                      isDragActive ? "border-primary bg-primary/5" : "border-border-polish bg-bg-polish",
                      (images.length >= 4 || processingImages) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                      {processingImages ? (
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <Plus className={cn("w-8 h-8", isDragActive ? "text-primary" : "text-text-light")} />
                      )}
                      <p className="text-xs font-bold text-text-dark">
                        {processingImages ? (isRTL ? 'خەریکی پڕۆسێسکردنە...' : 'Processing...') : t('dragAndDrop')}
                      </p>
                      <p className="text-[10px] text-text-light">{t('maxFilesWarning')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-border-polish group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {isAdmin && (
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-bold text-orange-900">{isRTL ? 'پۆستی فەیک' : 'Fake Post'}</p>
                        <p className="text-[10px] text-orange-600 uppercase font-bold tracking-widest">{isRTL ? 'تەنها بۆ ئەدمینەکان دەردەکەوێت' : 'Admin only - Self-deletes in 10m'}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isFake} 
                        onChange={(e) => setIsFake(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-orange-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                )}

                <button
                  disabled={submitting}
                  type="submit"
                  className="btn-polish btn-polish-primary w-full py-4 text-sm font-bold uppercase tracking-widest"
                >
                  {submitting ? (editingItemId ? t('updating') : t('posting')) : (editingItemId ? t('updateItem') : t('postItem'))}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-text-light font-bold">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            {isRTL ? 'چاوەڕێبە...' : 'Loading...'}
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="relative group">
              <ItemCard item={item} />
              <div className="absolute top-4 ltr:left-4 rtl:right-4 flex gap-2">
                {item.status === 'sold' && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{t('sold')}</span>
                )}
                {item.status === 'removed' && (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{isRTL ? 'سڕاوەتەوە' : 'REMOVED'}</span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {(item.status === 'active' || item.status === 'sold') && (
                  <>
                    {item.status === 'active' && (
                      <button 
                        onClick={() => handleMarkAsSold(item.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all active:scale-95 border border-green-600"
                      >
                        <CheckCircle className="w-4 h-4" /> {t('markSold')}
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 border border-blue-600"
                    >
                      <ImageIcon className="w-4 h-4" /> {t('edit')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setItemToDelete(item.id);
                      }}
                      className="p-2 text-danger bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-border-polish shadow-inner">
            <Package className="w-16 h-16 text-border-polish mx-auto mb-4" />
            <h3 className="text-xl font-extrabold text-text-dark">{t('noListings')}</h3>
            <p className="text-text-light text-sm mt-2">{isRTL ? 'دەتوانیت هەر ئێستا یەکەم کاڵا دابنێیت' : 'Start selling by listing your first item.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySales;
