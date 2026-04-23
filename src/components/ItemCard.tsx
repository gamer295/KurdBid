import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';
import { User, Tag, AlertTriangle, Gavel } from 'lucide-react';
import ReportModal from './ReportModal';

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
  isAuction?: boolean;
  currentBid?: number;
  bidCount?: number;
}

import { useLanguage } from '../context/LanguageContext';

const ItemCard: React.FC<{ item: Item }> = ({ item }) => {
  const { isRTL } = useLanguage();
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <div className="card-polish group transition-all hover:bg-gray-50 relative">
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowReportModal(true); }}
        className="absolute top-2 ltr:right-2 rtl:left-2 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100"
        title="Report Item"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
      </button>

      <Link to={`/item/${item.id}`} className="block">
        <div className="h-[140px] bg-[#ebecf0] relative overflow-hidden flex items-center justify-center text-text-light text-[10px] uppercase tracking-widest font-bold">
          {(item.imageUrls?.[0] && item.imageUrls[0].length > 0) ? (
            <img
              src={item.imageUrls[0]}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/400/300`;
              }}
            />
          ) : (
             <img 
               src={`https://picsum.photos/seed/${item.id}/400/300`} 
               alt="" 
               className="w-full h-full object-cover" 
               referrerPolicy="no-referrer"
             />
          )}
          {item.isAuction && (
             <div className="absolute top-2 ltr:left-2 rtl:right-2 bg-primary text-black px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg animate-pulse">
               <Gavel className="w-3 h-3" />
               <span>{isRTL ? 'ڕاستەوخۆ' : 'LIVE'}</span>
             </div>
           )}
        </div>
        
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[17px] font-black text-primary tracking-tight">
              {(item.isAuction ? (item.currentBid || item.price) : item.price).toLocaleString()} {isRTL ? 'د.ع' : 'IQD'}
            </div>
            {item.isAuction && (
              <div className="text-[10px] font-bold text-text-light uppercase tracking-widest">{isRTL ? 'گرەو' : 'Bid'}</div>
            )}
          </div>
          <h3 className="text-[14px] font-semibold text-text-dark mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-[12px] text-text-light line-height-[1.4] line-clamp-2 h-[34px]">
            {item.description}
          </p>
        </div>
      </Link>
      
      <ReportModal 
        itemId={item.id} 
        itemTitle={item.title} 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </div>
  );
};

export default ItemCard;
