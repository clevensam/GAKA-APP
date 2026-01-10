import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Module, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { Analytics } from '@vercel/analytics/react';

// Pages
import HomePage from './pages/Home';
import ModulesPage from './pages/Modules';
import ModuleDetailPage from './pages/ModuleDetail';
import AboutPage from './pages/About';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

const transformToDirectDownload = (url: string): string => {
  if (!url || url === '#') return '#';
  const driveRegex = /\/file\/d\/([^/]+)\/(?:view|edit)/;
  const match = url.match(driveRegex);
  if (match && match[1]) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  return url;
};

const ensureViewUrl = (url: string): string => {
  if (!url || url === '#') return '#';
  const driveRegex = /\/file\/d\/([^/]+)\/(?:view|edit|uc)/;
  const match = url.match(driveRegex);
  if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/view`;
  return url;
};

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [recentFiles, setRecentFiles] = useState<(AcademicFile & { moduleCode: string; moduleId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${LIVE_CSV_URL}&t=${Date.now()}`);
        if (!response.ok) throw new Error('Cloud registry sync failed.');
        const csvText = await response.text();
        const allRows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
        if (allRows.length < 2) throw new Error('Cloud registry is currently empty.');
        
        const headers = allRows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const colIdx = {
          code: headers.findIndex(h => h === 'module code' || h === 'code' || h.includes('module')),
          type: headers.findIndex(h => h === 'type'),
          title: headers.findIndex(h => h === 'title'),
          download: headers.findIndex(h => h === 'download url' || h === 'download link' || h === 'url'),
          view: headers.findIndex(h => h === 'view url' || h === 'preview url' || h === 'view link')
        };
        
        const moduleMap = new Map<string, Module>();
        MODULES_DATA.forEach(m => moduleMap.set(m.code.replace(/\s+/g, '').toLowerCase(), { ...m, resources: [] }));
        
        const allExtractedFiles: (AcademicFile & { moduleCode: string; moduleId: string; rowIndex: number })[] = [];
        allRows.slice(1).forEach((row, index) => {
          const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val?.trim().replace(/^"|"$/g, ''));
          const code = parts[colIdx.code] || "";
          const title = parts[colIdx.title] || "";
          if (!code || !title) return;
          
          const normalized = code.replace(/\s+/g, '').toLowerCase();
          if (!moduleMap.has(normalized)) {
            moduleMap.set(normalized, { id: `mod-${normalized}`, code: code.toUpperCase(), name: `Module ${code.toUpperCase()}`, description: 'Discovered module.', resources: [] });
          }
          
          const mod = moduleMap.get(normalized)!;
          const resource: AcademicFile = {
            id: `res-${index}`,
            title,
            type: (parts[colIdx.type] || "").toLowerCase().includes('note') ? 'Notes' : 'Past Paper',
            downloadUrl: transformToDirectDownload(parts[colIdx.download] || "#"),
            viewUrl: ensureViewUrl(parts[colIdx.view] || parts[colIdx.download] || "#")
          };
          mod.resources.unshift(resource);
          allExtractedFiles.push({ ...resource, moduleCode: mod.code, moduleId: mod.id, rowIndex: index });
        });
        
        setModules(Array.from(moduleMap.values()).filter(m => m.resources.length > 0));
        setRecentFiles(allExtractedFiles.sort((a, b) => b.rowIndex - a.rowIndex).slice(0, 3));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    if (params?.moduleId) {
      setSelectedModuleId(params.moduleId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage recentFiles={recentFiles} onNavigate={handleNavigate} />;
      case 'modules':
        return <ModulesPage modules={modules} onNavigate={handleNavigate} />;
      case 'module-detail':
        return <ModuleDetailPage modules={modules} moduleId={selectedModuleId || ''} onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      default:
        return <HomePage recentFiles={recentFiles} onNavigate={handleNavigate} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-700">
        <div className="relative">
          <div className="w-20 h-20 border-[4px] border-slate-100 dark:border-white/5 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl animate-pulse shadow-xl shadow-emerald-500/30">G</div>
          </div>
        </div>
        <p className="mt-8 text-slate-400 dark:text-white/20 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Hub</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-700 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-16 sm:px-12">
        {error && (
          <div className="mb-16 p-8 bg-amber-50/50 dark:bg-white/[0.02] border border-amber-100 dark:border-amber-900/20 rounded-[2rem] text-amber-800 dark:text-amber-400 text-sm font-bold flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <span className="text-2xl">⚠️</span>
              <p><strong>Database Sync Warning:</strong> {error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white dark:bg-white/[0.05] border dark:border-white/10 px-8 py-3 rounded-2xl shadow-sm text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform active:scale-95"
            >
              Retry Sync
            </button>
          </div>
        )}
        <div key={currentPage} className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      <footer className="bg-white dark:bg-black border-t border-slate-50 dark:border-white/[0.05] py-20 transition-colors duration-500">
        <div className="container mx-auto px-8 max-w-7xl text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start space-x-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl">G</div>
                <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">GAKA Portal</span>
              </div>
              <p className="text-slate-400 dark:text-white/30 text-xs font-medium max-w-sm mx-auto md:mx-0">
                The centralized high-performance academic repository for MUST Computer Science students. Built for speed and accessibility.
              </p>
            </div>
            <div className="text-center md:text-right space-y-2">
              <p className="text-slate-300 dark:text-white/10 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Developed by Softlink Africa</p>
              <p className="text-slate-200 dark:text-white/5 text-[10px] font-black tracking-widest">&copy; {new Date().getFullYear()} ALL RIGHTS RESERVED</p>
            </div>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;