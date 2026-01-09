import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon, BookOpenIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { Analytics } from '@vercel/analytics/react';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

const transformToDirectDownload = (url: string): string => {
  if (!url || url === '#') return '#';
  const driveRegex = /\/file\/d\/([^/]+)\/(?:view|edit)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
};

const ensureViewUrl = (url: string): string => {
  if (!url || url === '#') return '#';
  const driveRegex = /\/file\/d\/([^/]+)\/(?:view|edit|uc)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/view`;
  }
  return url;
};

const HangingLamp: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => {
  const [isPulling, setIsPulling] = useState(false);

  const handlePull = () => {
    setIsPulling(true);
    onToggle();
    setTimeout(() => setIsPulling(false), 200);
  };

  return (
    <div className="fixed top-0 right-6 sm:right-12 z-[100] pointer-events-none">
      <div className="flex flex-col items-center">
        {/* Wire - Extra Short */}
        <div className="w-0.5 h-6 sm:h-10 bg-slate-400 dark:bg-slate-800 transition-colors duration-500"></div>
        
        {/* Lamp Body */}
        <div className="relative group pointer-events-auto cursor-pointer" onClick={handlePull}>
          <svg width="46" height="46" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform">
            {/* Shade */}
            <path d="M10 42 L50 42 L42 18 L18 18 Z" fill={isDark ? "#111827" : "#334155"} className="transition-colors duration-500" />
            {/* Bulb */}
            <circle cx="30" cy="46" r="7" fill={isDark ? "#1f2937" : "#fbbf24"} className={`transition-all duration-500 ${!isDark ? 'lamp-glow' : 'lamp-off'}`} />
          </svg>
          
          {/* Pull String - Extra Short Snug version */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 transition-transform duration-200 ease-out"
            style={{ 
              top: '42px',
              transform: `translateX(-50%) translateY(${isPulling ? '18px' : '0px'})`
            }}
          >
            {/* Thread */}
            <div className="w-[1.5px] h-14 sm:h-18 bg-slate-400 dark:bg-slate-700 mx-auto opacity-70"></div>
            {/* Handle */}
            <div className="w-3.5 h-7 bg-slate-700 dark:bg-slate-300 rounded-full mx-auto shadow-xl border border-white/10 dark:border-black/10 flex flex-col items-center justify-center space-y-1.5 py-1.5 active:bg-slate-900 transition-colors">
               <div className="w-2 h-px bg-white/30 dark:bg-black/20"></div>
               <div className="w-2 h-px bg-white/30 dark:bg-black/20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const fetchDataWithRetry = async (url: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const cacheBuster = `&t=${Date.now()}`;
        const response = await fetch(`${url}${cacheBuster}`);
        if (response.ok) return response;
      } catch (e) {
        if (i === retries - 1) throw e;
      }
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
    throw new Error('Sync failed after multiple attempts');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchDataWithRetry(LIVE_CSV_URL);
        
        const csvText = await response.text();
        const allRows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
        
        if (allRows.length < 2) {
          throw new Error('Cloud registry is currently empty.');
        }

        const headers = allRows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        
        const colIdx = {
          code: headers.findIndex(h => h === 'module code' || h === 'code' || h.includes('module')),
          type: headers.findIndex(h => h === 'type'),
          title: headers.findIndex(h => h === 'title'),
          download: headers.findIndex(h => h === 'download url' || h === 'download link' || h === 'url'),
          view: headers.findIndex(h => h === 'view url' || h === 'preview url' || h === 'view link')
        };

        if (colIdx.code === -1 || colIdx.title === -1) {
          throw new Error('Invalid cloud registry format. Contact support.');
        }

        const rows = allRows.slice(1); 
        const moduleMap = new Map<string, Module>();
        
        MODULES_DATA.forEach(m => {
          moduleMap.set(m.code.replace(/\s+/g, '').toLowerCase(), { ...m, resources: [] });
        });

        const allExtractedFiles: (AcademicFile & { moduleCode: string; moduleId: string; rowIndex: number })[] = [];

        rows.forEach((row, index) => {
          const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val?.trim().replace(/^"|"$/g, ''));
          const moduleCode = parts[colIdx.code] || "";
          const typeStr = parts[colIdx.type] || "";
          const title = parts[colIdx.title] || "";
          const rawDownloadUrl = parts[colIdx.download] || "#";
          const rawViewUrl = colIdx.view !== -1 ? parts[colIdx.view] : rawDownloadUrl;

          if (!moduleCode || !title) return;

          const downloadUrl = transformToDirectDownload(rawDownloadUrl);
          const viewUrl = ensureViewUrl(rawViewUrl);
          const normalizedSheetCode = moduleCode.replace(/\s+/g, '').toLowerCase();
          
          if (!moduleMap.has(normalizedSheetCode)) {
            moduleMap.set(normalizedSheetCode, {
              id: `dynamic-mod-${normalizedSheetCode}`,
              code: moduleCode.toUpperCase(),
              name: `Module ${moduleCode.toUpperCase()}`,
              description: 'Automatically discovered academic resource module.',
              resources: []
            });
          }

          const targetModule = moduleMap.get(normalizedSheetCode)!;
          const resource: AcademicFile = {
            id: `dynamic-res-${index}`,
            title: title || 'Academic Resource',
            type: (typeStr.toLowerCase().includes('note')) ? 'Notes' : 'Past Paper',
            downloadUrl: downloadUrl.startsWith('http') ? downloadUrl : '#',
            viewUrl: viewUrl.startsWith('http') ? viewUrl : '#',
            size: '---' 
          };
          
          targetModule.resources.unshift(resource);
          allExtractedFiles.push({ 
            ...resource, 
            moduleCode: targetModule.code, 
            moduleId: targetModule.id, 
            rowIndex: index 
          });
        });

        const finalModules = Array.from(moduleMap.values()).filter(m => m.resources.length > 0);
        setModules(finalModules);
        
        const topRecent = allExtractedFiles
          .sort((a, b) => b.rowIndex - a.rowIndex)
          .slice(0, 3);
        setRecentFiles(topRecent);

        setError(null);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Failed to sync with cloud registry. Check connection.");
        setModules([]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/modules') {
        setCurrentView('modules');
      } else if (hash === '#/about') {
        setCurrentView('about');
      } else if (hash.startsWith('#/module/')) {
        const moduleId = hash.split('/').pop();
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

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [modules]);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           m.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [modules, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType]);

  const handleShare = (resourceTitle: string) => {
    const url = window.location.href;
    const shareMessage = `Academic Resource from *GAKA Portal*: \n\n*${resourceTitle}*\n ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, fileId: string, downloadUrl: string) => {
    if (downloadUrl === '#') {
      e.preventDefault();
      return;
    }
    setDownloadingId(fileId);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  const ResourceItem: React.FC<{ file: AcademicFile; moduleCode?: string; delay: number }> = ({ file, moduleCode, delay }) => (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-7 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-emerald-100 dark:hover:border-emerald-700/50 rounded-3xl transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-5 mb-5 sm:mb-0">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-105 ${
          file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
        }`}>
          <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {moduleCode && (
              <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                {moduleCode}
              </span>
            )}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
              {file.type === 'Notes' ? 'Note' : 'Gaka'}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-50 text-base sm:text-lg leading-tight break-words pr-4 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 transition-colors">
            {file.title}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleShare(file.title)}
            className="w-11 h-11 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-950 rounded-full transition-all active:scale-90 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          <a 
            href={file.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white rounded-2xl transition-all active:scale-90"
          >
            <ViewIcon className="w-5 h-5" />
          </a>
        </div>
        
        <a 
          href={file.downloadUrl} 
          onClick={(e) => handleDownloadClick(e, file.id, file.downloadUrl)}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-6 py-4 sm:px-8 sm:py-4 font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-95 ${
            downloadingId === file.id 
            ? 'bg-slate-800 dark:bg-slate-950 text-white shadow-none cursor-default' 
            : 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-100 dark:shadow-emerald-900/40 hover:bg-emerald-700 dark:hover:bg-emerald-600'
          }`}
        >
          {downloadingId === file.id ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <DownloadIcon className="w-4 h-4" />
              <span>Download</span>
            </>
          )}
        </a>
      </div>
    </div>
  );

  const RecentFileCard: React.FC<{ file: AcademicFile & { moduleCode: string; moduleId: string }; delay: number }> = ({ file, delay }) => {
    const module = modules.find(m => m.id === file.moduleId);
    const moduleName = module ? module.name : file.moduleCode;

    return (
      <div 
        className="group bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-emerald-100 dark:hover:border-emerald-800 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col h-full animate-fade-in relative overflow-hidden"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-3">
             <div className={`w-3 h-3 rounded-full animate-pulse ${file.type === 'Notes' ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
             <span className="text-[10px] font-black bg-emerald-50 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter">
              {file.moduleCode}
            </span>
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-400' : 'text-teal-400'}`}>
            {file.type === 'Notes' ? 'Lecture Note' : 'Past Paper'}
          </span>
        </div>
        
        <div className="flex-grow relative z-10">
          <h4 className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-3 line-clamp-1">{moduleName}</h4>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-50 leading-[1.25] mb-8 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
            {file.title}
          </h3>
        </div>

        <button 
          onClick={() => navigateTo(`#/module/${file.moduleId}`)}
          className="relative z-10 w-full py-5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-100 dark:border-slate-800 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-900/40"
        >
          <span>View Resources</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 border-[4px] border-slate-100 dark:border-slate-900 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-100 dark:shadow-emerald-900/40 animate-pulse">G</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark' : ''}`}>
      <HangingLamp isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      
      <Navbar 
        onLogoClick={() => navigateTo('#/home')} 
        onHomeClick={() => navigateTo('#/home')}
        onDirectoryClick={() => navigateTo('#/modules')}
      />

      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8">
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] sm:text-[14px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in px-1">
            <button onClick={() => navigateTo('#/home')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</button>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-800 flex-shrink-0" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-slate-50 font-bold">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-slate-50 font-bold">About</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('#/modules')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-800 flex-shrink-0" />
                <span className="text-slate-900 dark:text-slate-50 font-bold">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}

        {error && (
          <div className="mb-12 p-6 bg-amber-50/50 dark:bg-slate-900 border border-amber-100 dark:border-amber-900/20 rounded-3xl text-amber-800 dark:text-amber-200 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="relative flex h-3 w-3 mr-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div className="flex flex-col">
                <p className="font-bold">Sync Error</p>
                <p className="opacity-80">{error}</p>
              </div>
            </div>
            <button onClick={() => window.location.reload()} className="bg-white dark:bg-slate-800 px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30 font-semibold">Retry Connection</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center pt-4 pb-16 lg:pt-32">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-slate-900 px-4 py-2 rounded-full mb-8 border border-emerald-100/50 dark:border-slate-800 animate-slide-in">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">MUST CS Portal</span>
              </div>
              
              <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 dark:text-slate-50 mb-8 max-w-6xl mx-auto leading-[1.1] sm:leading-[1.05] tracking-tight break-words px-2 text-center">
                Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
              </h2>
              
              <p className="text-base sm:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-12 font-normal leading-relaxed px-4 text-center">
                Verified lecture materials, modules, and past examination papers for Computer Science students.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 justify-center">
                <button 
                  onClick={() => navigateTo('#/modules')}
                  className="group flex items-center justify-center px-10 py-5 sm:px-16 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/40 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all duration-300 active:scale-95"
                >
                  Access Modules
                  <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
                <button 
                  onClick={() => navigateTo('#/about')}
                  className="px-10 py-5 sm:px-16 sm:py-6 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-sm dark:shadow-none active:scale-95"
                >
                  Learn More
                </button>
              </div>
            </div>

            {recentFiles.length > 0 && (
              <div className="w-full max-w-6xl mb-12 px-4 animate-fade-in">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Recently Uploaded</h3>
                  </div>
                  <button 
                    onClick={() => navigateTo('#/modules')}
                    className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
                  >
                    View All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
                  {recentFiles.map((file, idx) => (
                    <RecentFileCard key={file.id} file={file} delay={idx * 100} />
                  ))}
                </div>
              </div>
            )}
            
            <div className="w-full max-w-5xl mb-12 px-4 text-left sm:text-center mt-6 sm:mt-8">
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Our Services</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 w-full max-w-6xl px-4 pb-20">
              {[
                { title: 'Material Distribution', text: 'Seamless delivery of lecture notes and academic modules directly to your device.', icon: <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8" /> },
                { title: 'One-Tap Downloads', text: 'Accelerated file retrieval engine that bypasses secondary login prompts and redirects.', icon: <DownloadIcon className="w-6 h-6 sm:w-8 sm:h-8" /> },
                { title: 'Exam Preparation', text: 'Extensive archive of verified past examination papers (Gaka) to enhance your revision process.', icon: <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" /> }
              ].map((service, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 text-left group">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6 sm:mb-8 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">
                    {service.icon}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3 sm:mb-4 tracking-tight">{service.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal leading-relaxed">{service.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-4 sm:py-12">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-24 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-50 dark:bg-emerald-500/5 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 opacity-50 transition-colors"></div>
               <h2 className="text-3xl sm:text-7xl font-extrabold text-slate-900 dark:text-slate-50 mb-8 sm:mb-12 leading-tight tracking-tight relative break-words">Academic <span className="gradient-text">Efficiency.</span></h2>
               <div className="space-y-10 sm:space-y-16 text-slate-600 dark:text-slate-400 leading-relaxed text-base sm:text-lg font-normal relative">
                <section>
                  <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-4 sm:mb-6">Our Objective</h3>
                  <p className="text-xl sm:text-3xl font-semibold text-slate-800 dark:text-slate-50 tracking-tight leading-snug">GAKA bridges the gap between students and their course materials.</p>
                  <p className="mt-6 sm:mt-8">By providing a unified interface for Mbeya University of Science and Technology (MUST) resources, we ensure that focus remains on learning rather than logistics.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Development</h4>
                    <p className="text-slate-900 dark:text-slate-50 font-bold text-lg sm:text-xl mb-1">Softlink Africa</p>
                    <p className="text-sm sm:text-base font-normal">Modern engineering optimized for MUST mobile environments.</p>
                  </div>
                  <div className="bg-emerald-600 dark:bg-emerald-500 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl shadow-emerald-100 dark:shadow-emerald-900/40 group">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/60 mb-3">Lead Developer</h4>
                    <p className="font-bold text-xl sm:text-2xl mb-4">Cleven Sam</p>
                    <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-6 py-2.5 sm:px-8 sm:py-3 rounded-full hover:bg-white/30 transition-all active:scale-95 shadow-sm">WhatsApp Connect</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8 sm:gap-10">
              <div className="space-y-3 sm:space-y-4 px-1">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Modules</h2>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex bg-emerald-100/50 dark:bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-200/30 dark:border-slate-800 shadow-sm">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Live Feed</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-800"></div>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold text-sm sm:text-base tracking-tight">{filteredModules.length} Modules Found</span>
                </div>
              </div>
              <div className="relative w-full lg:w-[480px] group px-1">
                <div className="absolute inset-y-0 left-6 sm:left-8 flex items-center pointer-events-none">
                  <SearchIcon className="w-5 h-5 sm:w-6 h-6 text-slate-300 dark:text-slate-700 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="text" placeholder="Search course..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 sm:pl-20 pr-6 py-5 sm:py-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl focus:ring-8 focus:ring-emerald-50 dark:focus:ring-emerald-500/5 focus:border-emerald-300 dark:focus:border-emerald-500 outline-none transition-all shadow-sm hover:shadow-md text-lg sm:text-xl font-medium placeholder:text-slate-200 dark:placeholder:text-slate-800 text-slate-900 dark:text-slate-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
              {filteredModules.map((module, i) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ModuleCard module={module} onClick={() => navigateTo(`#/module/${module.id}`)} />
                </div>
              ))}
              {filteredModules.length === 0 && (
                <div className="col-span-full py-16 sm:py-24 text-center">
                  <p className="text-slate-400 dark:text-slate-700 font-medium text-base sm:text-lg italic px-4">
                    {modules.length === 0 ? "Synchronizing with cloud registry..." : "No matching modules found."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20 sm:pb-32">
            <div className="mb-8 px-1">
              <button 
                onClick={() => navigateTo('#/modules')} 
                className="flex items-center text-slate-800 dark:text-slate-200 font-bold text-[13px] sm:text-[14px] uppercase tracking-widest hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
              >
                <BackIcon className="mr-3 w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-2 transition-transform" />
                Back to Modules
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-950 p-8 sm:p-24 rounded-[2rem] sm:rounded-[3.5rem] text-white shadow-2xl shadow-emerald-100 dark:shadow-none mb-8 sm:mb-12 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8 sm:mb-10">
                  <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.code}</span>
                  <span className="bg-black/10 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.resources.length} Files</span>
                </div>
                <h2 className="text-3xl sm:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight sm:leading-[1.05] tracking-tight max-w-4xl break-words">{selectedModule.name}</h2>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-16 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 sm:mb-12">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-50">Resources</h3>
                <div className="flex bg-slate-100/50 dark:bg-slate-950 p-1.5 rounded-2xl w-full sm:w-fit animate-fade-in shadow-inner border dark:border-slate-800">
                  {['All', 'Notes', 'Past Paper'].map((v) => (
                    <button key={v} onClick={() => setFilterType(v as any)} className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg dark:shadow-emerald-900/40' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>{v === 'Past Paper' ? 'Gaka' : v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.map((file, i) => (
                  <ResourceItem key={file.id} file={file} delay={i * 80} />
                ))}
                {filteredResources.length === 0 && (
                  <div className="text-center py-16 sm:py-24 bg-slate-50/50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 px-4">
                     <p className="text-slate-400 dark:text-slate-700 font-medium text-base italic">No resources matched your filter criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-black border-t border-slate-50 dark:border-slate-900 py-12 transition-colors duration-500">
        <div className="container mx-auto px-6 sm:px-8 max-w-7xl text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <div className="w-9 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg">G</div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50 uppercase">GAKA Portal</span>
              </div>
              <p className="text-slate-400 dark:text-slate-600 text-xs sm:text-sm font-medium max-w-sm leading-relaxed mx-auto md:mx-0">Centralized academic hub for MUST Computer Science students.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-sm">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Connect</h4>
                <a href="https://wa.me/255685208576" className="block text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">+255 685 208 576</a>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Developer</h4>
                <p className="text-slate-900 dark:text-white font-bold">Cleven Sam</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-900 text-center">
            <p className="text-slate-300 dark:text-slate-800 text-[9px] font-bold uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} Softlink Africa | MUST ICT</p>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;