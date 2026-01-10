import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChevronRightIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { transformToDirectDownload, ensureViewUrl } from './utils/drive';
import { Analytics } from '@vercel/analytics/react';

// Pages
import { Home } from './pages/Home';
import { Modules } from './pages/Modules';
import { ModuleDetail } from './pages/ModuleDetail';
import { About } from './pages/About';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [recentFiles, setRecentFiles] = useState<(AcademicFile & { moduleCode: string; moduleId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'modules' | 'detail' | 'about'>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Theme state initialized from localStorage
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gaka-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Persist theme changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gaka-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gaka-theme', 'light');
    }
  }, [isDark]);

  const fetchData = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(LIVE_CSV_URL);
      if (!response.ok) throw new Error('Registry unreachable.');
      
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
      
      if (colIdx.code === -1 || colIdx.title === -1) throw new Error('Invalid cloud registry format.');
      
      const moduleMap = new Map<string, Module>();
      MODULES_DATA.forEach(m => {
        moduleMap.set(m.code.replace(/\s+/g, '').toLowerCase(), { ...m, resources: [] });
      });
      
      const allExtractedFiles: (AcademicFile & { moduleCode: string; moduleId: string; rowIndex: number })[] = [];
      allRows.slice(1).forEach((row, index) => {
        const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val?.trim().replace(/^"|"$/g, ''));
        const moduleCode = parts[colIdx.code] || "";
        const typeStr = parts[colIdx.type] || "";
        const title = parts[colIdx.title] || "";
        const rawDownloadUrl = parts[colIdx.download] || "#";
        const rawViewUrl = colIdx.view !== -1 ? parts[colIdx.view] : rawDownloadUrl;
        
        if (!moduleCode || !title) return;
        
        const downloadUrl = transformToDirectDownload(rawDownloadUrl);
        const viewUrl = ensureViewUrl(rawViewUrl);
        const normalizedCode = moduleCode.replace(/\s+/g, '').toLowerCase();
        
        if (!moduleMap.has(normalizedCode)) {
          moduleMap.set(normalizedCode, {
            id: `dynamic-${normalizedCode}`,
            code: moduleCode.toUpperCase(),
            name: `Module ${moduleCode.toUpperCase()}`,
            description: 'Resource repository.',
            resources: []
          });
        }
        
        const targetModule = moduleMap.get(normalizedCode)!;
        const resource: AcademicFile = {
          id: `res-${index}`,
          title: title || 'Resource',
          type: (typeStr.toLowerCase().includes('note')) ? 'Notes' : 'Past Paper',
          downloadUrl: downloadUrl.startsWith('http') ? downloadUrl : '#',
          viewUrl: viewUrl.startsWith('http') ? viewUrl : '#',
          size: '---' 
        };
        targetModule.resources.unshift(resource);
        allExtractedFiles.push({ ...resource, moduleCode: targetModule.code, moduleId: targetModule.id, rowIndex: index });
      });
      
      const finalModules = Array.from(moduleMap.values()).filter(m => m.resources.length > 0);
      setModules(finalModules);
      setRecentFiles(allExtractedFiles.sort((a, b) => b.rowIndex - a.rowIndex).slice(0, 3));
      setError(null);
    } catch (err: any) {
      console.warn("Registry Sync Error:", err);
      setError("Running in offline mode. Updates unavailable.");
      setModules(MODULES_DATA.filter(m => m.resources.length > 0));
    } finally {
      const elapsedTime = Date.now() - startTime;
      const minDelay = 800;
      const remainingTime = Math.max(0, minDelay - elapsedTime);
      setTimeout(() => setIsLoading(false), remainingTime);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/modules') {
        setCurrentView('modules');
      } else if (path === '/about') {
        setCurrentView('about');
      } else if (path.startsWith('/module/')) {
        const moduleId = path.split('/').pop();
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          setSelectedModule(module);
          setCurrentView('detail');
          setFilterType('All'); 
        } else if (modules.length > 0) {
          setCurrentView('modules');
        } else {
          setCurrentView('home');
        }
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [modules]);

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [modules, searchQuery]);

  const handleShare = (resourceTitle: string) => {
    const url = window.location.href;
    const shareMessage = `Academic Resource from *GAKA Portal*: \n\n*${resourceTitle}*\n ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, fileId: string, downloadUrl: string) => {
    if (downloadUrl === '#') { e.preventDefault(); return; }
    setDownloadingId(fileId);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-[3px] border-slate-100 dark:border-white/5 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-100 dark:shadow-emerald-900/40 animate-pulse">G</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onLogoClick={() => navigateTo('/')} 
        onHomeClick={() => navigateTo('/')} 
        onDirectoryClick={() => navigateTo('/modules')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8 transition-colors duration-500">
        {/* Breadcrumbs */}
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] sm:text-[14px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in px-1">
            <button onClick={() => navigateTo('/')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</button>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-white/90 font-bold">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-white/90 font-bold">About</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('/modules')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
                <span className="text-slate-900 dark:text-white/90 font-bold">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-12 p-6 bg-amber-50/50 dark:bg-[#1E1E1E] border border-amber-100 dark:border-amber-900/30 rounded-3xl text-amber-800 dark:text-amber-400 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-4"></span>
              <div className="flex flex-col"><p className="font-bold">Registry Sync Info</p><p className="opacity-80">{error}</p></div>
            </div>
            <button onClick={() => fetchData()} className="bg-white dark:bg-[#282828] px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-white/5 font-semibold">Retry Sync</button>
          </div>
        )}

        {/* Views Rendering */}
        {currentView === 'home' && (
          <Home 
            recentFiles={recentFiles} 
            modules={modules} 
            onNavigate={navigateTo} 
          />
        )}

        {currentView === 'modules' && (
          <Modules 
            filteredModules={filteredModules}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNavigate={navigateTo}
            isLoadingData={modules.length === 0}
          />
        )}

        {currentView === 'detail' && selectedModule && (
          <ModuleDetail 
            module={selectedModule}
            filterType={filterType}
            setFilterType={setFilterType}
            downloadingId={downloadingId}
            onDownload={handleDownloadClick}
            onShare={handleShare}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'about' && (
          <About />
        )}
      </main>

      <Footer />
      <Analytics />
    </div>
  );
};

export default App;