
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { AuthPage } from './components/AuthPage';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile, Profile } from './types';
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

type ViewState = 'home' | 'modules' | 'detail' | 'about' | 'auth';

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

  // Auth States
  const [profile, setProfile] = useState<Profile | null>(null);

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

  // Handle Authentication State
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data as Profile);
  };

  const handleLogin = async (username: string, pass: string) => {
    const email = `${username.toLowerCase()}@gaka.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    setCurrentView('home');
  };

  const handleSignup = async (username: string, pass: string, name: string) => {
    const email = `${username.toLowerCase()}@gaka.local`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name, username } }
    });

    if (signUpError) throw signUpError;
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          full_name: name,
          role: 'student'
        });
      if (profileError && !profileError.message.includes('duplicate')) {
        console.warn("Profile creation handled by DB or failed:", profileError);
      }
    }
    setCurrentView('home');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('home');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'modules') setCurrentView('modules');
    if (viewParam === 'about') setCurrentView('about');
    if (viewParam === 'auth') setCurrentView('auth');
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };
    const appleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(appleDevice);
    const alreadyStandalone = checkStandalone();
    const timer = setTimeout(() => {
      if (!alreadyStandalone && !sessionStorage.getItem('gaka-native-install-dismissed')) {
        setShowInstallBanner(true);
      }
    }, 4000);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!alreadyStandalone && !sessionStorage.getItem('gaka-native-install-dismissed')) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstallBanner(false);
      setDeferredPrompt(null);
    } else {
      alert("To install GAKA as a native app:\n1. Open your browser menu (⋮ or ≡)\n2. Tap 'Install App' or 'Add to Home Screen'");
    }
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
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    if (['modules', 'about', 'auth'].includes(view)) url.searchParams.set('view', view);
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

  const ResourceItem: React.FC<{ file: AcademicFile; moduleCode?: string; delay: number }> = ({ file, moduleCode, delay }) => (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-8 bg-white/40 dark:bg-[#1E1E1E]/40 backdrop-blur-md hover:bg-white/80 dark:hover:bg-[#282828]/80 border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-6 mb-6 sm:mb-0">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 ${
          file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
        }`}>
          <FileIcon className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2.5 mb-1.5">
            {moduleCode && (
              <span className="text-[10px] font-black bg-slate-100 dark:bg-black text-slate-500 dark:text-white/40 px-2.5 py-1 rounded-lg uppercase tracking-widest border dark:border-white/5">
                {moduleCode}
              </span>
            )}
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
              {file.type === 'Notes' ? 'Lecture Note' : 'Gaka Paper'}
            </span>
          </div>
          <h4 className="font-extrabold text-slate-900 dark:text-white/90 text-lg sm:text-xl leading-tight break-words pr-4 transition-colors">
            {file.title}
          </h4>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => handleShare(file.title)} className="w-12 h-12 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-black rounded-2xl transition-all active:scale-90 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20">
            <ShareIcon className="w-6 h-6" />
          </button>
          <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-[#282828] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-[#333333] hover:text-slate-800 dark:hover:text-white/90 rounded-2xl transition-all active:scale-90">
            <ViewIcon className="w-6 h-6" />
          </a>
        </div>
        <a href={file.downloadUrl} onClick={(e) => handleDownloadClick(e, file.id, file.downloadUrl)} className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-8 py-4.5 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 ${
          downloadingId === file.id ? 'bg-slate-800 dark:bg-black text-white shadow-none cursor-default' : 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-500/10 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600'
        }`}>
          {downloadingId === file.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><DownloadIcon className="w-4 h-4" /><span>Download</span></>}
        </a>
      </div>
    </div>
  );

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

  // Handle Full Page Auth separately
  if (currentView === 'auth') {
    return (
      <div className={`min-h-screen selection:bg-emerald-100 transition-colors duration-500 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
        <AuthPage 
          onLogin={handleLogin} 
          onSignup={handleSignup} 
          onBack={() => navigateTo('home')} 
          isDark={isDark}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark bg-[#050505]' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onLogoClick={() => navigateTo('home')} 
        onHomeClick={() => navigateTo('home')} 
        onDirectoryClick={() => navigateTo('modules')}
        onLoginClick={() => navigateTo('auth')}
        onLogoutClick={handleLogout}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        profile={profile}
      />
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-16 sm:px-8 transition-colors duration-500">
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] sm:text-[13px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 mb-8 sm:mb-12 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in px-1">
            <button onClick={() => navigateTo('home')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Portal</button>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-white/90 font-black">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-white/90 font-black">About System</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('modules')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Directory</button>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
                <span className="text-slate-900 dark:text-white/90 font-black">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}
        
        {error && (
          <div className="mb-12 p-8 bg-amber-500/5 dark:bg-[#1E1E1E]/50 backdrop-blur-md border border-amber-500/20 rounded-[2.5rem] text-amber-800 dark:text-amber-400 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="relative flex h-4 w-4 mr-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
              <div className="flex flex-col"><p className="font-black uppercase tracking-widest text-[11px] mb-1">System Notice</p><p className="opacity-80 text-base">{error}</p></div>
            </div>
            <button onClick={() => window.location.reload()} className="bg-white dark:bg-[#282828] px-8 py-3.5 rounded-2xl shadow-xl shadow-amber-500/5 hover:scale-105 transition-all active:scale-95 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-white/5 font-black uppercase tracking-widest text-[11px]">Retry Sync</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center pt-8 pb-20 lg:pt-32 lg:pb-40 relative">
              {/* Floating elements for visual depth */}
              <div className="absolute top-0 -left-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full hidden lg:block"></div>
              
              <div className="inline-flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-2.5 rounded-full mb-10 border border-emerald-100/50 dark:border-white/5 animate-slide-in shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">Institutional Repository</span>
              </div>
              <h2 className="text-5xl sm:text-7xl lg:text-[110px] font-black text-slate-900 dark:text-white/95 mb-10 max-w-7xl mx-auto leading-[0.95] sm:leading-[0.9] tracking-tighter break-words px-2 text-center transition-colors">
                Academic <span className="gradient-text">Efficiency</span> <br className="hidden sm:block"/> Reimagined.
              </h2>
              <p className="text-lg sm:text-2xl text-slate-500 dark:text-white/40 max-w-3xl mx-auto mb-16 font-medium leading-relaxed px-6 text-center">
                Verified lecture materials, research modules, and GAKA examination papers for MUST Computer Science.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-8 justify-center">
                <button onClick={() => navigateTo('modules')} className="group flex items-center justify-center px-12 py-6 sm:px-16 sm:py-7 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[2rem] font-black text-[13px] sm:text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 dark:hover:bg-emerald-400 hover:scale-[1.05] transition-all duration-300 active:scale-95">
                  Explore Directory <SearchIcon className="ml-4 w-6 h-6 group-hover:rotate-12 transition-transform" />
                </button>
                <button onClick={() => navigateTo('about')} className="px-12 py-6 sm:px-16 sm:py-7 bg-white/60 dark:bg-white/5 backdrop-blur-xl text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 rounded-[2rem] font-black text-[13px] sm:text-sm uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-xl active:scale-95">
                  About Project
                </button>
              </div>
            </div>

            {recentFiles.length > 0 && (
              <div className="w-full max-w-6xl mb-24 px-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative flex h-3.5 w-3.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span></div>
                    <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white/95 tracking-tighter">New Registry Entries</h3>
                  </div>
                  <button onClick={() => navigateTo('modules')} className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:translate-x-1 transition-all">View Repository</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
                   {recentFiles.map((file, idx) => {
                      const module = modules.find(m => m.id === file.moduleId);
                      return (
                        <div 
                          key={file.id} 
                          className="group bg-white/60 dark:bg-[#151515]/60 backdrop-blur-2xl p-10 sm:p-12 rounded-[3.5rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-700 hover:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] flex flex-col h-full animate-fade-in relative overflow-hidden ring-1 ring-slate-200/20 dark:ring-white/5" 
                          style={{ animationDelay: `${idx * 150}ms` }}
                        >
                           <div className="flex justify-between items-center mb-8 z-10">
                             <span className="text-[11px] font-black bg-emerald-50/80 dark:bg-black/80 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl uppercase tracking-widest border border-emerald-100/50 dark:border-white/5">{file.moduleCode}</span>
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400/60">{file.type === 'Past Paper' ? 'Gaka' : 'Notes'}</span>
                           </div>
                           <h3 className="text-2xl font-black text-slate-800 dark:text-white/95 leading-tight mb-10 line-clamp-2 min-h-[4rem] tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{file.title}</h3>
                           <button onClick={() => navigateTo('detail', module)} className="w-full py-5.5 bg-slate-50/80 dark:bg-black/80 text-slate-500 dark:text-white/30 font-black text-[12px] uppercase tracking-[0.25em] rounded-[1.5rem] hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 group-hover:shadow-2xl group-hover:shadow-emerald-500/20">
                              <span>Open Resources</span>
                              <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                           </button>
                        </div>
                      );
                   })}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-8 sm:py-16">
            <div className="bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-[40px] rounded-[3.5rem] sm:rounded-[5rem] p-10 sm:p-28 shadow-2xl border border-white dark:border-white/5 relative overflow-hidden ring-1 ring-slate-200/20 dark:ring-white/5">
               <div className="absolute top-0 right-0 w-64 h-64 sm:w-[500px] sm:h-[500px] bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full -mr-32 -mt-32 sm:-mr-64 sm:-mt-64 blur-[120px] transition-colors"></div>
               <h2 className="text-4xl sm:text-8xl font-black text-slate-900 dark:text-white/95 mb-12 sm:mb-20 leading-[0.9] tracking-tighter relative break-words">Engineering <span className="gradient-text">Excellence.</span></h2>
               <div className="space-y-16 sm:space-y-24 text-slate-600 dark:text-white/50 leading-relaxed text-lg sm:text-xl font-medium relative">
                <section>
                  <h3 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.5em] mb-8 sm:mb-10">System Objective</h3>
                  <p className="text-2xl sm:text-4xl font-extrabold text-slate-800 dark:text-white/95 tracking-tighter leading-[1.1]">GAKA bridges the digital gap between MUST students and verified learning materials.</p>
                  <p className="mt-8 sm:mt-12 text-base sm:text-lg">By deploying a high-performance repository, we eliminate the friction of fragmented resource distribution across Computer Science cohorts.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-14">
                  <div className="bg-slate-50/50 dark:bg-black/50 p-10 sm:p-14 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400/60 dark:text-white/20 mb-5">Engineering Team</h4>
                    <p className="text-slate-900 dark:text-white font-black text-2xl sm:text-3xl mb-3">Softlink Africa</p>
                    <p className="text-base sm:text-lg opacity-70">Modern architecture optimized for institutional speed.</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-500 dark:to-emerald-700 p-10 sm:p-14 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-500/20 group transform transition-transform hover:-translate-y-2 duration-500">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-100/40 mb-5">Technical Lead</h4>
                    <p className="font-black text-3xl sm:text-4xl mb-6">Cleven Samwel</p>
                    <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="inline-flex mt-4 text-[11px] font-black uppercase tracking-[0.3em] bg-white text-emerald-800 px-10 py-4.5 rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl">Connect</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 sm:mb-24 gap-12">
              <div className="space-y-4 px-1 max-w-2xl">
                <h2 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white/95 tracking-tighter">Repository</h2>
                <p className="text-slate-500 dark:text-white/30 text-lg font-medium leading-relaxed">Verified modules curated for Computer Science undergraduates at Mbeya University.</p>
              </div>
              <div className="relative w-full lg:w-[540px] group px-1">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none z-10"><SearchIcon className="w-7 h-7 text-slate-300 dark:text-white/10 group-focus-within:text-emerald-500 transition-colors" /></div>
                <input type="text" placeholder="Search module code or title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-20 pr-8 py-7 sm:py-9 bg-white dark:bg-[#121212]/80 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2.5rem] sm:rounded-[3rem] focus:ring-[16px] focus:ring-emerald-500/5 outline-none transition-all shadow-xl text-xl sm:text-2xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10 pb-32">
              {filteredModules.map((module, i) => <div key={module.id} className="animate-fade-in h-full" style={{ animationDelay: `${i * 60}ms` }}><ModuleCard module={module} onClick={() => navigateTo('detail', module)} /></div>)}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-6xl mx-auto pb-32">
            <button onClick={() => navigateTo('modules')} className="flex items-center text-slate-800 dark:text-white/40 font-black text-[13px] uppercase tracking-[0.3em] hover:text-emerald-600 dark:hover:text-emerald-400 mb-10 group transition-all">
              <BackIcon className="mr-5 w-7 h-7 group-hover:-translate-x-3 transition-transform duration-500" /> Directory Repository
            </button>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 dark:from-emerald-700 dark:to-emerald-900 p-10 sm:p-24 rounded-[4rem] text-white shadow-[0_60px_120px_-30px_rgba(5,150,105,0.2)] dark:shadow-none mb-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-[100px]"></div>
               <span className="bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-2xl text-[11px] font-black tracking-[0.3em] uppercase border border-white/10 mb-8 inline-block shadow-lg">{selectedModule.code}</span>
               <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black mb-10 leading-[0.9] tracking-tighter">{selectedModule.name}</h2>
               <p className="text-emerald-50/60 max-w-3xl font-medium text-lg sm:text-xl leading-relaxed">{selectedModule.description}</p>
            </div>
            <div className="bg-white/70 dark:bg-[#121212]/70 backdrop-blur-3xl rounded-[4rem] p-8 sm:p-20 border border-white dark:border-white/5 transition-all shadow-2xl ring-1 ring-slate-200/20 dark:ring-white/5">
              <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-8">
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Academic Assets</h3>
                <div className="flex bg-slate-100/50 dark:bg-black/50 p-2 rounded-[2rem] w-full lg:w-fit border border-slate-200 dark:border-white/5">
                  {['All', 'Notes', 'Past Paper'].map((v) => (
                    <button 
                      key={v} 
                      onClick={() => setFilterType(v as any)} 
                      className={`flex-1 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${filterType === v ? 'bg-emerald-600 text-white shadow-[0_10px_30px_-5px_rgba(5,150,105,0.4)]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
                    >
                      {v === 'Past Paper' ? 'Gaka' : v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {filteredResources.map((file, i) => (
                  <ResourceItem key={file.id} file={file} delay={i * 100} />
                ))}
                {filteredResources.length === 0 && (
                  <div className="text-center py-32 bg-slate-50/50 dark:bg-black/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileIcon className="w-10 h-10 text-slate-300 dark:text-white/10" />
                    </div>
                    <p className="text-slate-400 dark:text-white/20 text-lg font-black uppercase tracking-[0.2em]">No assets registered yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Improved Native Install Banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-[200] animate-slide-in">
          <div className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-[40px] border border-white dark:border-white/10 p-8 rounded-[3rem] shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] flex flex-col gap-8 ring-1 ring-slate-200/20 dark:ring-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-600 dark:bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-emerald-500/30">
                  G
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">GAKA Native</h4>
                  <p className="text-slate-500 dark:text-white/40 text-[13px] leading-relaxed font-medium max-w-[240px] mt-1">
                    Install GAKA on your device for instant repository access.
                  </p>
                </div>
              </div>
              <button onClick={dismissInstall} className="p-3 text-slate-300 dark:text-white/10 hover:text-slate-500 transition-colors bg-slate-100 dark:bg-white/5 rounded-2xl">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
               {isIOS ? (
                 <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-6 rounded-[1.5rem] border border-emerald-500/20">
                   <p className="text-[13px] font-black text-emerald-800 dark:text-emerald-400 text-center leading-relaxed tracking-wide">
                     Tap <span className="inline-block mx-1.5 align-middle"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span> then select <br/><span className="text-lg">"Add to Home Screen"</span>
                   </p>
                 </div>
               ) : (
                 <button 
                   onClick={handleNativeInstall} 
                   className="w-full py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[1.5rem] font-black text-[14px] uppercase tracking-[0.3em] shadow-[0_20px_50px_-10px_rgba(5,150,105,0.4)] active:scale-[0.98] transition-all hover:bg-emerald-700 hover:shadow-emerald-500/60"
                 >
                   {deferredPrompt ? 'Deploy Application' : 'Get Mobile Portal'}
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      <footer className="py-24 px-8 border-t border-slate-50 dark:border-white/5 text-center transition-colors duration-500">
         <p className="text-[10px] font-black text-slate-300 dark:text-white/10 uppercase tracking-[0.6em]">&copy; {new Date().getFullYear()} SOFTLINK AFRICA | MUST COMPUTER SCIENCE</p>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;
