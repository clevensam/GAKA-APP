
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserIcon, LogoutIcon } from './Icons';
import { Profile } from '../types';

interface NavbarProps {
  onHomeClick?: () => void;
  onExploreClick?: () => void;
  onAboutClick?: () => void;
  onSavedClick?: () => void;
  onLogoutClick?: () => void;
  onAuthClick?: (tab: 'login' | 'signup') => void;
  isDark: boolean;
  onToggleDark: () => void;
  profile: Profile | null;
  currentView: string;
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
    <div className="absolute top-full right-0 z-[100] pointer-events-none flex flex-col items-center">
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
  onHomeClick,
  onExploreClick,
  onAboutClick,
  onSavedClick,
  onLogoutClick,
  onAuthClick,
  isDark,
  onToggleDark,
  profile,
  currentView
}) => {
  return (
    <nav className="sticky top-0 z-50 glass px-4 py-3 sm:py-5 sm:px-10 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        <div className="flex items-center space-x-2 sm:space-x-12">
          <button 
            onClick={onHomeClick}
            className="flex items-center space-x-2 sm:space-x-4 hover:opacity-80 transition-all active:scale-95 text-left group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 dark:bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-extrabold text-lg sm:text-2xl shadow-xl shadow-emerald-100 dark:shadow-emerald-900/40 transform group-hover:rotate-6 transition-transform">
              G
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">GAKA</h1>
            </div>
          </button>

          {/* Navigation Links - Beside Logo */}
          <div className="hidden md:flex items-center space-x-2">
            <button 
              onClick={onHomeClick}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl ${currentView === 'home' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-600 dark:text-white/40 dark:hover:text-emerald-400'}`}
            >
              Home
            </button>
            <button 
              onClick={onExploreClick}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl ${currentView === 'modules' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-600 dark:text-white/40 dark:hover:text-emerald-400'}`}
            >
              Explore
            </button>
            {/* Added Saved link for authenticated users */}
            {profile && (
              <button 
                onClick={onSavedClick}
                className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl ${currentView === 'saved' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-600 dark:text-white/40 dark:hover:text-emerald-400'}`}
              >
                Saved
              </button>
            )}
            <button 
              onClick={onAboutClick}
              className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl ${currentView === 'about' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-600 dark:text-white/40 dark:hover:text-emerald-400'}`}
            >
              About
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-10">
          {profile ? (
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none">
                  {profile.username}
                </span>
                <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600 dark:text-emerald-400 opacity-80 mt-1">
                  {profile.role}
                </span>
              </div>
              <button 
                onClick={onLogoutClick}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-95 border border-transparent hover:border-red-500/10"
                title="Logout"
              >
                <LogoutIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 sm:space-x-5">
              <button 
                onClick={() => onAuthClick?.('login')}
                className="hidden md:block px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => onAuthClick?.('signup')}
                className="text-[11px] font-black bg-emerald-600 dark:bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full uppercase tracking-widest shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20 active:scale-95 transition-all hover:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                Register
              </button>
            </div>
          )}
          
          <div className="relative pr-2">
            <HangingLamp isDark={isDark} onToggle={onToggleDark} />
          </div>
        </div>
      </div>
    </nav>
  );
};
