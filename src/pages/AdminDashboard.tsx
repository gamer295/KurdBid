import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, updateDoc, doc, limit, getDocs, deleteDoc, orderBy, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
  ShieldCheck, UserX, UserMinus, ShieldAlert, Search, Trash2, 
  ShieldX, User as UserIcon, AlertCircle, CheckCircle, ExternalLink, 
  Plus, Eye, EyeOff, Loader2, Image as ImageIcon, Video, Upload, X 
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { formatDate, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ adsEnabled: true });
  const [loading, setLoading] = useState(true);
  
  // Ad Form State
  const [showAdForm, setShowAdForm] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adImage, setAdImage] = useState('');
  const [adVideo, setAdVideo] = useState('');
  const [adDuration, setAdDuration] = useState('60');
  const [adMediaType, setAdMediaType] = useState<'image' | 'video'>('image');
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const { t, isRTL } = useLanguage();
  const { isAdmin: isAuthAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthAdmin) {
      navigate('/');
    }
  }, [authLoading, isAuthAdmin, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthAdmin) return;

    // Fetch Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Items (recent)
    const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Reports
    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Ads
    const unsubAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch Settings
    const unsubSettings = onSnapshot(doc(db, 'appConfig', 'global'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data());
    });

    return () => {
      unsubUsers();
      unsubItems();
      unsubReports();
      unsubAds();
      unsubSettings();
    };
  }, []);

  const handleResolveReport = async (reportId: string) => {
    if (confirm(t('resolveReport'))) {
      await deleteDoc(doc(db, 'reports', reportId));
    }
  };

  const handleUpdateRank = async (userId: string, currentRank: string | undefined, newRank: 'Super' | 'Moderator' | 'Support' | null) => {
    const confirmMsg = newRank 
      ? t('promoteUser') 
      : t('removeAdmin');
    
    if (confirm(confirmMsg)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isAdmin: !!newRank,
          adminRank: newRank || null
        });
        alert(t('rankUpdated'));
      } catch (err) {
        console.error("Rank update error:", err);
        alert(t('errorOccurred'));
      }
    }
  };

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    if (currentlyBanned) {
      if (confirm(t('unbanUser'))) {
        await updateDoc(doc(db, 'users', userId), {
          isBanned: false,
          bannedUntil: null
        });
      }
      return;
    }

    const duration = window.prompt(t('banDurationPrompt'), "7 days");
    if (duration) {
      await updateDoc(doc(db, 'users', userId), {
        isBanned: true,
        bannedUntil: duration
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const confirmMsg = isRTL ? 'ئایا دڵنیای لە سڕینەوەی ئەم کاڵایە؟' : 'Remove this listing indefinitely?';
    if (confirm(confirmMsg)) {
      try {
        await updateDoc(doc(db, 'items', itemId), { status: 'removed' });
        alert(t('itemRemoved'));
      } catch (err) {
        console.error("Admin remove error:", err);
        alert(t('errorOccurred'));
      }
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adDesc || !adLink) return;

    setAdSubmitting(true);
    try {
      await addDoc(collection(db, 'ads'), {
        title: adTitle,
        description: adDesc,
        link: adLink,
        imageUrl: adMediaType === 'image' ? adImage : null,
        videoUrl: adMediaType === 'video' ? adVideo : null,
        videoDuration: adMediaType === 'video' ? parseInt(adDuration) || 60 : null,
        mediaType: adMediaType,
        active: true,
        createdAt: serverTimestamp()
      });
      setShowAdForm(false);
      setAdTitle('');
      setAdDesc('');
      setAdLink('');
      setAdImage('');
      setAdVideo('');
      setAdMediaType('image');
    } catch (err) {
      console.error("Error adding ad:", err);
    } finally {
      setAdSubmitting(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (file.type.startsWith('image/')) {
        setAdImage(result);
        setAdMediaType('image');
      } else if (file.type.startsWith('video/')) {
        setAdVideo(result);
        setAdMediaType('video');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    },
    multiple: false
  } as any);

  const toggleAdStatus = async (adId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'ads', adId), { active: !currentStatus });
  };

  const deleteAd = async (adId: string) => {
    if (confirm("Delete this advertisement?")) {
      await deleteDoc(doc(db, 'ads', adId));
    }
  };

  const handleToggleAdsEnabled = async () => {
    try {
      await updateDoc(doc(db, 'appConfig', 'global'), { adsEnabled: !settings.adsEnabled });
    } catch (err) {
      // Create if doesn't exist
      await setDoc(doc(db, 'appConfig', 'global'), { adsEnabled: !settings.adsEnabled });
    }
  };

  const handleDeleteAllItems = async () => {
    const confirmation = window.prompt(t('deleteAllConfirmation'));
    if (confirmation === 'DELETE ALL') {
      try {
        const activeItems = items.filter(i => i.status === 'active');
        if (activeItems.length === 0) {
          alert(t('noActiveItems'));
          return;
        }

        const promises = activeItems.map(item => 
          updateDoc(doc(db, 'items', item.id), { status: 'removed' })
        );

        await Promise.all(promises);
        alert(t('bulkDeleteSuccess').replace('{n}', activeItems.length.toString()));
      } catch (error) {
        console.error("Bulk delete error:", error);
        alert(t('errorOccurred'));
      }
    }
  };

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase() || '').includes(userSearch.toLowerCase()) || 
    (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())
  );

  const filteredItems = items.filter(i => 
    (i.title?.toLowerCase() || '').includes(itemSearch.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Top Banner */}
      <div className="bg-orange-50 border border-orange-200 p-8 rounded-3xl flex items-center gap-6">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-orange-900 tracking-tight">{t('adminTerminal')}</h1>
          <p className="text-orange-700">{t('manageSecurity')}</p>
          <button 
            onClick={handleDeleteAllItems}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t('deleteAllPosts')}
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-orange-200 min-w-[240px]">
          <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">{t('systemSettings')}</h3>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">{t('adsEnabled')}</span>
            <button
              onClick={handleToggleAdsEnabled}
              className={cn(
                "w-12 h-6 rounded-full relative transition-colors",
                settings.adsEnabled ? "bg-green-500" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                settings.adsEnabled ? "right-1" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Ad Management */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ExternalLink className="w-6 h-6 text-indigo-500" /> {t('adList')}
            </h2>
            <button 
              onClick={() => setShowAdForm(true)}
              className="bg-primary text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('addNewAd')}
            </button>
          </div>

          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between gap-6 group">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border relative group/video">
                    {ad.mediaType === 'video' ? (
                      <video 
                        src={ad.videoUrl} 
                        className="w-full h-full object-cover bg-black" 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                      />
                    ) : ad.imageUrl ? (
                      <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-gray-900 truncate">{ad.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1">{ad.description}</p>
                    <a href={ad.link} className="text-[10px] text-indigo-600 font-bold hover:underline truncate block">
                      {ad.link}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleAdStatus(ad.id, ad.active)}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      ad.active ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"
                    )}
                    title={ad.active ? "Deactivate" : "Activate"}
                  >
                    {ad.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => deleteAd(ad.id)}
                    className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {ads.length === 0 && (
              <div className="py-12 border border-dashed rounded-3xl text-center text-gray-400 font-medium">
                {t('noAdsYet')}
              </div>
            )}
          </div>
        </section>

        {/* Reports Panel */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UserX className="w-6 h-6 text-red-500" /> {t('userControl')}
            </h2>
            <div className="relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
              <input
                type="text"
                placeholder={t('searchUsers')}
                className={cn(
                  "py-2 bg-gray-100 rounded-full border-none outline-none focus:ring-2 focus:ring-orange-500",
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                )}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-400 h-12">
                  <th className="px-6">{isRTL ? 'بەکارهێنەر' : 'User'}</th>
                  <th className="px-6">{t('status')}</th>
                  <th className="px-6 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="text-sm">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{u.displayName}</p>
                          {u.isAdmin && (
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                              u.adminRank === 'Super' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              u.adminRank === 'Moderator' ? "bg-slate-50 text-slate-700 border-slate-200" :
                              "bg-orange-50 text-orange-700 border-orange-200"
                            )}>
                              {u.adminRank || 'Admin'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isBanned ? (
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold">BANNED</span>
                      ) : (
                        <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold">ACTIVE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative group">
                          <button className="btn-polish flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {isRTL ? 'پلە' : 'Rank'}
                          </button>
                          <div className={cn(
                            "absolute bottom-full mb-2 w-40 bg-white rounded-xl shadow-xl border p-1 hidden group-hover:block z-50",
                            isRTL ? "left-0" : "right-0"
                          )}>
                             <button onClick={() => handleUpdateRank(u.id, u.adminRank, 'Super')} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-amber-50 rounded-lg text-amber-700 flex items-center justify-between">
                              Super Admin <CheckCircle className={cn("w-3 h-3", u.adminRank === 'Super' ? "opacity-100" : "opacity-0")} />
                            </button>
                            <button onClick={() => handleUpdateRank(u.id, u.adminRank, 'Moderator')} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-slate-50 rounded-lg text-slate-700 flex items-center justify-between">
                              Moderator <CheckCircle className={cn("w-3 h-3", u.adminRank === 'Moderator' ? "opacity-100" : "opacity-0")} />
                            </button>
                            <button onClick={() => handleUpdateRank(u.id, u.adminRank, 'Support')} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-orange-50 rounded-lg text-orange-700 flex items-center justify-between">
                              Support <CheckCircle className={cn("w-3 h-3", u.adminRank === 'Support' ? "opacity-100" : "opacity-0")} />
                            </button>
                            <div className="border-t my-1 pt-1">
                              <button onClick={() => handleUpdateRank(u.id, u.adminRank, null)} className="w-full text-left px-3 py-2 text-[10px] font-bold hover:bg-red-50 rounded-lg text-red-600 flex items-center justify-between">
                                Remove Admin
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBanUser(u.id, u.isBanned)}
                          className={cn(
                            "btn-polish",
                            u.isBanned 
                              ? "btn-polish-primary" 
                              : "btn-polish-danger"
                          )}
                        >
                          {u.isBanned ? t('unban') : t('banUser')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Content Moderation */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldX className="w-6 h-6 text-orange-500" /> {t('activeListings')}
            </h2>
            <div className="relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400", isRTL ? "right-3" : "left-3")} />
              <input
                type="text"
                placeholder={t('searchListings')}
                className={cn(
                  "py-2 bg-gray-100 rounded-full border-none outline-none focus:ring-2 focus:ring-orange-500",
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                )}
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
            </div>
          </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredItems.slice(0, 100).map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={item.imageUrls?.[0]} className="w-12 h-12 rounded-xl bg-gray-100 object-cover border border-gray-100 shadow-sm" referrerPolicy="no-referrer" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-gray-500 font-medium">By {item.sellerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.status !== 'active' && (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md">{item.status}</span>
                    )}
                    {(item.status === 'active' || item.status === 'sold') && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-3 text-red-600 hover:bg-red-50 active:bg-red-100 transition-all rounded-xl focus:ring-2 focus:ring-red-100 outline-none"
                        title="Delete listing"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="py-20 text-center text-gray-400 font-bold">
                  {isRTL ? 'هیچ کاڵایەک نەدۆزرایەوە' : 'No items found'}
                </div>
              )}
            </div>
        </section>
      </div>

      {/* Reports Panel */}
      <section className="space-y-6 pt-8 border-t">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" /> {t('pendingReports')}
            <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{reports.length}</span>
          </h2>
        </div>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          {reports.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-400 h-12">
                   <th className="px-6">{t('reporter')}</th>
                   <th className="px-6">{t('itemLabel')}</th>
                   <th className="px-6">{t('reportReason')}</th>
                   <th className="px-6 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{report.reporterName || 'Unknown'}</p>
                      <p className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{report.reporterId?.substring(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{report.itemTitle}</p>
                      <p className="text-[10px] text-primary">{formatDate(report.timestamp)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 line-clamp-2 max-w-xs">{report.reason}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRemoveItem(report.itemId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete flagged item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Resolve report"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center space-y-3">
               <ShieldCheck className="w-12 h-12 text-green-200 mx-auto" />
               <p className="text-gray-400 font-medium">{isRTL ? 'هیچ ڕیپۆرتێکی چاوەڕێکراو نییە' : 'No pending reports'}</p>
            </div>
          )}
        </div>
      </section>
      {/* Ad Creation Modal */}
      {showAdForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg p-8 rounded-3xl border shadow-sm relative">
            <button 
              onClick={() => setShowAdForm(false)} 
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-6">{t('addNewAd')}</h2>
            
            <form onSubmit={handleAddAd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('itemTitle')}</label>
                <input 
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                  placeholder="e.g. KurdBid Premium"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('description')}</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
                  placeholder={t('itemDescription')}
                  value={adDesc}
                  onChange={(e) => setAdDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link (URL)</label>
                <input 
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                  placeholder="https://..."
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                />
              </div>

              {adMediaType === 'video' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('videoDuration')}</label>
                  <input 
                    type="number"
                    required
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
                    placeholder="e.g. 30"
                    value={adDuration}
                    onChange={(e) => setAdDuration(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('mediaPreview')}</label>
                {(adImage || adVideo) ? (
                  <div className="relative group rounded-2xl overflow-hidden border">
                    {adMediaType === 'video' ? (
                      <video 
                        src={adVideo} 
                        className="w-full h-40 object-cover bg-black" 
                        autoPlay 
                        muted 
                        playsInline
                      />
                    ) : (
                      <img src={adImage} alt="" className="w-full h-40 object-cover" />
                    )}
                    <button 
                      type="button"
                      onClick={() => { setAdImage(''); setAdVideo(''); }}
                      className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer",
                      isDragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary hover:bg-gray-50"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-700">{t('dragDropMedia')}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">Supports Image & Video</p>
                    </div>
                  </div>
                )}
                {uploading && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-primary animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> UPLOADING MEDIA...
                  </div>
                )}
              </div>

              <button 
                disabled={adSubmitting || uploading}
                className="w-full bg-primary text-black py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {adSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {t('postItem')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
