
import React, { useState } from 'react';
import { User, Vehicle } from '../types';

interface ProfileViewProps {
  user: User;
  vehicles: Vehicle[];
  onUpdate: (user: User) => void;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, vehicles, onUpdate, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName || user.name.split(' ')[0] || '',
    lastName: user.lastName || user.name.split(' ')[1] || '',
    mobile: user.mobile || '',
    emergencyMobile: user.emergencyMobile || '',
    avatar: user.avatar || ''
  });

  const handleSave = () => {
    onUpdate({
      ...user,
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim()
    });
    onBack();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onloadend = () => {
        setFormData({ ...formData, avatar: r.result as string });
      };
      r.readAsDataURL(f);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-32">
      <div className="px-6 py-6 bg-white dark:bg-slate-950 sticky top-0 z-40 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button onClick={onBack} className="w-12 h-12 bg-gray-50 dark:bg-slate-800 shadow-xl rounded-2xl flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic leading-none">Fleet Identity</span>
          <h2 className="font-black text-slate-900 dark:text-white text-lg uppercase italic tracking-tighter">User Profile</h2>
        </div>
        <button onClick={handleSave} className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90">
           <i className="fa-solid fa-check"></i>
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* AVATAR SECTION */}
        <div className="flex flex-col items-center py-6">
           <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl transition-transform group-hover:scale-105">
                 {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                       <i className="fa-solid fa-user-pilot text-4xl"></i>
                    </div>
                 )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer active:scale-90 border-2 border-white dark:border-slate-900">
                 <i className="fa-solid fa-camera text-xs"></i>
                 <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
           </div>
           <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Asset Pilot UID: {user.id.toUpperCase()}</p>
        </div>

        {/* DETAILS GRID */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">First Name</label>
                 <input 
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Last Name</label>
                 <input 
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Mobile Number</label>
              <input 
               type="tel"
               value={formData.mobile}
               onChange={(e) => setFormData({...formData, mobile: e.target.value})}
               placeholder="+91 XXXXX XXXXX"
               className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-red-500/60 uppercase tracking-widest ml-2 italic">Emergency Contact</label>
              <input 
               type="tel"
               value={formData.emergencyMobile}
               onChange={(e) => setFormData({...formData, emergencyMobile: e.target.value})}
               placeholder="Emergency Support Number"
               className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 border border-red-500/10 focus:ring-red-500"
              />
           </div>
        </div>

        {/* FLEET SUMMARY MINI */}
        <div className="space-y-4">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Registered Fleet Summary</h4>
           <div className="bg-slate-100 dark:bg-slate-900/60 rounded-[3rem] p-6 space-y-4">
              {vehicles.map(v => (
                 <div key={v.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                       <i className={`fa-solid ${v.icon} text-blue-600`}></i>
                       <span className="text-[11px] font-black uppercase tracking-tighter italic dark:text-white">{v.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono">{v.plateNumber}</span>
                 </div>
              ))}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">To modify fleet, use the "Fleet" tab from command center.</p>
              </div>
           </div>
        </div>

        <button 
           onClick={handleSave}
           className="w-full py-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all italic"
        >
           Update Intelligence Pack
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
