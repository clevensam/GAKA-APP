import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon, BookOpenIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { Analytics } from '@vercel/analytics/react';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";
const CACHE_KEY = 'gaka_theme_preference';

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
  
  // Theme state initialized from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gaka-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gaka-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gaka-theme', 'light');
    }
  }, [isDark]);

  const fetchDataWithRetry = async (url: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const cacheBuster = `&t=${Date.now()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`${url}${cacheBuster}`, { signal: controller.signal });
        clearTimeout(timeoutId);
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
              description: 'Registry discovered academic resource module.',
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
          allExtractedFiles.push({ ...resource, moduleCode: targetModule.code, moduleId: targetModule.id, rowIndex: index });
        });
        
        const finalModules = Array.from(moduleMap.values()).filter(m => m.resources.length > 0);
        setModules(finalModules);
        const topRecent = allExtractedFiles.sort((a, b) => b.rowIndex - a.rowIndex).slice(0, 3);
        setRecentFiles(topRecent);
        setError(null);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "Failed to sync with cloud registry.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/home' || hash === '') setCurrentView('home');
      else if (hash === '#/modules') setCurrentView('modules');
      else if (hash === '#/about') setCurrentView('about');
      else if (hash.startsWith('#/module/')) {
        const moduleId = hash.split('/').pop();
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          setSelectedModule(module);
          setCurrentView('detail');
          setFilterType('All'); 
        } else if (modules.length > 0) setCurrentView('modules');
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
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.code.toLowerCase().includes(searchQuery.toLowerCase());
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

  const ResourceItem: React.FC<{ file: AcademicFile; moduleCode?: string; delay: number }> = ({ file, moduleCode, delay }) => (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-7 bg-white dark:bg-[#1E1E1E] hover:bg-slate-50 dark:hover:bg-[#282828] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 rounded-3xl transition-all duration-500 hover:shadow-xl animate-fade-in"
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
            {moduleCode && <span className="text-[9px] font-black bg-slate-100 dark:bg-black text-slate-500 dark:text-white/40 px-2 py-0.5 rounded-md uppercase tracking-tighter border dark:border-white/5">{moduleCode}</span>}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>{file.type === 'Notes' ? 'Note' : 'Gaka'}</span>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white/90 text-base sm:text-lg leading-tight break-words pr-4 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors">{file.title}</h4>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => handleShare(file.title)} className="w-11 h-11 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-black rounded-full transition-all active:scale-90 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20"><ShareIcon className="w-5 h-5" /></button>
          <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-[#282828] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-[#333333] hover:text-slate-800 dark:hover:text-white/90 rounded-2xl transition-all active:scale-90"><ViewIcon className="w-5 h-5" /></a>
        </div>
        <a href={file.downloadUrl} className="flex-1 sm:flex-none flex items-center justify-center space-x-3 px-6 py-4 sm:px-8 sm:py-4 font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-95 bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-100 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600"><DownloadIcon className="w-4 h-4" /><span>Download</span></a>
      </div>
    </div>
  );

  const RecentFileCard: React.FC<{ file: AcademicFile & { moduleCode: string; moduleId: string }; delay: number }> = ({ file, delay }) => (
    <div 
      className="group bg-white dark:bg-[#1E1E1E] p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl flex flex-col h-full animate-fade-in relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center space-x-3">
           <div className={`w-3 h-3 rounded-full animate-pulse ${file.type === 'Notes' ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
           <span className="text-[10px] font-black bg-emerald-50 dark:bg-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter border dark:border-white/5">{file.moduleCode}</span>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-400' : 'text-teal-400'}`}>{file.type === 'Notes' ? 'Lecture Note' : 'Past Paper'}</span>
      </div>
      <div className="flex-grow relative z-10">
        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white/90 leading-[1.25] mb-8 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors tracking-tight">{file.title}</h3>
      </div>
      <button onClick={() => navigateTo(`#/module/${file.moduleId}`)} className="relative z-10 w-full py-5 bg-slate-50 dark:bg-black text-slate-600 dark:text-white/40 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-100 dark:border-white/5">
        <span>View Resources</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );

  if (isLoading && modules.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 border-[4px] border-slate-100 dark:border-white/5 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-100 dark:shadow-emerald-900/40 animate-pulse">G</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onLogoClick={() => navigateTo('#/home')} 
        onHomeClick={() => navigateTo('#/home')} 
        onDirectoryClick={() => navigateTo('#/modules')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8">
        {error && (
          <div className="mb-12 p-6 bg-amber-50/50 dark:bg-[#1E1E1E] border border-amber-100 dark:border-amber-900/30 rounded-3xl text-amber-800 dark:text-amber-400 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="relative flex h-3 w-3 mr-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div className="flex flex-col"><p className="font-bold">Registry Sync Issue</p><p className="opacity-80">{error}</p></div>
            </div>
            <button onClick={() => window.location.reload()} className="bg-white dark:bg-[#282828] px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-white/5 font-semibold">Retry</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center pt-12 pb-16 lg:pt-32">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-[#1E1E1E] px-4 py-2 rounded-full mb-8 border border-emerald-100/50 dark:border-white/5 animate-slide-in shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">CS Portal MUST</span>
              </div>
              <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 dark:text-white/90 mb-8 max-w-6xl mx-auto leading-[1.1] tracking-tight text-center">
                Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 justify-center">
                <button onClick={() => navigateTo('#/modules')} className="group flex items-center justify-center px-10 py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm shadow-2xl hover:scale-[1.03] transition-all duration-300 active:scale-95">
                  Access Modules <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
            {recentFiles.length > 0 && (
              <div className="w-full max-w-6xl mb-12 px-4 animate-fade-in">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></div>
                    <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white/90 tracking-tight">Recent Resources</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">{recentFiles.map((file, idx) => <RecentFileCard key={file.id} file={file} delay={idx * 100} />)}</div>
              </div>
            )}
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-8">
              <div className="space-y-3 px-1">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white/90 tracking-tight">Directory</h2>
                <span className="text-slate-400 dark:text-white/40 font-semibold text-sm tracking-tight">{filteredModules.length} Modules Available</span>
              </div>
              <div className="relative w-full lg:w-[480px] group px-1">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-300 dark:text-white/20 group-focus-within:text-emerald-500 transition-colors" /></div>
                <input type="text" placeholder="Search module name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-8 focus:ring-emerald-50 dark:focus:ring-emerald-500/5 outline-none transition-all shadow-sm text-lg font-medium text-slate-900 dark:text-white/90" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
              {filteredModules.map((module, i) => <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}><ModuleCard module={module} onClick={() => navigateTo(`#/module/${module.id}`)} /></div>)}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="mb-8 px-1"><button onClick={() => navigateTo('#/modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold text-[13px] uppercase tracking-widest hover:text-emerald-600 transition-all group"><BackIcon className="mr-3 w-6 h-6 group-hover:-translate-x-2 transition-transform" />Back</button></div>
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-950 p-8 sm:p-24 rounded-[2rem] text-white shadow-2xl mb-8 relative overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 mb-8 relative z-10">
                  <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.code}</span>
                  <span className="bg-black/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.resources.length} Files</span>
                </div>
                <h2 className="text-3xl sm:text-7xl font-extrabold mb-6 leading-tight tracking-tight relative z-10">{selectedModule.name}</h2>
            </div>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-6 sm:p-16 shadow-sm border border-slate-100 dark:border-white/5 transition-colors duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white/90">Resources</h3>
                <div className="flex bg-slate-100/50 dark:bg-black/40 p-1.5 rounded-2xl w-full sm:w-fit border dark:border-white/5">
                  {['All', 'Notes', 'Past Paper'].map((v) => <button key={v} onClick={() => setFilterType(v as any)} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/80'}`}>{v === 'Past Paper' ? 'Gaka' : v.toUpperCase()}</button>)}
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.map((file, i) => <ResourceItem key={file.id} file={file} delay={i * 80} />)}
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="bg-white dark:bg-black border-t border-slate-50 dark:border-white/5 py-12">
        <div className="container mx-auto px-6 max-w-7xl text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start space-x-3"><div className="w-9 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg">G</div><span className="text-lg font-extrabold text-slate-900 dark:text-white/90 uppercase">GAKA Portal</span></div>
              <p className="text-slate-400 dark:text-white/30 text-xs font-medium max-w-sm">Academic efficiency for Computer Science students.</p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-2"><h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Connect</h4><a href="https://wa.me/255685208576" className="block text-slate-600 dark:text-white/40 hover:text-emerald-600 font-medium">+255 685 208 576</a></div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-50 dark:border-white/5 text-center"><p className="text-slate-300 dark:text-white/10 text-[9px] font-bold uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} Softlink Africa | MUST ICT</p></div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;