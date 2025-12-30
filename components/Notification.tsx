
import React from 'react';

interface NotificationProps {
  reminder: { message: string, type: 'info' | 'success' } | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ reminder, onClose }) => {
  if (!reminder) return null;

  return (
    <div className="fixed top-6 left-6 right-6 z-[100] animate-bounce-in">
      <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between backdrop-blur-md ${
        reminder.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
      }`}>
        <div className="flex items-center space-x-3">
          <i className={`fa-solid ${reminder.type === 'success' ? 'fa-check-circle' : 'fa-bell'} text-xl`}></i>
          <span className="font-black text-sm uppercase tracking-wider">{reminder.message}</span>
        </div>
        <button onClick={onClose} className="opacity-50 hover:opacity-100">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <style>{`
        @keyframes bounce-in {
          0% { transform: translateY(-100%) scale(0.9); opacity: 0; }
          70% { transform: translateY(10%) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default Notification;
