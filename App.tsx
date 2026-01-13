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
  
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // PWA & Mobile States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gaka-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Theme Sync
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gaka-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gaka-theme', 'light');
    }
  }, [isDark]);

  // PWA Setup and Platform Detection
  useEffect(() => {
    // Detect Standalone mode
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isApple);

    // Handle Android/Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isRunningStandalone) setShowInstallBanner(true);
    };

    // For iOS, we show the banner manually if not standalone
    if (isApple && !isRunningStandalone) {
      const hasDismissed = localStorage.getItem('gaka-pwa-dismissed');
      if (!hasDismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Navigation back button handling
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/modules') setCurrentView('modules');
      else if (path === '/about') setCurrentView('about');
      else if (path.startsWith('/module/')) setCurrentView('detail');
      else setCurrentView('home');
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (view: ViewState, module?: Module) => {
    if (module) setSelectedModule(module);
    setCurrentView(view);
    const path = view === 'home' ? '/' : `/${view}${module ? `/${module.id}` : ''}`;
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS doesn't have a programmatic prompt, show instructions in banner
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('gaka-pwa-dismissed', 'true');
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
        setError("Unable to retrieve registered modules.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8">
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] sm:text-[14px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide px-1">
            <button onClick={() => navigateTo('home')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</button>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-white/90 font-bold">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-white/90 font-bold">About Gaka</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('modules')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10" />
                <span className="text-slate-900 dark:text-white/90 font-bold">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center pt-8 pb-16 lg:pt-32">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-[#1E1E1E] px-4 py-2 rounded-full mb-8 border border-emerald-100/50 dark:border-white/5 animate-slide-in shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">GAKA Academic Portal</span>
              </div>
              <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 dark:text-white/90 mb-8 max-w-6xl mx-auto leading-[1.1] sm:leading-[1.05] tracking-tight text-center">
                Access <span className="gradient-text">Verified</span> <br className="hidden sm:block"/> Course Materials.
              </h2>
              <p className="text-base sm:text-2xl text-slate-500 dark:text-white/60 max-w-3xl mx-auto mb-12 font-normal leading-relaxed px-4 text-center">
                The unofficial central hub for MUST CS students. Notes, past papers, and module resources at your fingertips.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 justify-center">
                <button onClick={() => navigateTo('modules')} className="group flex items-center justify-center px-10 py-5 sm:px-16 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all active:scale-95">
                  Browse Modules <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
                <button onClick={() => navigateTo('about')} className="px-10 py-5 sm:px-16 sm:py-6 bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/5 rounded-full font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-[#282828] transition-all shadow-sm active:scale-95">
                  Learn More
                </button>
              </div>
            </div>
            
            {recentFiles.length > 0 && (
              <div className="w-full max-w-6xl mb-24 px-4">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white/90 tracking-tight">Latest Uploads</h3>
                  <button onClick={() => navigateTo('modules')} className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
                  {recentFiles.map((file, idx) => (
                    <div key={file.id} className="group bg-white dark:bg-[#1E1E1E] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                       <div className="flex items-center justify-between mb-6">
                         <span className="text-[10px] font-black bg-emerald-50 dark:bg-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter border dark:border-white/5">{file.moduleCode}</span>
                         <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-white/20">{file.type}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 dark:text-white/90 leading-[1.25] mb-8 line-clamp-2 min-h-[3rem] tracking-tight">{file.title}</h3>
                       <button onClick={() => navigateTo('detail', modules.find(m => m.id === file.moduleId))} className="w-full py-5 bg-slate-50 dark:bg-black text-slate-600 dark:text-white/40 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all">Download Resources</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-8">
              <div className="space-y-3 px-1">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white/90 tracking-tight">Modules Directory</h2>
                <p className="text-slate-500 dark:text-white/40 font-medium">Browse verified resources for each specific module.</p>
              </div>
              <div className="relative w-full lg:w-[480px] group px-1">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none"><SearchIcon className="w-6 h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" /></div>
                <input type="text" placeholder="Search course code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 sm:py-6 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm text-lg font-medium text-slate-900 dark:text-white/90" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {filteredModules.map((module, i) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ModuleCard module={module} onClick={() => navigateTo('detail', module)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <button onClick={() => navigateTo('modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold text-[13px] uppercase tracking-widest hover:text-emerald-600 mb-8 group">
              <BackIcon className="mr-3 w-6 h-6 group-hover:-translate-x-2 transition-transform" /> Back to Directory
            </button>
            
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 sm:p-20 rounded-[2.5rem] text-white shadow-2xl mb-8">
               <span className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10 mb-6 inline-block">{selectedModule.code}</span>
               <h2 className="text-3xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight">{selectedModule.name}</h2>
               <p className="text-emerald-50/70 max-w-2xl font-medium">{selectedModule.description}</p>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] p-6 sm:p-12 border border-slate-100 dark:border-white/5">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white/90">Resources</h3>
                <div className="flex bg-slate-50 dark:bg-black p-1 rounded-xl w-full sm:w-fit">
                  {['All', 'Notes', 'Past Paper'].map((v) => (
                    <button key={v} onClick={() => setFilterType(v as any)} className={`flex-1 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.map((file, i) => (
                  <div key={file.id} className="group flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 dark:bg-black/20 rounded-3xl border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/40 transition-all">
                    <div className="flex items-center space-x-5 w-full mb-4 sm:mb-0">
                      <div className="w-14 h-14 bg-white dark:bg-[#1E1E1E] rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white/90 truncate pr-4">{file.title}</h4>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{file.type} • {file.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="p-4 bg-white dark:bg-[#1E1E1E] text-slate-400 rounded-2xl hover:text-emerald-600 transition-colors"><ViewIcon className="w-5 h-5" /></a>
                      <a href={file.downloadUrl} className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:bg-emerald-700 transition-all">
                         <DownloadIcon className="w-4 h-4" /> <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="max-w-4xl mx-auto py-12 px-2">
            <h2 className="text-4xl sm:text-7xl font-extrabold text-slate-900 dark:text-white/90 mb-12 tracking-tight">Built for <span className="gradient-text">Efficiency.</span></h2>
            <div className="prose prose-lg dark:prose-invert space-y-8 text-slate-600 dark:text-white/50">
               <p className="text-xl font-medium leading-relaxed">GAKA Portal is an optimized academic repository created specifically for Computer Science students at MUST.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                  <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                    <h4 className="text-emerald-800 dark:text-emerald-400 font-black text-xl mb-4">The Objective</h4>
                    <p className="text-emerald-700 dark:text-emerald-300/60 leading-relaxed">To provide a lightning-fast, zero-friction interface for downloading verified notes and papers, bypassing university portal downtime.</p>
                  </div>
                  <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10">
                    <h4 className="text-slate-900 dark:text-white font-black text-xl mb-4">Dev Team</h4>
                    <p className="leading-relaxed">Softlink Africa — Engineering lightweight software solutions for high-performance student needs.</p>
                  </div>
               </div>
               <div className="pt-12 text-center">
                 <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Created by Cleven Samwel</p>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 px-6 border-t border-slate-100 dark:border-white/5 text-center">
         <p className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase tracking-[0.4em]">&copy; {new Date().getFullYear()} SOFTLINK AFRICA | MUST ICT</p>
      </footer>

      {/* Dynamic Installation CTA */}
      {showInstallBanner && !isStandalone && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-[100] animate-slide-in">
            <div className="bg-white dark:bg-[#1E1E1E] border border-emerald-100 dark:border-emerald-500/20 p-5 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">G</div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">GAKA Portal App</h4>
                  <p className="text-slate-500 dark:text-white/40 text-[10px]">
                    {isIOS ? "Tap Share → Add to Home Screen" : "Install for offline access"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={dismissInstall} className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Later</button>
                 {!isIOS && (
                   <button onClick={handleInstallClick} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Install</button>
                 )}
              </div>
            </div>
          </div>
        )}

      <Analytics />
    </div>
  );
};

export default App;