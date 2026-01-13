
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { Analytics } from '@vercel/analytics/react';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://tgnljtmvigschazflxis.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nXfVOz8QEqs1mT0sxx_nYw_P8fmPVmI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const transformToDirectDownload = (url: string): string => {
  if (!url || url === '#') return '#';
  const driveRegex = /\/file\/d\/([^/]+)\/(?:view|edit|uc)/;
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

type ViewState = 'home' | 'modules' | 'detail' | 'about';

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [recentFiles, setRecentFiles] = useState<(AcademicFile & { moduleCode: string; moduleId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Native App Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gaka-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Handle routing based on URL parameters (for shortcuts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'modules') setCurrentView('modules');
    if (viewParam === 'about') setCurrentView('about');
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    const appleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(appleDevice);

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone && !sessionStorage.getItem('gaka-native-install-dismissed')) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    if (appleDevice && !isStandalone && !sessionStorage.getItem('gaka-native-install-dismissed')) {
      setTimeout(() => setShowInstallBanner(true), 4000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isStandalone]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('gaka-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('gaka-theme', 'light');
    }
  }, [isDark]);

  const handleNativeInstall = async () => {
    if (isIOS) return;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('gaka-native-install-dismissed', 'true');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .order('code', { ascending: true });

        if (modulesError) throw modulesError;

        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*, modules(code)')
          .order('created_at', { ascending: false });

        if (resourcesError) throw resourcesError;

        const finalModules: Module[] = (modulesData || []).map(m => ({
          id: m.id,
          code: m.code,
          name: m.name,
          description: m.description || 'Verified academic resource module.',
          resources: (resourcesData || [])
            .filter(r => r.module_id === m.id)
            .map(r => ({
              id: r.id,
              title: r.title,
              type: r.type as ResourceType,
              downloadUrl: r.download_url ? transformToDirectDownload(r.download_url) : '#',
              viewUrl: r.view_url ? ensureViewUrl(r.view_url) : '#',
              size: '---'
            }))
        }));

        setModules(finalModules);

        const topRecent = (resourcesData || []).slice(0, 3).map(r => ({
          id: r.id,
          title: r.title,
          type: r.type as ResourceType,
          downloadUrl: transformToDirectDownload(r.download_url),
          viewUrl: ensureViewUrl(r.view_url),
          moduleCode: r.modules?.code || 'CS',
          moduleId: r.module_id
        }));
        
        setRecentFiles(topRecent);
        setError(null);
      } catch (err: any) {
        console.error("Registry Sync Failure:", err);
        setError("Unable to sync with academic registry.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const navigateTo = (view: ViewState, module?: Module) => {
    if (module) setSelectedModule(module);
    setCurrentView(view);
    // Sync the URL for clean refreshes if needed, though this is a state-based SPA
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    if (view === 'modules' || view === 'about') url.searchParams.set('view', view);
    window.history.replaceState({}, '', url.pathname + url.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return modules.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.code.toLowerCase().includes(q)
    );
  }, [modules, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType]);

  const handleShare = (resourceTitle: string) => {
    const shareMessage = `Academic Resource from *GAKA Portal*: \n\n*${resourceTitle}*\n ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, fileId: string, downloadUrl: string) => {
    if (downloadUrl === '#') { e.preventDefault(); return; }
    setDownloadingId(fileId);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="book-loader">
          <div className="book-back"></div>
          <div className="book-page"></div>
          <div className="book-page"></div>
          <div className="book-page"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onLogoClick={() => navigateTo('home')} 
        onHomeClick={() => navigateTo('home')} 
        onDirectoryClick={() => navigateTo('modules')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8 transition-colors duration-500">
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] sm:text-[14px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in px-1">
            <button onClick={() => navigateTo('home')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</button>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-white/90 font-bold">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-white/90 font-bold">About Gaka</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('modules')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
                <span className="text-slate-900 dark:text-white/90 font-bold">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}
        
        {error && (
          <div className="mb-12 p-6 bg-amber-50/50 dark:bg-[#1E1E1E] border border-amber-100 dark:border-amber-900/30 rounded-3xl text-amber-800 dark:text-amber-400 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="relative flex h-3 w-3 mr-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div className="flex flex-col"><p className="font-bold">Sync Error</p><p className="opacity-80">{error}</p></div>
            </div>
            <button onClick={() => window.location.reload()} className="bg-white dark:bg-[#282828] px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-white/5 font-semibold">Retry</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center pt-4 pb-16 lg:pt-32">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-[#1E1E1E] px-4 py-2 rounded-full mb-8 border border-emerald-100/50 dark:border-white/5 animate-slide-in shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">MUST CS Portal</span>
              </div>
              <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 dark:text-white/90 mb-8 max-w-6xl mx-auto leading-[1.1] sm:leading-[1.05] tracking-tight break-words px-2 text-center">
                Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
              </h2>
              <p className="text-base sm:text-2xl text-slate-500 dark:text-white/60 max-w-3xl mx-auto mb-12 font-normal leading-relaxed px-4 text-center">
                Verified lecture materials, modules, and past examination papers for Computer Science students.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 justify-center">
                <button onClick={() => navigateTo('modules')} className="group flex items-center justify-center px-10 py-5 sm:px-16 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all duration-300 active:scale-95">
                  Access Modules <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
                <button onClick={() => navigateTo('about')} className="px-10 py-5 sm:px-16 sm:py-6 bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/5 rounded-full font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-[#282828] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 shadow-sm active:scale-95">
                  About Gaka
                </button>
              </div>
            </div>
            
            {recentFiles.length > 0 && (
              <div className="w-full max-w-6xl mb-12 px-4 animate-fade-in">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></div>
                    <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white/90 tracking-tight">Recently Uploaded</h3>
                  </div>
                  <button onClick={() => navigateTo('modules')} className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
                   {recentFiles.map((file, idx) => (
                      <div key={file.id} className="group bg-white dark:bg-[#1E1E1E] p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl flex flex-col h-full animate-fade-in relative overflow-hidden" style={{ animationDelay: `${idx * 100}ms` }}>
                         <div className="flex justify-between items-center mb-6 z-10">
                           <span className="text-[10px] font-black bg-emerald-50 dark:bg-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter border dark:border-white/5">{file.moduleCode}</span>
                           <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{file.type}</span>
                         </div>
                         <h3 className="text-xl font-black text-slate-800 dark:text-white/90 leading-tight mb-8 line-clamp-2 min-h-[3rem] tracking-tight">{file.title}</h3>
                         <button onClick={() => navigateTo('detail', modules.find(m => m.id === file.moduleId))} className="w-full py-5 bg-slate-50 dark:bg-black text-slate-600 dark:text-white/40 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all">Open Resources</button>
                      </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
             <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8">
               <div className="space-y-3 px-1">
                 <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white/90 tracking-tight">Academic Modules</h2>
                 <p className="text-slate-500 dark:text-white/40 font-medium">Verified resources curated for MUST Computer Science.</p>
               </div>
               <div className="relative w-full lg:w-[480px] group px-1">
                 <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none"><SearchIcon className="w-6 h-6 text-slate-300 dark:text-white/20 group-focus-within:text-emerald-500 transition-colors" /></div>
                 <input type="text" placeholder="Search module code or title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-16 pr-6 py-5 sm:py-7 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-2xl sm:rounded-3xl focus:ring-8 focus:ring-emerald-50 dark:focus:ring-emerald-500/5 outline-none transition-all shadow-sm text-lg sm:text-xl font-medium text-slate-900 dark:text-white/90" />
               </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
               {filteredModules.map((module, i) => <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}><ModuleCard module={module} onClick={() => navigateTo('detail', module)} /></div>)}
             </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <button onClick={() => navigateTo('modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold text-[13px] uppercase tracking-widest hover:text-emerald-600 mb-8 group transition-all">
              <BackIcon className="mr-3 w-6 h-6 group-hover:-translate-x-2 transition-transform" /> Back to Directory
            </button>
            <div className="bg-emerald-600 dark:bg-emerald-700 p-8 sm:p-20 rounded-[2.5rem] text-white shadow-2xl mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
               <span className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10 mb-6 inline-block">{selectedModule.code}</span>
               <h2 className="text-3xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight">{selectedModule.name}</h2>
               <p className="text-emerald-50/70 max-w-2xl font-medium">{selectedModule.description}</p>
            </div>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] p-6 sm:p-12 border border-slate-100 dark:border-white/5 transition-colors">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white/90">Resources</h3>
                <div className="flex bg-slate-50 dark:bg-black p-1 rounded-xl w-full sm:w-fit border dark:border-white/5">
                  {['All', 'Notes', 'Past Paper'].map((v) => <button key={v} onClick={() => setFilterType(v as any)} className={`flex-1 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/80'}`}>{v}</button>)}
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.map((file, i) => (
                  <div key={file.id} className="group flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 dark:bg-black/20 rounded-3xl border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/40 transition-all">
                    <div className="flex items-center space-x-5 w-full mb-4 sm:mb-0">
                      <div className="w-14 h-14 bg-white dark:bg-[#1E1E1E] rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm transition-transform group-hover:scale-110"><FileIcon className="w-6 h-6" /></div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white/90">{file.title}</h4>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{file.type} • Verified</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-white dark:bg-[#1E1E1E] text-slate-400 dark:text-white/20 rounded-2xl hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm"><ViewIcon className="w-5 h-5" /></a>
                      <a href={file.downloadUrl} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all active:scale-95"><DownloadIcon className="w-4 h-4" /> <span>Download</span></a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="max-w-4xl mx-auto py-12 px-2 animate-fade-in">
             <h2 className="text-4xl sm:text-7xl font-extrabold text-slate-900 dark:text-white/90 mb-12 tracking-tight">Built for <span className="gradient-text">Academic Success.</span></h2>
             <div className="prose prose-lg dark:prose-invert space-y-12 text-slate-600 dark:text-white/60 leading-relaxed">
               <p className="text-xl sm:text-2xl font-medium tracking-tight">GAKA Portal is a specialized academic repository designed to bypass the complexity of university portals and fragmented file sharing.</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
                  <div className="p-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="text-emerald-800 dark:text-emerald-400 font-black text-xl mb-4">The Objective</h4>
                    <p className="text-emerald-700/80 dark:text-emerald-300/60 leading-relaxed text-base font-normal">Provide MUST CS students with zero-friction access to the lecture materials they need, when they need them.</p>
                  </div>
                  <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-lg transition-shadow">
                    <h4 className="text-slate-900 dark:text-white font-black text-xl mb-4">Softlink Africa</h4>
                    <p className="leading-relaxed text-base font-normal">Engineering software solutions that empower students and professionals across Africa.</p>
                  </div>
               </div>
               <div className="pt-20 text-center border-t border-slate-100 dark:border-white/5">
                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Created by Cleven Samwel</p>
               </div>
             </div>
          </div>
        )}
      </main>

      {/* Standalone Application Installation Prompter (Pinterest Style) */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[150] animate-slide-in">
          <div className="bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-2xl border border-emerald-500/10 p-6 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-emerald-500/20">
                  G
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">GAKA Portal</h4>
                  <p className="text-slate-500 dark:text-white/40 text-[11px] leading-snug">
                    Install as a standalone application for faster, offline-ready access.
                  </p>
                </div>
              </div>
              <button onClick={dismissInstall} className="p-2 text-slate-300 dark:text-white/10 hover:text-slate-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
               {isIOS ? (
                 <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10">
                   <p className="text-[12px] font-medium text-emerald-800 dark:text-emerald-400 text-center">
                     To Install: Tap <span className="inline-block mx-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span> then select <b>"Add to Home Screen"</b>
                   </p>
                 </div>
               ) : (
                 <button 
                   onClick={handleNativeInstall} 
                   className="w-full py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-700"
                 >
                   Install GAKA App
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      <footer className="py-16 px-6 border-t border-slate-50 dark:border-white/5 text-center transition-colors duration-500">
         <p className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">&copy; {new Date().getFullYear()} SOFTLINK AFRICA | MUST ICT</p>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;
