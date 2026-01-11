import React, { useState, useCallback } from 'react';

interface NavbarProps {
  onLogoClick?: () => void;
  onHomeClick?: () => void;
  onDirectoryClick?: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

const HangingLamp: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => {
  const [isPulling, setIsPulling] = useState(false);

  const handlePull = useCallback(() => {
    if (isPulling) return;
    setIsPulling(true);
    
    // Toggle state halfway through the pull animation for a realistic feel
    setTimeout(() => {
      onToggle();
    }, 150);

    // Reset animation state
    setTimeout(() => {
      setIsPulling(false);
    }, 400);
  }, [isPulling, onToggle]);

  return (
    <div className="absolute top-full right-6 sm:right-12 z-[100] pointer-events-none flex flex-col items-center">
      {/* Connector base from Navbar bottom */}
      <div className="w-4 h-1 bg-slate-200 dark:bg-slate-800 rounded-b-md mb-[-1px] transition-colors"></div>
      
      {/* Short Static Cord */}
      <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-700 transition-colors duration-500"></div>
      
      {/* Lamp Head */}
      <div className="relative pointer-events-auto">
        <svg width="42" height="34" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md transform scale-90 sm:scale-100">
          {/* Main Shade */}
          <path d="M5 35 L45 35 L38 5 L12 5 Z" fill={isDark ? "#1A1A1A" : "#334155"} className="transition-colors duration-500" />
          {/* Inner Glow Rim */}
          <path d="M5 35 L45 35 L43 32 L7 32 Z" fill={isDark ? "#000000" : "#FBBF24"} fillOpacity={isDark ? "0.2" : "0.3"} className="transition-colors duration-500" />
          {/* Light Bulb */}
          <circle cx="25" cy="36" r="6" fill={isDark ? "#333333" : "#FCD34D"} className={`transition-all duration-500 ${!isDark ? 'lamp-glow' : ''}`} />
        </svg>

        {/* Realistic Pull String */}
        <div 
          onClick={handlePull}
          className={`absolute left-1/2 -translate-x-1/2 cursor-pointer group active:scale-95 transition-all duration-300 ease-out flex flex-col items-center p-2`}
          style={{ 
            top: '28px',
            transform: `translateX(-50%) translateY(${isPulling ? '20px' : '0px'})`,
            transitionTimingFunction: isPulling ? 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {/* Cord */}
          <div className="w-[1px] h-12 sm:h-16 bg-slate-400 dark:bg-slate-600 group-hover:bg-emerald-500 transition-colors"></div>
          
          {/* Decorative Bead/Puller */}
          <div className="w-3 h-6 bg-slate-800 dark:bg-emerald-600 rounded-full shadow-lg border border-white/10 dark:border-emerald-400/20 flex flex-col items-center justify-center space-y-1 py-1 -mt-0.5 group-hover:scale-110 transition-transform">
             <div className="w-1.5 h-px bg-white/20"></div>
             <div className="w-1.5 h-px bg-white/20"></div>
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
    <nav className="sticky top-0 z-50 glass px-4 py-3 sm:py-4 sm:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        <button 
          onClick={onLogoClick}
          className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-all active:scale-95 text-left group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-emerald-600 dark:bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shadow-xl shadow-emerald-100 dark:shadow-emerald-900/40 transform group-hover:rotate-6 transition-transform">
            G
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">GAKA</h1>
          </div>
        </button>
        
        <div className="flex items-center space-x-4 sm:space-x-8">
          <div className="flex items-center space-x-4 sm:space-x-8 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <button 
              onClick={onHomeClick} 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
            </button>
            <button 
              onClick={onDirectoryClick} 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 relative group"
            >
              Directory
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
            </button>
          </div>
        </div>

        {/* Hanging Lamp integrated into the Navbar bottom edge */}
        <HangingLamp isDark={isDark} onToggle={onToggleDark} />
      </div>
    </nav>
  );
};