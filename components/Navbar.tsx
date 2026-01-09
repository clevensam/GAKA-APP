import React from 'react';

interface NavbarProps {
  onLogoClick?: () => void;
  onHomeClick?: () => void;
  onDirectoryClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onLogoClick, 
  onHomeClick, 
  onDirectoryClick 
}) => {
  return (
    <nav className="sticky top-0 z-50 glass px-4 py-4 sm:px-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button 
          onClick={onLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-all active:scale-95 text-left group"
        >
          <div className="w-11 h-11 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-emerald-100 dark:shadow-emerald-900/40 transform group-hover:rotate-6 transition-transform">
            G
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">GAKA</h1>
          </div>
        </button>
        
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-6 sm:space-x-8 text-[12px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
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
      </div>
    </nav>
  );
};