
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserIcon, LogoutIcon } from './Icons';
import { Profile } from '../types';

interface NavbarProps {
  onLogoClick?: () => void;
  onHomeClick?: () => void;
  onDirectoryClick?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  profile: Profile | null;
}

const HangingLamp: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const threshold = 70;
  const maxPull = 120;

  const handleStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
  };

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - startY.current;
    if (deltaY > 0) {
      const resistance = 0.6;
      const pull = deltaY * resistance;
      const dampenedPull = Math.min(pull, maxPull);
      setDragY(dampenedPull);
    } else {
      setDragY(0);
    }
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    if (dragY >= threshold) {
      onToggle();
      if ('vibrate' in navigator) navigator.vibrate(12);
    }
    setIsDragging(false);
    setDragY(0);
  }, [dragY, isDragging, onToggle]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        if (e.cancelable) e.preventDefault(); 
        handleMove(e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="absolute top-full right-4 z-[100] pointer-events-none flex flex-col items-center">
      <div className="w-4 h-1 bg-slate-200 dark:bg-slate-800 rounded-b-md mb-[-1px] transition-colors"></div>
      <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 transition-colors duration-500"></div>
      <div className="relative pointer-events-auto">
        <svg width="42" height="34" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md transform scale-90 sm:scale-100">
          <path d="M5 35 L45 35 L38 5 L12 5 Z" fill={isDark ? "#1A1A1A" : "#334155"} className="transition-colors duration-500" />
          <path d="M5 35 L45 35 L43 32 L7 32 Z" fill={isDark ? "#000000" : "#FBBF24"} fillOpacity={isDark ? "0.2" : "0.3"} className="transition-colors duration-500" />
          <circle cx="25" cy="36" r="6" fill={isDark ? "#333333" : "#FCD34D"} className={`transition-all duration-500 ${!isDark ? 'lamp-glow' : ''}`} />
        </svg>
        <div 
          onMouseDown={(e) => handleStart(e.clientY)}
          onTouchStart={(e) => handleStart(e.touches[0].clientY)}
          className={`absolute left-1/2 -translate-x-1/2 select-none flex flex-col items-center pointer-events-auto touch-none w-10 ${isDragging ? '' : 'transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]'}`}
          style={{ 
            top: '28px',
            height: `${60 + dragY}px`, 
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
        >
          <div className="w-[1.5px] bg-slate-400 dark:bg-slate-600 transition-colors flex-grow"></div>
          <div className={`w-3.5 h-7 bg-slate-800 dark:bg-emerald-600 rounded-full shadow-lg border border-white/10 dark:border-emerald-400/20 flex flex-col items-center justify-center space-y-1 py-1 -mt-0.5 transform transition-transform ${isDragging ? 'scale-110' : 'hover:scale-110'}`}>
             <div className={`w-1.5 h-px transition-colors ${dragY >= threshold ? 'bg-white' : 'bg-white/30'}`}></div>
             <div className={`w-1.5 h-px transition-colors ${dragY >= threshold ? 'bg-white' : 'bg-white/30'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ 
  onLogoClick, 
  onHomeClick, 
  onDirectoryClick,
  onLoginClick,
  onLogoutClick,
  isDark,
  onToggleDark,
  profile
}) => {
  return (
    <nav className="sticky top-0 z-50 glass px-4 py-3 sm:py-4 sm:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        <button 
          onClick={onLogoClick}
          className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-all active:scale-95 text-left group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-emerald-600 dark:bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-xl shadow-emerald-100 dark:shadow-emerald-900/40 transform group-hover:rotate-6 transition-transform">
            G
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">GAKA</h1>
          </div>
        </button>
        
        <div className="flex items-center space-x-3 sm:space-x-8">
          <div className="flex items-center space-x-3 sm:space-x-8 text-[10px] sm:text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <button onClick={onHomeClick} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
            </button>
            <button onClick={onDirectoryClick} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 relative group">
              Directory
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

          {profile ? (
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-bold text-slate-900 dark:text-white leading-none">{profile.full_name}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-600 dark:text-emerald-400">{profile.role}</span>
              </div>
              <button 
                onClick={onLogoutClick}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-95"
                title="Logout"
              >
                <LogoutIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="flex items-center space-x-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-bold text-[10px] sm:text-[12px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
        <HangingLamp isDark={isDark} onToggle={onToggleDark} />
      </div>
    </nav>
  );
};
