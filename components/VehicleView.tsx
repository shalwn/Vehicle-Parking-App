
import React, { useState } from 'react';
import { Vehicle } from '../types';

interface VehicleViewProps {
  vehicles: Vehicle[];
  onUpdate: (vehicles: Vehicle[]) => void;
  onBack: () => void;
}

const VehicleView: React.FC<VehicleViewProps> = ({ vehicles, onUpdate, onBack }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', // Nickname
    brand: '',
    model: '',
    plate: '',
    type: 'sedan' as Vehicle['type']
  });

  const vehicleCategories = [
    { type: 'sedan', icon: 'fa-car-side', label: 'Sedan' },
    { type: 'suv', icon: 'fa-car-on', label: 'SUV' },
    { type: 'ev', icon: 'fa-bolt', label: 'Electric' },
    { type: 'truck', icon: 'fa-truck-pickup', label: 'Truck' },
    { type: 'bike', icon: 'fa-motorcycle', label: 'Bike' }
  ];

  const handleSubmit = () => {
    if (!formData.name || !formData.plate || !formData.brand) return;
    const cat = vehicleCategories.find(c => c.type === formData.type);
    
    if (editingId) {
      const updated = vehicles.map(v => v.id === editingId ? {
        ...v,
        name: formData.name,
        brand: formData.brand,
        model: formData.model || 'Standard Unit',
        plateNumber: formData.plate.toUpperCase(),
        icon: cat?.icon || 'fa-car-side',
        type: formData.type
      } : v);
      onUpdate(updated);
      setEditingId(null);
    } else {
      const newV: Vehicle = {
        id: 'v' + Date.now(),
        name: formData.name,
        brand: formData.brand,
        model: formData.model || 'Standard Unit',
        plateNumber: formData.plate.toUpperCase(),
        icon: cat?.icon || 'fa-car-side',
        type: formData.type,
        color: '#3b82f6'
      };
      onUpdate([...vehicles, newV]);
    }
    setFormData({ name: '', brand: '', model: '', plate: '', type: 'sedan' });
  };

  const startEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setFormData({
      name: v.name,
      brand: v.brand,
      model: v.model,
      plate: v.plateNumber,
      type: v.type
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeVehicle = (id: string) => {
    if (vehicles.length <= 1) {
      alert("At least one vehicle must remain active in fleet registry.");
      return;
    }
    if (confirm("Decommission this vehicle from fleet registry?")) {
      onUpdate(vehicles.filter(v => v.id !== id));
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-32">
      <div className="px-6 py-6 bg-slate-950 sticky top-0 z-40 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <button onClick={onBack} title="Go Back" className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all border border-slate-800 has-tooltip">
          <i className="fa-solid fa-chevron-left"></i>
          <span className="tooltip absolute left-1/2 -translate-x-1/2 top-14 bg-slate-800 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest uppercase z-50 whitespace-nowrap">Command Hub</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic leading-none">Fleet HQ</span>
          <h2 className="font-black text-white text-lg uppercase italic tracking-tighter leading-none mt-1">Registry Control</h2>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="p-6 space-y-10">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 space-y-8">
           <div className="space-y-4">
             <div className="flex items-center space-x-3 px-2">
                <i className={`fa-solid ${editingId ? 'fa-pen-to-square text-emerald-500' : 'fa-plus text-blue-500'} text-xs`}></i>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">
                  {editingId ? 'Modify Fleet Asset' : 'Register New Fleet Asset'}
                </h4>
             </div>
             <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar">
                {vehicleCategories.map(cat => (
                  <button 
                    key={cat.type}
                    onClick={() => setFormData({...formData, type: cat.type as any})}
                    className={`shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-[1.5rem] border-2 transition-all ${
                      formData.type === cat.type 
                      ? 'border-blue-600 bg-blue-600/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                      : 'border-transparent bg-slate-950 text-slate-700 hover:border-slate-800'
                    }`}
                  >
                    <i className={`fa-solid ${cat.icon} text-lg mb-2`}></i>
                    <span className="text-[8px] font-black uppercase tracking-widest">{cat.label}</span>
                  </button>
                ))}
             </div>
           </div>

           <div className="space-y-4">
             <div className="relative group">
                <i className="fa-solid fa-tag absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 text-xs group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Vehicle Nickname (e.g. My Daily)"
                  title="Vehicle Nickname"
                  className="w-full pl-14 pr-6 py-5 bg-slate-950 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all border border-white/5"
                />
             </div>
             <div className="relative group">
                <i className="fa-solid fa-industry absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 text-xs group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  placeholder="Brand / Make (e.g. Toyota, Tesla)"
                  title="Brand Name"
                  className="w-full pl-14 pr-6 py-5 bg-slate-950 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-blue-600 transition-all border border-white/5"
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="relative group">
                  <i className="fa-solid fa-car-rear absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 text-xs group-focus-within:text-blue-500 transition-colors"></i>
                  <input 
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Model"
                    title="Model Name"
                    className="w-full pl-14 pr-6 py-5 bg-slate-950 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-blue-600 border border-white/5"
                  />
               </div>
               <div className="relative group">
                  <i className="fa-solid fa-id-card absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 text-xs group-focus-within:text-blue-500 transition-colors"></i>
                  <input 
                    value={formData.plate}
                    onChange={(e) => setFormData({...formData, plate: e.target.value})}
                    placeholder="Plate ID"
                    title="Plate ID"
                    className="w-full pl-14 pr-6 py-5 bg-slate-950 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-blue-600 border border-white/5 uppercase"
                  />
               </div>
             </div>
             <div className="flex space-x-3">
               <button 
                onClick={handleSubmit} 
                className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all italic border-b-4 border-blue-800 flex items-center justify-center space-x-2"
               >
                 <i className="fa-solid fa-save"></i>
                 <span>{editingId ? 'COMMIT CHANGES' : 'DEPLOY TO FLEET'}</span>
               </button>
               {editingId && (
                 <button 
                  onClick={() => { setEditingId(null); setFormData({ name: '', brand: '', model: '', plate: '', type: 'sedan' }); }}
                  className="px-6 py-5 bg-slate-800 text-slate-400 rounded-2xl font-black text-[10px] uppercase italic active:scale-95 transition-all"
                 >
                   CANCEL
                 </button>
               )}
             </div>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 ml-4">
             <i className="fa-solid fa-list-check text-slate-500 text-[10px]"></i>
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Active Fleet Ledger</h4>
          </div>
          {vehicles.map(v => (
            <div key={v.id} className="bg-slate-900 rounded-[2.5rem] p-5 shadow-xl border border-slate-800 flex items-center justify-between group transition-all hover:border-blue-500/30">
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 bg-blue-600/5 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                   <i className={`fa-solid ${v.icon} text-xl`}></i>
                </div>
                <div>
                  <h3 className="font-black text-white text-sm italic uppercase leading-none mb-1.5">{v.name}</h3>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">{v.brand} {v.model}</span>
                    <span className="mono text-[9px] text-blue-500 font-bold tracking-widest mt-1">{v.plateNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => startEdit(v)} title="Edit Registration" className="w-10 h-10 text-slate-700 hover:text-emerald-500 transition-all flex items-center justify-center">
                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                </button>
                {vehicles.length > 1 && (
                  <button onClick={() => removeVehicle(v.id)} title="Decommission Vehicle" className="w-10 h-10 text-slate-700 hover:text-rose-500 transition-all flex items-center justify-center">
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VehicleView;
