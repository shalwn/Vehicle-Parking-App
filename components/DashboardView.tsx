
import React, { useState } from 'react';
import { Vehicle, ParkingSpot } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardViewProps {
  vehicles: Vehicle[];
  history: ParkingSpot[];
  activeSpots: Record<string, ParkingSpot>;
  onBack: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ vehicles, history, activeSpots, onBack }) => {
  const [challanResults, setChallanResults] = useState<Record<string, { status: string, details?: string, loading: boolean }>>({});
  
  const totalSpots = history.length + Object.keys(activeSpots).length;
  const activeCount = Object.keys(activeSpots).length;
  
  const avgTimeMinutes = history.length > 0 
    ? Math.floor(history.reduce((acc, s) => acc + (Date.now() - s.parkedAt), 0) / history.length / 60000 / 100) 
    : 0;

  const checkChallans = async (v: Vehicle) => {
    setChallanResults(prev => ({ ...prev, [v.id]: { status: 'Scanning...', loading: true } }));
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Check real-time traffic challans/fines status for vehicle plate number ${v.plateNumber} in India. Provide a concise status summary and links if available.`,
        config: {
          tools: [{ googleSearch: {} }]
        },
      });

      const text = response.text || "No active records found in primary digital lookup.";
      setChallanResults(prev => ({ 
        ...prev, 
        [v.id]: { status: text.includes('no challan') || text.includes('0') ? 'Clear' : 'Detected', details: text, loading: false } 
      }));
    } catch (err) {
      setChallanResults(prev => ({ ...prev, [v.id]: { status: 'Lookup Failed', details: 'Check RTO website manually.', loading: false } }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-40 px-6 py-6 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="w-12 h-12 bg-white dark:bg-slate-800 shadow-xl rounded-2xl flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all border border-slate-100 dark:border-slate-700">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Intelligence Unit</span>
          <h2 className="font-black text-slate-900 dark:text-white text-lg italic uppercase">Fleet Report</h2>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Assets</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-blue-600 italic">{vehicles.length}</span>
              <span className="text-[8px] font-bold text-slate-400">UNITS</span>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Sessions</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-green-500 italic">{activeCount}</span>
              <span className="text-[8px] font-bold text-slate-400">LIVE</span>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-green-500" style={{ width: activeCount > 0 ? '75%' : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* ASSET STATUS & CHALLAN CHECKER */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Fleet Integrity & Real-time Challans</h4>
          {vehicles.map(v => {
            const isActive = !!activeSpots[v.id];
            const challan = challanResults[v.id];
            return (
              <div key={v.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${isActive ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                      <i className={`fa-solid ${v.icon}`}></i>
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-white text-sm italic uppercase">{v.name}</h5>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{v.plateNumber}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => checkChallans(v)}
                    disabled={challan?.loading}
                    className="px-4 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {challan?.loading ? 'Syncing...' : 'Scan Challans'}
                  </button>
                </div>

                {challan && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vahan Status</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${challan.status === 'Clear' ? 'text-green-500' : 'text-orange-500'}`}>
                        {challan.status}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      {challan.details}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Parking Efficiency</h4>
              <i className="fa-solid fa-chart-line text-blue-600"></i>
           </div>
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Avg. Session Time</span>
                 <span className="text-sm font-black dark:text-white italic">{avgTimeMinutes}m</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Utilization</span>
                 <span className="text-sm font-black text-blue-600 italic">84%</span>
              </div>
              <div className="h-24 flex items-end justify-between space-x-2 pt-2">
                 {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                   <div key={i} className="flex-1 bg-blue-600/10 dark:bg-blue-600/20 rounded-t-lg relative group">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-600 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-400" 
                        style={{ height: `${h}%` }}
                      ></div>
                   </div>
                 ))}
              </div>
              <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest">7-Day Parking Frequency (Simulated)</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
