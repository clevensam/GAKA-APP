import React, { useState, useCallback, useRef, useEffect } from 'react';

interface NavbarProps {
  onLogoClick?: () => void;
  onHomeClick?: () => void;
  onDirectoryClick?: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

const HangingLamp: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const threshold = 60; 
  const maxPull = 100;

  const handleStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
  };

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - startY.current;
    if (deltaY > 0) {
      const dampenedPull = Math.min(deltaY * 0.5, maxPull);
      setDragY(dampenedPull);
    } else {
      setDragY(0);
    }
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    if (dragY >= threshold) {
      onToggle();
      if ('vibrate' in navigator) navigator.vibrate(10);
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
    <div className="absolute top-full right-4 sm:right-10 z-[100] flex flex-col items-center pointer-events-none">
      <div className="w-4 h-1 bg-slate-200 dark:bg-slate-800 rounded-b-md"></div>
      <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700"></div>
      
      <div className="relative pointer-events-auto">
        <svg width="40" height="32" viewBox="0 0 50 40" fill="none" className="drop-shadow-sm">
          <path d="M5 35 L45 35 L38 5 L12 5 Z" fill={isDark ? "#121212" : "#334155"} className="transition-colors duration-500" />
          <circle cx="25" cy="36" r="6" fill={isDark ? "#333333" : "#FCD34D"} className={`transition-all duration-500 ${!isDark ? 'lamp-glow' : ''}`} />
        </svg>

        <div 
          onMouseDown={(e) => handleStart(e.clientY)}
          onTouchStart={(e) => handleStart(e.touches[0].clientY)}
          onClick={onToggle}
          className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer pointer-events-auto touch-none ${isDragging ? '' : 'transition-all duration-500 ease-out'}`}
          style={{ 
            top: '26px',
            height: `${50 + dragY}px`, 
          }}
        >
          <div className="w-[1px] bg-slate-400 dark:bg-slate-600 flex-grow"></div>
          <div className={`w-3 h-6 bg-slate-800 dark:bg-emerald-500 rounded-full shadow-lg border border-white/10 flex flex-col items-center justify-center space-y-1 transform transition-all ${isDragging ? 'scale-110' : 'hover:scale-110 active:scale-95'}`}>
             <div className="w-1 h-[1px] bg-white/40"></div>
             <div className="w-1 h-[1px] bg-white/40"></div>
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
  isDark,
  onToggleDark
}) => {
  return (
    <nav className="sticky top-0 z-50 glass px-4 py-3 sm:py-5 sm:px-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        <button 
          onClick={onLogoClick}
          className="flex items-center space-x-3 group active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-emerald-500/20 group-hover:rotate-6 transition-all">
            G
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 dark:text-white">GAKA</h1>
        </button>
        
        <div className="flex items-center space-x-6 sm:space-x-10 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <button onClick={onHomeClick} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 relative group hidden sm:block">
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
          </button>
          <button onClick={onDirectoryClick} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 relative group">
            Directory
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
          </button>
        </div>
        <HangingLamp isDark={isDark} onToggle={onToggleDark} />
      </div>
    </nav>
  );
};