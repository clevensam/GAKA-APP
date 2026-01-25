
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
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Sync theme with localStorage and document body
  useEffect(() => {
    localStorage.setItem('gaka-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // PWA Logic: Detect standalone, iOS, and handle install prompt
  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!isStandaloneMode);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner if not standalone and not dismissed in this session
      if (!isStandaloneMode && !sessionStorage.getItem('gaka-install-dismissed')) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, manual banner logic
    if (isIOSDevice && !isStandaloneMode && !sessionStorage.getItem('gaka-install-dismissed')) {
      setShowInstallBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const dismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('gaka-install-dismissed', 'true');
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

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
    setIsProcessing(true);

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
      setIsProcessing(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource permanentely?")) return;
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
      url: resource.viewUrl 
    });
    setIsResourceModalOpen(true);
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
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-9 bg-white dark:bg-[#1E1E1E] hover:bg-slate-50 dark:hover:bg-[#222] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-6 mb-6 sm:mb-0">
        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-105 shadow-sm ${
          file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
        }`}>
          <FileIcon className="w-7 h-7 sm:w-10 sm:h-10" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2.5 mb-1.5">
            {moduleCode && (
              <span className="text-[10px] font-black bg-slate-100 dark:bg-black text-slate-500 dark:text-white/40 px-3 py-1 rounded-lg uppercase tracking-tighter border dark:border-white/5">
                {moduleCode}
              </span>
            )}
            <span className={`text-[10px] font-black uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
              {file.type === 'Notes' ? 'Note' : 'Gaka'}
            </span>
          </div>
          <h4 className="font-black text-slate-800 dark:text-white/95 text-lg sm:text-2xl leading-tight break-words pr-4 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors tracking-tight">
            {file.title}
          </h4>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <div className="flex items-center gap-3">
          {profile?.role === 'admin' ? (
             <div className="flex items-center bg-slate-100 dark:bg-black/40 rounded-2xl p-1.5 border dark:border-white/10 shadow-sm">
               <button onClick={() => openEditModal(file)} className="p-3 text-slate-500 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-90" title="Edit Resource">
                 <EditIcon className="w-5 h-5" />
               </button>
               <div className="w-px h-6 bg-slate-200 dark:bg-white/5 mx-1"></div>
               <button onClick={() => handleDeleteResource(file.id)} className="p-3 text-slate-500 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-90" title="Delete Resource">
                 <TrashIcon className="w-5 h-5" />
               </button>
             </div>
          ) : (
            <button onClick={() => handleShare(file.title)} className="w-12 h-12 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-black rounded-full transition-all active:scale-90 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20 shadow-sm">
              <ShareIcon className="w-6 h-6" />
            </button>
          )}
          <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-[#282828] text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-[#333] hover:text-slate-800 dark:hover:text-white rounded-2xl transition-all active:scale-90 shadow-sm">
            <ViewIcon className="w-6 h-6" />
          </a>
        </div>
        <a href={file.downloadUrl} onClick={(e) => handleDownloadClick(e, file.id, file.downloadUrl)} className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-8 py-5 sm:px-10 sm:py-5 font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95 ${
          downloadingId === file.id ? 'bg-slate-800 dark:bg-black text-white shadow-none cursor-default' : 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-100 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600'
        }`}>
          {downloadingId === file.id ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><DownloadIcon className="w-5 h-5" /><span>Download</span></>}
        </a>
      </div>
    </div>
  );

  const Breadcrumb: React.FC<{ items: { label: string; view: ViewState; module?: Module }[] }> = ({ items }) => (
    <div className="flex items-center space-x-3 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8 sm:mb-12">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <button 
            onClick={() => navigateTo(item.view, item.module)}
            className={`hover:text-emerald-600 transition-colors ${idx === items.length - 1 ? 'text-slate-900 dark:text-white' : ''}`}
          >
            {item.label}
          </button>
          {idx < items.length - 1 && <span className="opacity-40">/</span>}
        </React.Fragment>
      ))}
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
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark bg-black text-white/90' : 'bg-[#fcfdfe] text-slate-900'}`}>
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
      
      <main className="flex-grow container mx-auto max-w-7xl px-5 py-8 sm:py-16 sm:px-12 transition-colors duration-500">
        {currentView === 'home' && (
           <div className="animate-fade-in flex flex-col items-center">
             <div className="text-center pt-8 pb-20 lg:pt-36">
               <div className="inline-flex items-center space-x-3 bg-emerald-50 dark:bg-[#1E1E1E] px-6 py-2.5 rounded-full mb-10 border border-emerald-100/50 dark:border-white/5 animate-slide-in shadow-sm">
                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">MUST CS Portal</span>
               </div>
               <h2 className="text-5xl sm:text-[100px] font-black text-slate-900 dark:text-white mb-10 max-w-6xl mx-auto leading-[1] tracking-tighter break-words px-2 text-center">
                 Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
               </h2>
               <h1 className="sr-only">GAKA Academic Portal</h1>
               <p className="text-lg sm:text-2xl text-slate-500 dark:text-white/50 max-w-3xl mx-auto mb-16 font-medium leading-relaxed px-4 text-center">
                 Verified lecture materials, course modules, and GAKA examination papers for Computer Science students.
               </p>
               <div className="flex justify-center">
                 <button onClick={() => navigateTo('modules')} className="group flex items-center justify-center px-14 py-6 sm:px-24 sm:py-7 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-black text-sm sm:text-xl shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all duration-300 active:scale-95">
                   Explore Resources <ChevronRightIcon className="ml-4 w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                 </button>
               </div>
             </div>
             
             {recentFiles.length > 0 && (
               <div className="w-full max-w-6xl mt-16 mb-20 px-4 animate-fade-in">
                 <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center space-x-4">
                     <div className="relative flex h-3.5 w-3.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span></div>
                     <h3 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Recent Content</h3>
                   </div>
                   <button onClick={() => navigateTo('modules')} className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-all border-b-2 border-emerald-600 pb-1">View All</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
                    {recentFiles.map((file, idx) => {
                       const module = modules.find(m => m.id === file.moduleId);
                       return (
                         <div 
                           key={file.id} 
                           className="group bg-white dark:bg-[#1E1E1E] p-10 sm:p-12 rounded-[3rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl flex flex-col h-full animate-fade-in relative overflow-hidden" 
                           style={{ animationDelay: `${idx * 100}ms` }}
                         >
                            <div className="flex justify-between items-center mb-8 z-10">
                              <span className="text-[11px] font-black bg-emerald-50 dark:bg-black text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-2xl uppercase tracking-tighter border dark:border-white/5">{file.moduleCode}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">{file.type === 'Past Paper' ? 'Gaka' : 'Notes'}</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-10 line-clamp-2 min-h-[4rem] tracking-tight">{file.title}</h3>
                            <button onClick={() => navigateTo('detail', module)} className="w-full py-5 bg-slate-50 dark:bg-black text-slate-700 dark:text-white/40 font-black text-[12px] uppercase tracking-[0.25em] rounded-2xl hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 group">
                               <span>Browse Module</span>
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

        {currentView === 'modules' && (
           <div className="animate-fade-in">
             <Breadcrumb items={[{ label: 'Home', view: 'home' }, { label: 'Modules', view: 'modules' }]} />
             <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-20 gap-10">
               <div className="space-y-4 px-2">
                 <h2 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">Modules</h2>
                 <p className="text-slate-500 dark:text-white/40 font-semibold text-lg max-w-lg">Verified lecture materials and past exams curated for MUST Computer Science.</p>
               </div>
               <div className="relative w-full lg:w-[540px] group px-2">
                 <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none"><SearchIcon className="w-7 h-7 text-slate-300 dark:text-white/20 group-focus-within:text-emerald-500 transition-colors" /></div>
                 <input type="text" placeholder="Search module code or title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-20 pr-8 py-6 sm:py-8 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/10 rounded-[2.5rem] focus:ring-[12px] focus:ring-emerald-50 dark:focus:ring-emerald-500/5 outline-none transition-all shadow-sm text-xl sm:text-2xl font-bold text-slate-900 dark:text-white" />
               </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-24">
               {filteredModules.map((module, i) => <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}><ModuleCard module={module} onClick={() => navigateTo('detail', module)} /></div>)}
             </div>
           </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-6xl mx-auto pb-24">
            <Breadcrumb items={[{ label: 'Home', view: 'home' }, { label: 'Modules', view: 'modules' }, { label: selectedModule.code, view: 'detail', module: selectedModule }]} />
            
            <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
              <button onClick={() => navigateTo('modules')} className="flex items-center text-slate-800 dark:text-white/60 font-black text-[14px] uppercase tracking-widest hover:text-emerald-600 group transition-all">
                <BackIcon className="mr-4 w-6 h-6 group-hover:-translate-x-2 transition-transform" /> Back to Directory
              </button>
              
              {profile?.role === 'admin' && (
                <button 
                  onClick={openAddModal}
                  className="flex items-center space-x-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 sm:py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 shadow-[0_20px_40px_-12px_rgba(16,185,129,0.3)]"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Upload Resource</span>
                </button>
              )}
            </div>

            <div className="bg-emerald-600 dark:bg-emerald-700 p-10 sm:p-24 rounded-[3.5rem] text-white shadow-3xl mb-12 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 group-hover:scale-110 transition-transform duration-700"></div>
               <span className="bg-white/10 px-5 py-2 rounded-full text-[11px] font-black tracking-widest uppercase border border-white/10 mb-8 inline-block">{selectedModule.code}</span>
               <h2 className="text-4xl sm:text-7xl font-black mb-8 leading-[1.1] tracking-tighter">{selectedModule.name}</h2>
               <p className="text-emerald-50/70 max-w-2xl font-semibold text-lg leading-relaxed">{selectedModule.description}</p>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] rounded-[3.5rem] p-8 sm:p-16 border border-slate-100 dark:border-white/5 transition-colors shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-8">
                <h3 className="text-3xl font-black text-slate-800 dark:text-white/95 tracking-tight">Resources</h3>
                <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-2xl w-full sm:w-fit border dark:border-white/10 shadow-inner">
                  {['All', 'Notes', 'Past Paper'].map((v) => (
                    <button 
                      key={v} 
                      onClick={() => setFilterType(v as any)} 
                      className={`flex-1 px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800 dark:text-white/30 dark:hover:text-white/80'}`}
                    >
                      {v === 'Past Paper' ? 'Gaka' : v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {filteredResources.map((file, i) => (
                  <ResourceItem key={file.id} file={file} delay={i * 80} />
                ))}
                {filteredResources.length === 0 && (
                  <div className="text-center py-32 bg-slate-50/50 dark:bg-black/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                    <p className="text-slate-400 dark:text-white/20 font-bold italic text-lg uppercase tracking-widest">No matching resources found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-8 sm:py-20">
            <Breadcrumb items={[{ label: 'Home', view: 'home' }, { label: 'About', view: 'about' }]} />
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[4rem] p-10 sm:p-28 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-500/5 rounded-full -mr-32 -mt-32 opacity-50 transition-colors"></div>
               <h2 className="text-4xl sm:text-8xl font-black text-slate-900 dark:text-white mb-10 sm:mb-16 leading-[1.05] tracking-tighter relative break-words">Academic <span className="gradient-text">Efficiency.</span></h2>
               <div className="space-y-12 sm:space-y-20 text-slate-600 dark:text-white/50 leading-relaxed text-lg sm:text-xl font-medium relative">
                <section>
                  <h3 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] mb-6 sm:mb-10 ml-1">Objective</h3>
                  <p className="text-2xl sm:text-4xl font-bold text-slate-800 dark:text-white/95 tracking-tight leading-snug">GAKA bridges the gap between students and their course materials.</p>
                  <p className="mt-8 sm:mt-12 text-slate-500 dark:text-white/40">By providing a unified interface for Mbeya University of Science and Technology (MUST) resources, we ensure that focus remains on learning rather than logistics. Our repository is vetted by students, for students.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                  <div className="bg-slate-50 dark:bg-white/5 p-10 sm:p-14 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 mb-4">Dev Team</h4>
                    <p className="text-slate-900 dark:text-white font-black text-2xl sm:text-3xl mb-2">Softlink Africa</p>
                    <p className="text-base sm:text-lg font-medium opacity-60">High-performance academic engineering optimized for mobile environments.</p>
                  </div>
                  <div className="bg-emerald-600 dark:bg-emerald-500 p-10 sm:p-14 rounded-[2.5rem] text-white shadow-3xl shadow-emerald-600/20 group">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-100/60 mb-4">Lead Developer</h4>
                    <p className="font-black text-2xl sm:text-4xl mb-6 tracking-tight">Cleven Samwel</p>
                    <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-3 mt-2 text-[11px] font-black uppercase tracking-widest bg-white/20 px-8 py-4 sm:px-10 sm:py-5 rounded-full hover:bg-white/30 transition-all active:scale-95 shadow-lg backdrop-blur-md">
                       <span>Connect</span>
                       <ChevronRightIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Resource Modal - Refined & Premium */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-[#0F0F0F] w-full max-w-xl rounded-[3.5rem] shadow-3xl overflow-hidden border border-slate-100 dark:border-white/10 animate-slide-in">
            <div className="p-10 sm:p-16">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editingResource ? 'Edit File' : 'Upload New File'}
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Academic Registry Tool</p>
                </div>
                <button onClick={() => setIsResourceModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSaveResource} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Resource Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Distributed Computing - Lecture 01" 
                    required 
                    value={resourceFormData.title}
                    onChange={(e) => setResourceFormData({...resourceFormData, title: e.target.value})}
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all text-slate-900 dark:text-white font-bold text-lg shadow-inner placeholder:opacity-30" 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Content Category</label>
                    <div className="relative group">
                      <select 
                        value={resourceFormData.type}
                        onChange={(e) => setResourceFormData({...resourceFormData, type: e.target.value as ResourceType})}
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all text-slate-900 dark:text-white font-black text-sm appearance-none shadow-inner"
                      >
                        <option value="Notes">Lecture Material</option>
                        <option value="Past Paper">Gaka (Examination)</option>
                      </select>
                      <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Source URL</label>
                    <input 
                      type="url" 
                      placeholder="Google Drive Shareable Link" 
                      required 
                      value={resourceFormData.url}
                      onChange={(e) => setResourceFormData({...resourceFormData, url: e.target.value})}
                      className="w-full px-8 py-5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-[1.5rem] focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all text-slate-900 dark:text-white font-bold text-sm shadow-inner placeholder:opacity-30" 
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsResourceModalOpen(false)}
                    className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white font-black text-[11px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="flex-[2] py-5 bg-emerald-600 dark:bg-emerald-50 text-white dark:text-emerald-900 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-3 border-emerald-900/20 border-t-emerald-900 rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        <span>{editingResource ? 'Commit Update' : 'Publish Resource'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-[200] animate-slide-in">
          <div className="bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-3xl border border-emerald-500/20 p-8 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-600 dark:bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl shadow-3xl shadow-emerald-500/40">
                  G
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">GAKA Hub</h4>
                  <p className="text-slate-500 dark:text-white/40 text-[12px] leading-tight font-bold mt-1 uppercase tracking-widest">
                    PWA Optimized Experience
                  </p>
                </div>
              </div>
              <button onClick={dismissInstall} className="p-3 text-slate-300 dark:text-white/10 hover:text-slate-500 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
               {isIOS ? (
                 <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-500/20">
                   <p className="text-[13px] font-black text-emerald-800 dark:text-emerald-400 text-center leading-relaxed uppercase tracking-tighter">
                     Tap <span className="inline-block mx-1 align-middle"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span> then select <br/><b>"Add to Home Screen"</b>
                   </p>
                 </div>
               ) : (
                 <button 
                   onClick={handleNativeInstall} 
                   className="w-full py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.3em] shadow-3xl shadow-emerald-500/50 active:scale-95 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/70"
                 >
                   Install Application
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      <footer className="py-24 px-8 border-t border-slate-50 dark:border-white/5 text-center transition-colors duration-500 opacity-60">
         <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.5em]">&copy; {new Date().getFullYear()} SOFTLINK AFRICA • MUST ENGINEERING</p>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;
