
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { AuthPage } from './components/AuthPage';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon, PlusIcon, EditIcon, TrashIcon } from './components/Icons';
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

  // Admin CRUD States
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AcademicFile | null>(null);
  const [resourceFormData, setResourceFormData] = useState({
    title: '',
    type: 'Notes' as ResourceType,
    url: ''
  });

  const [profile, setProfile] = useState<Profile | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gaka-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const checkUser = async () => {
      const savedUserId = localStorage.getItem('gaka-session-id');
      if (savedUserId) {
        fetchProfile(savedUserId);
      }
    };
    checkUser();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('portal_users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data as Profile);
    } else {
      localStorage.removeItem('gaka-session-id');
      setProfile(null);
    }
  };

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

      // Update selected module if we are in detail view
      if (selectedModule) {
        const updatedSelected = finalModules.find(m => m.id === selectedModule.id);
        if (updatedSelected) setSelectedModule(updatedSelected);
      }

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = async (username: string, pass: string) => {
    const { data, error } = await supabase
      .from('portal_users')
      .select('*')
      .eq('username', username)
      .eq('password', pass)
      .single();

    if (error || !data) {
      throw new Error("Invalid username or password.");
    }

    setProfile(data as Profile);
    localStorage.setItem('gaka-session-id', data.id);
    setCurrentView('modules'); 
  };

  const handleSignup = async (username: string, pass: string, name: string, email: string) => {
    const { data: existing } = await supabase
      .from('portal_users')
      .select('username, email')
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();

    if (existing) {
      if (existing.username === username) throw new Error("This username is already registered.");
      if (existing.email === email) throw new Error("This email is already registered.");
    }

    const { data, error } = await supabase
      .from('portal_users')
      .insert([
        { username, password: pass, full_name: name, email, role: 'student' }
      ])
      .select()
      .single();

    if (error) throw error;

    setProfile(data as Profile);
    localStorage.setItem('gaka-session-id', data.id);
    setCurrentView('modules'); 
  };

  const handleLogout = async () => {
    localStorage.removeItem('gaka-session-id');
    setProfile(null);
    setCurrentView('home');
  };

  // --- Admin CRUD Handlers ---
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    setLoading(true);

    try {
      const resourceData = {
        title: resourceFormData.title,
        type: resourceFormData.type,
        download_url: resourceFormData.url,
        view_url: resourceFormData.url,
        module_id: selectedModule.id
      };

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([resourceData]);
        if (error) throw error;
      }

      setIsResourceModalOpen(false);
      setEditingResource(null);
      setResourceFormData({ title: '', type: 'Notes', url: '' });
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save resource.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete resource.");
    }
  };

  const openAddModal = () => {
    setEditingResource(null);
    setResourceFormData({ title: '', type: 'Notes', url: '' });
    setIsResourceModalOpen(true);
  };

  const openEditModal = (resource: AcademicFile) => {
    setEditingResource(resource);
    setResourceFormData({
      title: resource.title,
      type: resource.type,
      url: resource.viewUrl // Assume viewUrl is what they want to edit
    });
    setIsResourceModalOpen(true);
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
            {moduleCode && (
              <span className="text-[9px] font-black bg-slate-100 dark:bg-black text-slate-500 dark:text-white/40 px-2 py-0.5 rounded-md uppercase tracking-tighter border dark:border-white/5">
                {moduleCode}
              </span>
            )}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
              {file.type === 'Notes' ? 'Note' : 'Gaka'}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white/90 text-base sm:text-lg leading-tight break-words pr-4 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors">
            {file.title}
          </h4>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-2">
          {profile?.role === 'admin' ? (
             <div className="flex items-center bg-slate-50 dark:bg-black/20 rounded-2xl p-1 border dark:border-white/5 mr-2">
               <button onClick={() => openEditModal(file)} className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit Resource">
                 <EditIcon className="w-4.5 h-4.5" />
               </button>
               <button onClick={() => handleDeleteResource(file.id)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete Resource">
                 <TrashIcon className="w-4.5 h-4.5" />
               </button>
             </div>
          ) : (
            <button onClick={() => handleShare(file.title)} className="w-11 h-11 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-black rounded-full transition-all active:scale-90 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20">
              <ShareIcon className="w-5 h-5" />
            </button>
          )}
          <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-[#282828] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-[#333333] hover:text-slate-800 dark:hover:text-white/90 rounded-2xl transition-all active:scale-90">
            <ViewIcon className="w-5 h-5" />
          </a>
        </div>
        <a href={file.downloadUrl} onClick={(e) => handleDownloadClick(e, file.id, file.downloadUrl)} className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-6 py-4 sm:px-8 sm:py-4 font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-95 ${
          downloadingId === file.id ? 'bg-slate-800 dark:bg-black text-white shadow-none cursor-default' : 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-100 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600'
        }`}>
          {downloadingId === file.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><DownloadIcon className="w-4 h-4" /><span>Download</span></>}
        </a>
      </div>
    </div>
  );

  const Breadcrumb: React.FC<{ items: { label: string; view: ViewState; module?: Module }[] }> = ({ items }) => (
    <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <button 
            onClick={() => navigateTo(item.view, item.module)}
            className={`hover:text-emerald-600 transition-colors ${idx === items.length - 1 ? 'text-slate-800 dark:text-white' : ''}`}
          >
            {item.label}
          </button>
          {idx < items.length - 1 && <span>/</span>}
        </React.Fragment>
      ))}
    </div>
  );

  const [loading, setLoading] = useState(false);

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
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onHomeClick={() => navigateTo('home')} 
        onExploreClick={() => navigateTo('modules')}
        onAboutClick={() => navigateTo('about')}
        onLogoutClick={handleLogout}
        onAuthClick={(tab) => navigateTo('auth')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        profile={profile}
        currentView={currentView}
      />
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8 transition-colors duration-500">
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
               <div className="flex justify-center">
                 <button onClick={() => navigateTo('modules')} className="group flex items-center justify-center px-12 py-5 sm:px-20 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm sm:text-lg shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all duration-300 active:scale-95">
                   Explore Resources <ChevronRightIcon className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </button>
               </div>
             </div>
             
             {recentFiles.length > 0 && (
               <div className="w-full max-w-6xl mt-12 mb-12 px-4 animate-fade-in">
                 <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center space-x-3">
                     <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></div>
                     <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white/90 tracking-tight">Recent Content</h3>
                   </div>
                   <button onClick={() => navigateTo('modules')} className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">View All</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
                    {recentFiles.map((file, idx) => {
                       const module = modules.find(m => m.id === file.moduleId);
                       return (
                         <div 
                           key={file.id} 
                           className="group bg-white dark:bg-[#1E1E1E] p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl flex flex-col h-full animate-fade-in relative overflow-hidden" 
                           style={{ animationDelay: `${idx * 100}ms` }}
                         >
                            <div className="flex justify-between items-center mb-6 z-10">
                              <span className="text-[10px] font-black bg-emerald-50 dark:bg-black text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-tighter border dark:border-white/5">{file.moduleCode}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{file.type === 'Past Paper' ? 'Gaka' : 'Notes'}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white/90 leading-tight mb-8 line-clamp-2 min-h-[3rem] tracking-tight">{file.title}</h3>
                            <button onClick={() => navigateTo('detail', module)} className="w-full py-5 bg-slate-50 dark:bg-black text-slate-600 dark:text-white/40 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3">
                               <span>Browse Module</span>
                               <ChevronRightIcon className="w-4 h-4" />
                            </button>
                         </div>
                       );
                    })}
                 </div>
               </div>
             )}
           </div>
        )}

        {currentView === 'modules' && (
           <div className="animate-fade-in">
             <Breadcrumb items={[{ label: 'Home', view: 'home' }, { label: 'Modules', view: 'modules' }]} />
             <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8">
               <div className="space-y-3 px-1">
                 <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white/90 tracking-tight">Modules</h2>
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
            <Breadcrumb items={[{ label: 'Home', view: 'home' }, { label: 'Modules', view: 'modules' }, { label: selectedModule.code, view: 'detail', module: selectedModule }]} />
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => navigateTo('modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold text-[13px] uppercase tracking-widest hover:text-emerald-600 group transition-all">
                <BackIcon className="mr-3 w-5 h-5 group-hover:-translate-x-2 transition-transform" /> Back to Directory
              </button>
              {profile?.role === 'admin' && (
                <button 
                  onClick={openAddModal}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-600/20"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Upload Resource</span>
                </button>
              )}
            </div>
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
                  {['All', 'Notes', 'Past Paper'].map((v) => (
                    <button 
                      key={v} 
                      onClick={() => setFilterType(v as any)} 
                      className={`flex-1 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/80'}`}
                    >
                      {v === 'Past Paper' ? 'Gaka' : v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.map((file, i) => (
                  <ResourceItem key={file.id} file={file} delay={i * 80} />
                ))}
                {filteredResources.length === 0 && (
                  <div className="text-center py-24 bg-slate-50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                    <p className="text-slate-400 dark:text-white/20 font-medium italic">No matching resources found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-4 sm:py-12">
            <Breadcrumb items={[{ label: 'Home', view: 'home' }, { label: 'About', view: 'about' }]} />
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-24 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-50 dark:bg-emerald-400/5 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 opacity-50 transition-colors"></div>
               <h2 className="text-3xl sm:text-7xl font-extrabold text-slate-900 dark:text-white/90 mb-8 sm:mb-12 leading-tight tracking-tight relative break-words">Academic <span className="gradient-text">Efficiency.</span></h2>
               <div className="space-y-10 sm:space-y-16 text-slate-600 dark:text-white/60 leading-relaxed text-base sm:text-lg font-normal relative">
                <section>
                  <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-4 sm:mb-6">Objective</h3>
                  <p className="text-xl sm:text-3xl font-semibold text-slate-800 dark:text-white/90 tracking-tight leading-snug">GAKA bridges the gap between students and their course materials.</p>
                  <p className="mt-6 sm:mt-8">By providing a unified interface for Mbeya University of Science and Technology (MUST) resources, we ensure that focus remains on learning rather than logistics.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  <div className="bg-slate-50 dark:bg-[#282828] p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3">Dev Team</h4>
                    <p className="text-slate-900 dark:text-white font-bold text-lg sm:text-xl mb-1">Softlink Africa</p>
                    <p className="text-sm sm:text-base font-normal">Modern engineering optimized for mobile environments.</p>
                  </div>
                  <div className="bg-emerald-600 dark:bg-emerald-500 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl shadow-emerald-100 dark:shadow-emerald-900/10 group">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/60 mb-3">Lead Developer</h4>
                    <p className="font-bold text-xl sm:text-2xl mb-4">Cleven Samwel</p>
                    <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-6 py-2.5 sm:px-8 sm:py-3 rounded-full hover:bg-white/30 transition-all active:scale-95 shadow-sm">Connect</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Resource Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0F0F0F] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-white/5 animate-slide-in">
            <div className="p-8 sm:p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {editingResource ? 'Edit Resource' : 'Upload Resource'}
                </h3>
                <button onClick={() => setIsResourceModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSaveResource} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Distributed Computing - Lec 1" 
                    required 
                    value={resourceFormData.title}
                    onChange={(e) => setResourceFormData({...resourceFormData, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Type</label>
                  <select 
                    value={resourceFormData.type}
                    onChange={(e) => setResourceFormData({...resourceFormData, type: e.target.value as ResourceType})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium appearance-none"
                  >
                    <option value="Notes">Lecture Note</option>
                    <option value="Past Paper">Gaka (Past Paper)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Google Drive Link</label>
                  <input 
                    type="url" 
                    placeholder="Paste the shareable link here..." 
                    required 
                    value={resourceFormData.url}
                    onChange={(e) => setResourceFormData({...resourceFormData, url: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-black border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 dark:text-white font-medium" 
                  />
                  <p className="text-[9px] text-slate-400 ml-1 font-medium">Link should be set to "Anyone with the link can view"</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsResourceModalOpen(false)}
                    className="flex-1 py-4.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : (editingResource ? 'Update Resource' : 'Save Resource')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-[200] animate-slide-in">
          <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-3xl border border-emerald-500/20 p-6 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-emerald-500/30">
                  G
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xl">Install GAKA</h4>
                  <p className="text-slate-500 dark:text-white/40 text-[11px] leading-tight font-medium max-w-[200px]">
                    Access lecture notes and GAKA papers instantly from your home screen.
                  </p>
                </div>
              </div>
              <button onClick={dismissInstall} className="p-2 text-slate-300 dark:text-white/10 hover:text-slate-500 transition-colors">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
               {isIOS ? (
                 <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                   <p className="text-[12px] font-bold text-emerald-800 dark:text-emerald-400 text-center leading-relaxed">
                     Tap <span className="inline-block mx-1 align-middle"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span> then select <br/><b>"Add to Home Screen"</b>
                   </p>
                 </div>
               ) : (
                 <button 
                   onClick={handleNativeInstall} 
                   className="w-full py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/60"
                 >
                   {deferredPrompt ? 'Install Application' : 'Get GAKA Portal'}
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
