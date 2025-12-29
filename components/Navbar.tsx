
import React from 'react';
import { BookOpenIcon } from './Icons';

interface NavbarProps {
  onLogoClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLogoClick }) => {
  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-100 px-4 py-3 sm:px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button 
          onClick={onLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity active:scale-95 text-left"
        >
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <BookOpenIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">GAKA</h1>
          </div>
        </button>
        
        <div className="hidden sm:flex items-center space-x-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-emerald-600 transition-colors">Home</a>
          <a href="#/modules" className="hover:text-emerald-600 transition-colors">Modules</a>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs border border-emerald-100">UQF8 Semester I</span>
        </div>
      </div>
    </nav>
  );
};
