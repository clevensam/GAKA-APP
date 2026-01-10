import React, { useState, useCallback, useRef, useEffect } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
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
      const constrainedY = Math.min(deltaY * 0.65, maxPull);
      setDragY(constrainedY);
    }
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    if (dragY >= threshold) {
      onToggle();
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
    <div className="absolute top-full right-4 sm:right-12 z-[100] pointer-events-none flex flex-col items-center">
      <div className="w-4 h-1 bg-slate-200 dark:bg-slate-800 rounded-b-md mb-[-1px] transition-colors"></div>
      <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 transition-colors duration-500"></div>
      
      <div className="relative pointer-events-auto">
        <svg width="42" height="34" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg transform scale-90 sm:scale-100">
          <path d="M5 35 L45 35 L38 5 L12 5 Z" fill={isDark ? "#2D3748" : "#334155"} className="transition-colors duration-500" />
          <path d="M5 35 L45 35 L43 32 L7 32 Z" fill={isDark ? "#1a202c" : "#FBBF24"} fillOpacity={isDark ? "0.4" : "0.3"} className="transition-colors duration-500" />
          <circle cx="25" cy="36" r="6" fill={isDark ? "#4A5568" : "#FCD34D"} className={`transition-all duration-500 ${!isDark ? 'lamp-glow' : 'opacity-40'}`} />
        </svg>

        <div 
          onMouseDown={(e) => handleStart(e.clientY)}
          onTouchStart={(e) => handleStart(e.touches[0].clientY)}
          className={`absolute left-1/2 -translate-x-1/2 select-none flex flex-col items-center pointer-events-auto touch-none w-14 transition-all ${isDragging ? '' : 'duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]'}`}
          style={{ 
            top: '28px', 
            height: `${60 + dragY}px`, 
            cursor: isDragging ? 'grabbing' : 'grab' 
          }}
        >
          <div className="w-[1.5px] bg-slate-400 dark:bg-slate-700 group-hover:bg-emerald-500 transition-colors flex-grow"></div>
          
          {isDragging && dragY > 20 && dragY < threshold && (
             <div className="absolute top-[40%] w-2 h-2 bg-emerald-500/40 rounded-full animate-ping"></div>
          )}

          <div 
            className={`w-4 h-8 bg-slate-900 dark:bg-emerald-600 rounded-full shadow-2xl border border-white/10 dark:border-emerald-400/20 flex flex-col items-center justify-center space-y-1.5 py-1.5 -mt-1 transform transition-transform ${isDragging ? 'scale-125 shadow-emerald-500/50 rotate-3' : 'hover:scale-110'}`}
          >
             <div className={`w-2 h-[1px] transition-colors ${dragY >= threshold ? 'bg-white' : 'bg-white/30'}`}></div>
             <div className={`w-2 h-[1px] transition-colors ${dragY >= threshold ? 'bg-white' : 'bg-white/30'}`}></div>
             <div className={`w-2 h-[1px] transition-colors ${dragY >= threshold ? 'bg-white' : 'bg-white/30'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, isDark, onToggleDark }) => {
  return (
    <nav className="sticky top-0 z-50 glass px-4 py-4 sm:py-5 sm:px-12 transition-all duration-500">
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        <button onClick={() => onNavigate('home')} className="flex items-center space-x-2.5 sm:space-x-4 hover:opacity-85 transition-all active:scale-95 text-left group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 dark:bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40 transform group-hover:rotate-6 transition-all duration-500">
            G
          </div>
          <div><h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">GAKA</h1></div>
        </button>
        
        <div className="flex items-center space-x-6 sm:space-x-12">
          <div className="flex items-center space-x-6 sm:space-x-10 text-[11px] sm:text-[13px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <button onClick={() => onNavigate('home')} className={`transition-all py-2 relative group ${currentPage === 'home' ? 'text-emerald-600 dark:text-emerald-400' : 'hover:text-emerald-600 dark:hover:text-emerald-400'}`}>
              Home
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-emerald-500 transition-all duration-500 ${currentPage === 'home' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button onClick={() => onNavigate('modules')} className={`transition-all py-2 relative group ${currentPage === 'modules' ? 'text-emerald-600 dark:text-emerald-400' : 'hover:text-emerald-600 dark:hover:text-emerald-400'}`}>
              Directory
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-emerald-500 transition-all duration-500 ${currentPage === 'modules' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
          </div>
        </div>

        <HangingLamp isDark={isDark} onToggle={onToggleDark} />
      </div>
    </nav>
  );
};