
import React from 'react';
import { ParkingSpot } from '../types';

interface HistoryViewProps {
  history: ParkingSpot[];
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onBack }) => {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col min-h-full pb-20 transition-colors">
      <div className="bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-slate-400 active:bg-gray-100 dark:active:bg-slate-800 rounded-full transition-colors">
          <i className="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <h2 className="font-bold text-gray-900 dark:text-white ml-2">Parking History</h2>
      </div>

      <div className="p-6">
        {history.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-gray-400 dark:text-slate-600">
              <i className="fa-solid fa-clock-rotate-left text-3xl"></i>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-lg">No history yet</p>
              <p className="text-gray-500 dark:text-slate-400">Your past parking spots will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((spot) => (
              <div key={spot.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center space-x-4">
                <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-700">
                  {spot.photoDatas && spot.photoDatas.length > 0 ? (
                    <img src={spot.photoDatas[0]} alt="History thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-car text-gray-300 dark:text-slate-600"></i>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(spot.parkedAt)}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[180px]">
                    {spot.note || `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`}
                  </p>
                </div>
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`, '_blank')}
                  className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center active:bg-blue-100 dark:active:bg-blue-800"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 text-center opacity-40">
        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Privacy Protected • Offline Storage</p>
      </div>
    </div>
  );
};

export default HistoryView;
