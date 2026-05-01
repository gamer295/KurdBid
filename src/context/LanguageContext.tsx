import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ku' | 'en';

interface Translations {
  [key: string]: {
    ku: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { ku: 'سەرەتا', en: 'Home' },
  mySales: { ku: 'فرۆشتنەکانم', en: 'My Sales' },
  myPurchases: { ku: 'کڕینەکانم', en: 'My Purchases' },
  messages: { ku: 'نامەکان', en: 'Messages' },
  settings: { ku: 'ڕێکخستنەکان', en: 'Settings' },
  admin: { ku: 'سەرپەرشتیار', en: 'Admin' },
  logout: { ku: 'چوونەدەرەوە', en: 'Logout' },
  
  // Home / General
  searchPlaceholder: { ku: 'گەڕان بۆ کاڵاکان...', en: 'Search items...' },
  categories: { ku: 'هاوپۆلەکان', en: 'Categories' },
  all: { ku: 'هەمووی', en: 'All' },
  users: { ku: 'بەکارهێنەران', en: 'Users' },
  electronics: { ku: 'ئەلیکترۆنیات', en: 'Electronics' },
  fashion: { ku: 'پۆشاک', en: 'Fashion' },
  homeGarden: { ku: 'ماڵ و باخچە', en: 'Home & Garden' },
  motors: { ku: 'ئۆتۆمبێل', en: 'Motors' },
  collectibles: { ku: 'کۆکراوەکان', en: 'Collectibles' },
  sports: { ku: 'وەرزش', en: 'Sports' },
  other: { ku: 'هیتر', en: 'Other' },
  latestFirst: { ku: 'نوێترینەکان', en: 'Latest First' },
  priceLowHigh: { ku: 'نرخ: کەم بۆ زۆر', en: 'Price: Low to High' },
  priceHighLow: { ku: 'نرخ: زۆر بۆ کەم', en: 'Price: High to Low' },
  noItemsFound: { ku: 'هیچ کاڵایەک نەدۆزرایەوە', en: 'No items found' },
  tryAdjustFilters: { ku: 'هەوڵبدە فلتەرەکان بگۆڕیت', en: 'Try adjusting your filters' },
  viewListings: { ku: 'بینینی کاڵاکان', en: 'View Listings' },

  // Profile / Settings
  customizeProfile: { ku: 'دەستکاری پڕۆفایل', en: 'Customize Profile' },
  managePublicInfo: { ku: 'بەڕێوەبردنی زانیارییە گشتییەکانت', en: 'Manage your public information' },
  displayName: { ku: 'ناوی نیشاندان', en: 'Display Name' },
  bio: { ku: 'دەربارە', en: 'Bio / About' },
  location: { ku: 'شوێن', en: 'Location' },
  phone: { ku: 'ژمارەی تەلەفۆن', en: 'Phone Number' },
  saveProfile: { ku: 'پاراستنی پڕۆفایل', en: 'Save Profile' },
  preferences: { ku: 'پەسەندکراوەکان', en: 'Preferences' },
  emailNotifications: { ku: 'ئاگادارکەرەوەی ئیمەیڵ', en: 'Email Notifications' },
  safetyAlerts: { ku: 'ئاگاداری سەلامەتی', en: 'Safety Alerts' },
  publicProfile: { ku: 'پڕۆفایلی گشتی', en: 'Public Profile' },
  accountSecurity: { ku: 'سەلامەتی هەژمار', en: 'Account Security' },
  phoneWarning: { 
    ku: 'ئاگاداری: ژمارەی تەلەفۆنەکەت لە هەموو کاڵاکانتدا نیشان دەدرێت. تکایە تەنها ئەگەر دڵنیایت بینووسە.', 
    en: 'Warning: Your phone number will be displayed publicly on all your listings. Only add it if you are comfortable with this.' 
  },
  
  // Item related
  price: { ku: 'نرخ', en: 'Price' },
  seller: { ku: 'فرۆشیار', en: 'Seller' },
  postedOn: { ku: 'بڵاوکراوەتەوە لە', en: 'Posted on' },
  contactSeller: { ku: 'پەیوەندی بە فرۆشیارەوە بکە', en: 'Contact Seller' },
  deleteListing: { ku: 'سڕینەوەی کاڵا', en: 'Delete Listing' },
  sold: { ku: 'فرۆشرا', en: 'Sold' },
  active: { ku: 'چالاک', en: 'Active' },
  call: { ku: 'پەیوەندی بکە', en: 'Call' },
  
  // My Sales / Postings
  mySalesTitle: { ku: 'فرۆشتنەکانم', en: 'My Sales' },
  manageListings: { ku: 'کاڵاکانت لێرە بەڕێوەببە', en: 'Manage your active listings and selling history.' },
  listNewItem: { ku: 'کاڵایەکی نوێ دابنێ', en: 'List New Item' },
  itemTitle: { ku: 'ناونیشانی کاڵا', en: 'Item Title' },
  itemDescription: { ku: 'دەربارەی کاڵا', en: 'Item Description' },
  addImageUrl: { ku: 'زیادکردنی لینکی وێنە', en: 'Add Image URL' },
  removeImage: { ku: 'لابردن', en: 'Remove' },
  postItem: { ku: 'بڵاوکرنەوەی کاڵا', en: 'Post Item' },
  posting: { ku: 'لە بڵاوکردنەوەدایە...', en: 'Posting...' },
  markSold: { ku: 'وەک فرۆشراو دیاری بکە', en: 'Mark Sold' },
  noListings: { ku: 'هێشتا هیچ کاڵایەکت دانەناوە', en: "You haven't listed anything yet" },
  editItem: { ku: 'دەستکاری کاڵا', en: 'Edit Item' },
  updateItem: { ku: 'نوێکردنەوەی کاڵا', en: 'Update Item' },
  updating: { ku: 'لە نوێکردنەوەدایە...', en: 'Updating...' },
  edit: { ku: 'دەستکاری', en: 'Edit' },
  loading: { ku: 'چاوەڕێبە...', en: 'Loading...' },
  loadingItems: { ku: 'گەڕان بۆ کاڵاکان...', en: 'Loading items...' },
  
  // My Purchases
  myPurchasesTitle: { ku: 'کڕینەکانم', en: 'My Purchases' },
  myPurchasesDesc: { ku: 'ئەو کاڵایانەی کە پرسیارت لێکردوون و دەتەوێت بیانکڕیت.', en: "Items you've inquired about and are interested in buying." },
  lastMessage: { ku: 'دوایین نامە', en: 'Last message' },
  updated: { ku: 'نوێکراوەتەوە', en: 'Updated' },
  openChat: { ku: 'کردنەوەی چات', en: 'Open Chat' },
  noPurchases: { ku: 'هێشتا هیچ کاڵایەکت نەکڕیوە', en: 'No purchase inquiries yet' },
  noPurchasesDesc: { ku: 'بۆ ئەوەی یەکەم کاڵا بکڕیت، نامە بۆ فرۆشیار بنێ ڕاستەوخۆ.', en: 'Message a seller to start your first purchase inquiry.' },
  reportItem: { ku: 'کاڵاکە ئاگاداربکەرەوە', en: 'Report Item' },
  reportReason: { ku: 'هۆکاری ئاگادارکردنەوە', en: 'Reason for report' },
  reportPlaceholder: { ku: 'بۆچی ئەم کاڵایە ئاگادار دەکەیتەوە؟ (نایاساییە، ساختەیە، ...)', en: 'Why are you reporting this? (Scam, fake, illegal...)' },
  reportSubmit: { ku: 'ناردنی ڕیپۆرت', en: 'Submit Report' },
  reportSuccess: { ku: 'سوپاس بۆ ئاگادارکردنەوەکەت. چاو بە ڕیپۆرتەکەدا دەخشێنینەوە.', en: 'Thank you for your report. We will review it soon.' },
  reports: { ku: 'ڕیپۆرتەکان', en: 'Reports' },
  pendingReports: { ku: 'ڕیپۆرتە چاوەڕێکراوەکان', en: 'Pending Reports' },
  reporter: { ku: 'ڕیپۆرتر', en: 'Reporter' },
  itemLabel: { ku: 'کاڵا', en: 'Item' },
  nameTaken: { ku: 'ئەم ناوە پێشتر گیراوە، تکایە ناوێکی تر هەڵبژێرە', en: 'This display name is already taken. Please choose another one.' },
  browseMarketplace: { ku: 'بەنێو بازاڕدا بگەڕێ', en: 'Browse Marketplace' },
  notifications: { ku: 'ئاگادارکەرەوەکان', en: 'Notifications' },
  allCaughtUp: { ku: 'هەموو نامەکان بینراون', en: 'All caught up!' },
  justNow: { ku: 'ئێستا', en: 'Just now' },
  backToItems: { ku: 'گەڕانەوە بۆ کاڵاکان', en: 'Back to items' },
  noConversations: { ku: 'هیچ گفتوگۆیەک نییە', en: 'No conversations' },
  talkToAi: { ku: 'قسەکردن لەگەڵ زیرەکی دەستکرد', en: 'Talk to AI' },
  recording: { ku: 'خەریکی تۆمارکردنە...', en: 'Recording...' },
  releaseToStop: { ku: 'دەست هەڵبگرە بۆ وەستان', en: 'Release to stop' },
  voiceMessageReady: { ku: 'پەیامێکی دەنگی ئامادەیە', en: 'Voice Message Ready' },
  clickSendToDeliver: { ku: 'کرتە لە ناردن بکە بۆ گەیاندن', en: 'Click send to deliver' },
  aiIsResponding: { ku: 'زیرەکی دەستکرد خەریکی وەڵامدانەوەیە...', en: 'AI is responding...' },
  
  // Ad Management Extra
  systemSettings: { ku: 'ڕێکخستنەکانی سیستم', en: 'System Settings' },
  adsEnabled: { ku: 'ڕێکلامەکان چالاک بکە', en: 'Enable Advertisements' },
  adList: { ku: 'لیستی ڕێکلامەکان', en: 'Ad List' },
  addNewAd: { ku: 'زیادکردنی ڕێکلامی نوێ', en: 'Add New Ad' },
  confirmDeleteAll: { ku: 'ئایا دڵنیای لە سڕینەوەی هەموو پۆستەکان؟ ئەم کارە ناگەڕێتەوە.', en: 'Are you sure you want to DELETE ALL active posts? This cannot be undone.' },
  mediaPreview: { ku: 'پێشبینینی وێنە یان ڤیدیۆ', en: 'Media Preview' },
  adPlaceholder: { ku: 'ڕێکلامەکە لێرە دادەنرێت', en: 'Your ad will appear here' },
  dragDropMedia: { ku: 'وێنە یان ڤیدیۆ لێرە دابنێ یان کرتە بکە', en: 'Drag & drop image or video here, or click to select' },
  
  // Drag and Drop
  dragAndDrop: { ku: 'وێنەکان لێرە دابنێ یان کرتە بکە بۆ هەڵبژاردن', en: 'Drag & drop images here, or click to select' },
  selectFiles: { ku: 'هەڵبژاردنی وێنە', en: 'Select Images' },
  maxFilesWarning: { ku: 'دەتوانیت زیاترین ٤ وێنە دابنێیت', en: 'You can upload up to 4 images max' },
  privacyNoticeTitle: { ku: 'تێبینییەکی گرنگ سەبارەت بە پاراستنی تایبەتمەندی', en: 'CRITICAL PRIVACY NOTICE' },
  privacyNoticeContent: { 
    ku: 'ئاگاداربە! هەر زانیارییەک لێرە دەینووسیت (وەک ژمارەی تەلەفۆن، شوێن، یان دەربارە) بۆ هەموو بەکارهێنەرانی کوردبید دەردەکەوێت. تکایە زانیاری زۆر هەستیار بڵاو مەکەرەوە.', 
    en: 'ATTENTION! Any information you provide here (phone, location, bio) will be PUBLIC to every user on KurdBid. Please do not share highly sensitive personal data.' 
  },
  
  // Admin Related
  adminTerminal: { ku: 'تێرمیناڵی سەرپەرشتیار', en: 'Admin Terminal' },
  login: { ku: 'بچۆ ژوورەوە', en: 'Login' },
  manageSecurity: { ku: 'بەڕێوەبردنی سەلامەتی کۆمەڵگە و بازاڕ', en: 'Manage community safety and marketplace integrity.' },
  userControl: { ku: 'کۆنترۆڵی بەکارهێنەر', en: 'User Control' },
  activeListings: { ku: 'کاڵا چالاکەکان', en: 'Active Listings' },
  searchUsers: { ku: 'گەڕان بۆ بەکارهێنەران...', en: 'Search users...' },
  searchListings: { ku: 'گەڕان بۆ کاڵاکان...', en: 'Search listings...' },
  deleteAllPosts: { ku: 'سڕینەوەی هەموو کاڵا چالاکەکان', en: 'DELETE ALL ACTIVE POSTS' },
  banUser: { ku: 'باندکردن', en: 'Ban User' },
  unban: { ku: 'لابردنی باند', en: 'Unban' },
  status: { ku: 'دۆخ', en: 'Status' },
  actions: { ku: 'کردارەکان', en: 'Actions' },
  // Status Labels
  bannedStatus: { ku: 'باندکراو', en: 'BANNED' },
  activeStatus: { ku: 'چالاک', en: 'ACTIVE' },
  removedStatus: { ku: 'سڕاوەتەوە', en: 'REMOVED' },
  description: { ku: 'وەسف', en: 'Description' },
  thisIsYourListing: { ku: 'ئەمە کاڵای تۆیە', en: 'This is your listing' },
  soldOrUnavailable: { ku: 'فرۆشراوە یان بەردەست نییە', en: 'Sold or Unavailable' },
  processing: { ku: 'خەریکی پڕۆسێسکردنە...', en: 'Processing...' },
  noListingsDesc: { ku: 'دەتوانیت هەر ئێستا یەکەم کاڵا دابنێیت بۆ فرۆشتن.', en: 'Start selling by listing your first item.' },
  noMessagesDesc: { ku: 'کاتێک نامە بۆ فرۆشیارێک دەنێریت، گفتوگۆکە لێرە دەردەکەوێت.', en: 'When you message a seller, the chat will appear here.' },
  chatHistory: { ku: 'مێژووی گفتوگۆکانت لەگەڵ کڕیار و فرۆشیارەکان.', en: 'Your chat history with buyers and sellers.' },
  loadingMessages: { ku: 'گەڕان بۆ نامەکان...', en: 'Loading messages...' },
  loadingPurchases: { ku: 'گەڕان بۆ کڕینەکانت...', en: 'Loading purchases...' },
  videoDuration: { ku: 'ماوەی ڤیدیۆ (چرکە)', en: 'Video Duration (seconds)' },
  seconds: { ku: 'چرکە', en: 'seconds' },
  close: { ku: 'داخستن', en: 'Close' },
  zoom: { ku: 'گەڕان بۆ گەورەکردن', en: 'Click to zoom' },
  resolveReport: { ku: 'ڕیپۆرتەکە چارەسەر بکە و لایبەرە؟', en: 'Resolve and clear this report?' },
  promoteUser: { ku: 'ئەم بەکارهێنەرە بەرز بکەرەوە بۆ پلەی ستاف؟', en: 'Promote this user to staff?' },
  removeAdmin: { ku: 'ئەم پلەیە لەم بەکارهێنەرە وەربگرەوە؟', en: 'Remove administrative privileges from this user?' },
  unbanUser: { ku: 'باندەکەی لەسەر لابەرە؟', en: 'Unban this user?' },
  banDurationPrompt: { ku: 'ماوەی باند (بۆ نموونە: ٧ ڕۆژ، هەروەهرێ، ٢٤ کاتژمێر):', en: "Ban duration (e.g. '7 days', 'Permanent', '24 hours'):" },
  noAdsYet: { ku: 'هیچ ڕێکلامێکی تایبەت زیاد نەکراوە.', en: 'No custom advertisements added yet.' },
  deleteAllConfirmation: { ku: "ئاگاداری: ئەمە هەموو کاڵا چالاکەکان دەسڕێتەوە. بنووسە 'DELETE ALL' بۆ دڵنیابوونەوە:", en: "WARNING: This will remove ALL active listings. Type 'DELETE ALL' to confirm:" },
  noActiveItems: { ku: 'هیچ کاڵایەکی چالاک نییە بۆ سڕینەوە.', en: 'No active items to delete.' },
  bulkDeleteSuccess: { ku: 'بە سەرکەوتوویی {n} کاڵا سڕانەوە.', en: 'Successfully removed {n} listings.' },
  rankUpdated: { ku: 'پلەکە بە سەرکەوتوویی نوێکرایەوە.', en: 'Administrative permissions updated.' },
  itemRemoved: { ku: 'کاڵاکە بە سەرکەوتوویی سڕایەوە', en: 'Item removed successfully' },
  errorOccurred: { ku: 'هەڵەیەک ڕوویدا', en: 'An error occurred' },
  // Login
  welcome: { ku: 'خێربێیت بۆ کوردبید', en: 'Welcome to KurdBid' },
  loginDesc: { ku: 'گەورەترین بازاڕی ئۆنلاین بۆ کڕین و فرۆشتنی کاڵاکانت لە کوردستان.', en: 'The premier marketplace for our community.' },
  termsAgreement: { ku: 'بەتەواوکردنی ئەم هەنگاوە، تۆ ڕازیت بە هەموو مەرج و یاساکانی کوردبید.', en: 'By signing in, you agree to our Terms of Service and Community Guidelines.' },
  stats: { ku: 'ئامارەکانی بازاڕ', en: 'Market Stats' },
  totalItems: { ku: 'کۆی شتومەکەکان', en: 'Total Items' },
  activeUsers: { ku: 'بەکارهێنەرە چالاکەکان', en: 'Active Users' },
  featured: { ku: 'پێشنیارکراو', en: 'Featured' },
  selectLanguage: { ku: 'زمان', en: 'Language' },

  // Auth Extras
  email: { ku: 'ئیمەیڵ', en: 'Email' },
  password: { ku: 'تێپەڕەوشە', en: 'Password' },
  signUp: { ku: 'تۆمارکردن', en: 'Sign Up' },
  loginAction: { ku: 'چوونەژوورەوە', en: 'Login' },
  dontHaveAccount: { ku: 'هەژمارت نییە؟', en: "Don't have an account?" },
  alreadyHaveAccount: { ku: 'پێشتر هەژمارت تۆمارکردووە؟', en: 'Already have an account?' },
  invalidEmail: { ku: 'ئیمەیڵەکەت نادروستە', en: 'Invalid email' },
  passwordTooShort: { ku: 'تێپەڕەوشە دەبێت لانی کەم ٦ پیت بێت', en: 'Password must be at least 6 characters' },
  forgotPassword: { ku: 'تێپەڕەوشەت بیرچووە؟', en: 'Forgot password?' },
  resetPassword: { ku: 'بەستەری گۆڕین بنێرە', en: 'Send Reset Link' },
  resetEmailSent: { ku: 'بەستەری گۆڕینی تێپەڕەوشە نێردرا، ئیمەیڵەکەت بپشکنە', en: 'Reset link sent! Check your email' },
  backToLogin: { ku: 'بگەڕەوە بۆ چوونەژوورەوە', en: 'Back to Login' },

  // Bidding System
  liveAuction: { ku: 'زیادکردنی ئاشکرا', en: 'Live Auction' },
  currentBid: { ku: 'گرەوی ئێستا', en: 'Current Bid' },
  startingPrice: { ku: 'نرخی دەستپێکردن', en: 'Starting Price' },
  bidCount: { ku: 'کۆی گرەو', en: 'Bids' },
  endsIn: { ku: 'کۆتایی دێت لە', en: 'Ends In' },
  auctionEnded: { ku: 'زیادکردنەکە تەواو بووە', en: 'Auction Ended' },
  highestBidder: { ku: 'بەرزترین گرەو', en: 'Highest Bidder' },
  placeBid: { ku: 'گرەو بکە', en: 'Place Bid' },
  minimumBidValue: { ku: 'کەمترین گرەو', en: 'Minimum Bid' },
  enterBidAmount: { ku: 'بڕی گرەو بنووسە', en: 'Enter bid amount' },
  auctionMode: { ku: 'دۆخی زیادکردن', en: 'Auction Mode' },
  usersCanBid: { ku: 'بەکارهێنەران دەتوانن گرەو بکەن', en: 'Users can place bids' },
  auctionDuration: { ku: 'ماوەی زیادکردن', en: 'Auction Duration' },
  bidTooLow: { ku: 'بڕی گرەوەکە کەمە', en: 'Bid amount is too low' },
  invalidBid: { ku: 'تکایە بڕێکی دروست بنووسە', en: 'Please enter a valid amount' },
  higherBidRequired: { ku: 'دەبێت گرەوەکەت بەرزتر بێت لە {n}', en: 'Your bid must be higher than {n}' },
  confirmBid: { ku: 'دڵنیای لەم گرەوە؟', en: 'Confirm your bid?' },
  bidSuccess: { ku: 'گرەوەکەت بە سەرکەوتوویی تومارکرا', en: 'Bid placed successfully' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('kurd-bid-lang');
    return (saved as Language) || 'ku'; // Default to Kurdish
  });

  useEffect(() => {
    localStorage.setItem('kurd-bid-lang', language);
    document.documentElement.dir = language === 'ku' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === 'ku';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
