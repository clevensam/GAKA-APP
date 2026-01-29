
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { AuthPage } from './components/AuthPage';
import { 
  SearchIcon, BackIcon, FileIcon, DownloadIcon, 
  ShareIcon, ChevronRightIcon, ViewIcon, PlusIcon, 
  EditIcon, TrashIcon, BookmarkIcon, BookmarkFilledIcon, 
  CloseIcon 
} from './components/Icons';
import { Module, ResourceType, AcademicFile, Profile } from './types';
import { Analytics } from '@vercel/analytics/react';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://tgnljtmvigschazflxis.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nXfVOz8QEqs1mT0sxx_nYw_P8fmPVmI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type ViewState = 'home' | 'modules' | 'detail' | 'about' | 'auth' | 'saved';

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [recentFiles, setRecentFiles] = useState<(AcademicFile & { moduleCode: string; moduleId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [isProcessing, setIsProcessing] = useState(false);

  // User Saved Resources State (Persistent locally)
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('gaka-saved-resources');
    return saved ? JSON.parse(saved) : [];
  });

  // Admin CRUD States
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AcademicFile | null>(null);
  const [resourceFormData, setResourceFormData] = useState({
    title: '',
    type: 'Notes' as ResourceType,
    viewUrl: '',
    downloadUrl: ''
  });

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gaka-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync theme
  useEffect(() => {
    localStorage.setItem('gaka-theme', isDark ? 'dark' : 'light');
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Sync saved resources
  useEffect(() => {
    localStorage.setItem('gaka-saved-resources', JSON.stringify(savedResourceIds));
  }, [savedResourceIds]);

  useEffect(() => {
    const savedUserId = localStorage.getItem('gaka-session-id');
    if (savedUserId) fetchProfile(savedUserId);
    fetchData();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('portal_users').select('*').eq('id', userId).single();
    if (data) setProfile(data as Profile);
    else {
      localStorage.removeItem('gaka-session-id');
      setProfile(null);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: mData } = await supabase.from('modules').select('*').order('code');
      const { data: rData } = await supabase.from('resources').select('*, modules(code)').order('created_at', { ascending: false });

      const finalModules: Module[] = (mData || []).map(m => ({
        id: m.id,
        code: m.code,
        name: m.name,
        description: m.description || 'Verified academic resource module.',
        resources: (rData || [])
          .filter(r => r.module_id === m.id)
          .map(r => ({
            id: r.id,
            title: r.title,
            type: r.type as ResourceType,
            downloadUrl: r.download_url || '#',
            viewUrl: r.view_url || '#',
          }))
      }));

      setModules(finalModules);
      
      const topRecent = (rData || []).slice(0, 5).map(r => ({
        id: r.id,
        title: r.title,
        type: r.type as ResourceType,
        downloadUrl: r.download_url,
        viewUrl: r.view_url,
        moduleCode: r.modules?.code || 'CS',
        moduleId: r.module_id
      }));
      setRecentFiles(topRecent);
    } catch (err) {
      console.error("Sync failure.", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (u: string, p: string) => {
    const { data, error } = await supabase.from('portal_users').select('*').eq('username', u).eq('password', p).single();
    if (error || !data) throw new Error("Invalid access keys.");
    setProfile(data as Profile);
    localStorage.setItem('gaka-session-id', data.id);
    setCurrentView('modules');
  };

  const handleSignup = async (u: string, p: string, n: string, e: string) => {
    const { data: existing } = await supabase.from('portal_users').select('username').eq('username', u).maybeSingle();
    if (existing) throw new Error("Username taken.");
    const { data, error } = await supabase.from('portal_users').insert([{ username: u, password: p, full_name: n, email: e, role: 'student' }]).select().single();
    if (error) throw error;
    setProfile(data as Profile);
    localStorage.setItem('gaka-session-id', data.id);
    setCurrentView('modules');
  };

  const handleLogout = () => {
    localStorage.removeItem('gaka-session-id');
    setProfile(null);
    setCurrentView('home');
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    setIsProcessing(true);
    try {
      const payload = {
        title: resourceFormData.title,
        type: resourceFormData.type,
        view_url: resourceFormData.viewUrl,
        download_url: resourceFormData.downloadUrl,
        module_id: selectedModule.id
      };
      if (editingResource) {
        await supabase.from('resources').update(payload).eq('id', editingResource.id);
      } else {
        await supabase.from('resources').insert([payload]);
      }
      setIsResourceModalOpen(false);
      await fetchData();
      // Update selected module resources locally to avoid re-navigation
      const updatedModule = modules.find(m => m.id === selectedModule.id);
      if (updatedModule) setSelectedModule(updatedModule);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Remove permanently?")) return;
    try {
      await supabase.from('resources').delete().eq('id', id);
      await fetchData();
      if (selectedModule) {
        const updatedModule = modules.find(m => m.id === selectedModule.id);
        if (updatedModule) setSelectedModule(updatedModule);
      }
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const openAddModal = () => {
    setEditingResource(null);
    setResourceFormData({ title: '', type: 'Notes', viewUrl: '', downloadUrl: '' });
    setIsResourceModalOpen(true);
  };

  const openEditModal = (r: AcademicFile) => {
    setEditingResource(r);
    setResourceFormData({ title: r.title, type: r.type, viewUrl: r.viewUrl, downloadUrl: r.downloadUrl });
    setIsResourceModalOpen(true);
  };

  const toggleSave = (id: string) => {
    setSavedResourceIds(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
  };

  const navigateTo = (view: ViewState, module?: Module) => {
    if (module) {
      setSelectedModule(module);
      setFilterType('All');
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return modules.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [modules, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType, modules]);

  const savedResources = useMemo(() => {
    const all = modules.flatMap(m => m.resources.map(r => ({ ...r, moduleCode: m.code })));
    return all.filter(r => savedResourceIds.includes(r.id));
  }, [modules, savedResourceIds]);

  const handleShare = (title: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Academic Resource: *${title}*\n${window.location.origin}`)}`, '_blank');
  };

  const ResourceItem: React.FC<{ file: AcademicFile; moduleCode?: string; delay: number }> = ({ file, moduleCode, delay }) => {
    const isSaved = savedResourceIds.includes(file.id);
    const [isDownloading, setIsDownloading] = useState(false);

    const onDownload = (e: React.MouseEvent) => {
      if (file.downloadUrl === '#') e.preventDefault();
      else {
        setIsDownloading(true);
        setTimeout(() => setIsDownloading(false), 3000);
      }
    };

    return (
      <div 
        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#111] border border-slate-100 dark:border-white/5 rounded-2xl sm:rounded-3xl transition-all duration-500 animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center space-x-3 sm:space-x-5 mb-4 sm:mb-0 min-w-0">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-105 ${
            file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
          }`}>
            <FileIcon className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-0.5 sm:mb-1">
              {moduleCode && (
                <span className="text-[8px] sm:text-[9px] font-black bg-slate-100 dark:bg-black text-slate-500 dark:text-white/40 px-1.5 py-0.5 rounded-md uppercase border dark:border-white/5">
                  {moduleCode}
                </span>
              )}
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
                {file.type === 'Notes' ? 'Note' : 'Gaka'}
              </span>
            </div>
            <h4 className="font-black text-slate-800 dark:text-white/95 text-xs sm:text-base leading-tight truncate">
              {file.title}
            </h4>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          <div className="flex items-center bg-slate-100/50 dark:bg-black/40 rounded-xl p-1 border dark:border-white/10 shadow-sm">
            {profile?.role === 'admin' ? (
              <>
                <button onClick={() => openEditModal(file)} className="p-1.5 text-slate-500 dark:text-white/60 hover:text-emerald-600 active:scale-90 transition-all"><EditIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <button onClick={() => handleDeleteResource(file.id)} className="p-1.5 text-slate-500 dark:text-white/60 hover:text-red-500 active:scale-90 transition-all"><TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              </>
            ) : (
              <>
                {profile && (
                  <button 
                    onClick={() => toggleSave(file.id)} 
                    className={`p-1.5 active:scale-90 transition-all ${isSaved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/30 hover:text-emerald-600'}`}
                  >
                    {isSaved ? <BookmarkFilledIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                )}
                {!profile && <button onClick={() => handleShare(file.title)} className="p-1.5 text-slate-400 dark:text-white/30 hover:text-emerald-600 active:scale-90 transition-all"><ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>}
                <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 dark:text-white/60 hover:text-emerald-600 active:scale-90 transition-all"><ViewIcon className="w-4 h-4 sm:w-5 sm:h-5" /></a>
              </>
            )}
          </div>
          <a 
            href={file.downloadUrl} 
            onClick={onDownload}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 sm:px-6 sm:py-3 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all w-full sm:w-32 ${
              isDownloading ? 'bg-slate-800 dark:bg-black text-white' : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700'
            }`}
          >
            {isDownloading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><DownloadIcon className="w-3.5 h-3.5" /><span>Get</span></>}
          </a>
        </div>
      </div>
    );
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="book-loader">
        <div className="book-back"></div>
        {[1, 2, 3].map(i => <div key={i} className="book-page"></div>)}
      </div>
    </div>
  );

  if (currentView === 'auth') return <AuthPage onLogin={handleLogin} onSignup={handleSignup} onBack={() => navigateTo('home')} isDark={isDark} />;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDark ? 'dark bg-black text-white/90' : 'bg-[#fcfdfe] text-slate-900'}`}>
      <Navbar 
        onHomeClick={() => navigateTo('home')} 
        onExploreClick={() => navigateTo('modules')}
        onSavedClick={() => navigateTo('saved')}
        onAboutClick={() => navigateTo('about')}
        onLogoutClick={handleLogout}
        onAuthClick={(t) => navigateTo('auth')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        profile={profile}
        currentView={currentView}
      />
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-6 sm:py-12 sm:px-10">
        {currentView === 'home' && (
          <div className="animate-fade-in">
            <div className="flex flex-col items-center text-center pt-6 pb-12 sm:pt-12 sm:pb-20 lg:pt-20">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-[#1E1E1E] px-4 py-1.5 rounded-full mb-6 border border-emerald-100/50 dark:border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Portal v2.5</span>
              </div>
              <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[85px] font-black mb-6 tracking-tighter leading-[1.05] max-w-4xl px-2">
                Centralized <span className="gradient-text">Academic</span> Hub.
              </h2>
              <p className="text-sm sm:text-xl md:text-2xl text-slate-500 dark:text-white/40 max-w-2xl mb-10 font-medium px-6 leading-relaxed">Verified Computer Science materials, accessible everywhere.</p>
              <button onClick={() => navigateTo('modules')} className="group flex items-center px-8 py-4 sm:px-20 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-black text-xs sm:text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
                Explore Repository <ChevronRightIcon className="ml-3 w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>

            {/* Recently Uploaded Section */}
            <div className="max-w-4xl mx-auto mt-8 sm:mt-16 px-1">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">Recently <span className="text-emerald-600">Uploaded</span></h3>
                  <button onClick={() => navigateTo('modules')} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">View All Resources</button>
               </div>
               <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {recentFiles.map((f, i) => (
                    <ResourceItem key={f.id} file={f} moduleCode={f.moduleCode} delay={i * 50} />
                  ))}
                  {recentFiles.length === 0 && (
                    <p className="text-center py-10 text-slate-400 text-xs font-medium">No recent uploads found.</p>
                  )}
               </div>
            </div>
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-6 px-1">
              <div className="space-y-2">
                <h2 className="text-4xl sm:text-7xl font-black tracking-tighter">Modules</h2>
                <p className="text-slate-400 dark:text-white/30 font-semibold text-sm sm:text-lg">MUST Course Directory.</p>
              </div>
              <div className="relative w-full lg:w-[450px]">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-300 dark:text-white/20" /></div>
                <input type="text" placeholder="Search modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 sm:py-6 bg-white dark:bg-[#0A0A0A] border border-slate-100 dark:border-white/10 rounded-xl sm:rounded-3xl focus:ring-emerald-500/10 outline-none shadow-sm text-sm sm:text-lg font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-16">
              {filteredModules.map((m, i) => <div key={m.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}><ModuleCard module={m} onClick={() => navigateTo('detail', m)} /></div>)}
              {filteredModules.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-100 dark:border-white/5">
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No matching modules.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 px-1">
              <button onClick={() => navigateTo('modules')} className="flex items-center text-slate-600 dark:text-white/40 font-black text-[10px] sm:text-[12px] uppercase tracking-widest hover:text-emerald-600 transition-colors">
                <BackIcon className="mr-2 sm:mr-3 w-5 h-5" /> Back to Modules
              </button>
              {profile?.role === 'admin' && <button onClick={openAddModal} className="flex items-center space-x-1.5 bg-emerald-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-black text-[9px] sm:text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><PlusIcon className="w-4 h-4" /><span>Add File</span></button>}
            </div>
            
            <div className="bg-emerald-600 dark:bg-emerald-700 p-6 sm:p-12 rounded-2xl sm:rounded-[2.5rem] text-white mb-8 relative overflow-hidden shadow-2xl">
               <span className="bg-white/10 px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-widest uppercase mb-4 inline-block">{selectedModule.code}</span>
               <h2 className="text-2xl sm:text-4xl font-black mb-3 tracking-tighter leading-tight">{selectedModule.name}</h2>
               <p className="text-emerald-50/70 max-w-2xl font-semibold text-xs sm:text-lg">{selectedModule.description}</p>
            </div>

            {/* Filter Tabs - UI Consistent */}
            <div className="flex items-center space-x-1 mb-8 bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl w-fit mx-1">
              {(['All', 'Notes', 'Past Paper'] as (ResourceType | 'All')[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'}`}
                >
                  {type === 'Past Paper' ? 'Gaka' : type}
                </button>
              ))}
            </div>

            <div className="space-y-3 px-1">
              {filteredResources.map((f, i) => <ResourceItem key={f.id} file={f} delay={i * 40} />)}
              {filteredResources.length === 0 && (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-100 dark:border-white/5">
                   <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-[10px]">No files found in this category.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'saved' && (
          <div className="animate-fade-in max-w-4xl mx-auto pb-24">
            <div className="mb-8 sm:mb-12 px-1">
              <h2 className="text-3xl sm:text-6xl font-black tracking-tighter mb-2">My Library</h2>
              <p className="text-slate-400 dark:text-white/30 font-semibold text-sm sm:text-lg">Saved resources for offline view.</p>
            </div>
            <div className="space-y-4 px-1">
              {savedResources.map((f, i) => <ResourceItem key={f.id} file={f} moduleCode={f.moduleCode} delay={i * 40} />)}
              {savedResources.length === 0 && (
                <div className="text-center py-20 sm:py-32 bg-slate-50/50 dark:bg-white/5 rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5 px-4">
                  <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest mb-6 text-xs">No bookmarks saved yet.</p>
                  <button onClick={() => navigateTo('modules')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95">Browse Now</button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl sm:rounded-3xl p-6 sm:p-16 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
               <h2 className="text-3xl sm:text-6xl font-black mb-8 sm:mb-12 tracking-tighter leading-none">Engineering <br/><span className="gradient-text">Efficiency.</span></h2>
               <div className="space-y-10 sm:space-y-14">
                <section>
                  <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">GAKA Mission</h3>
                  <p className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight leading-snug">Empowering Computer Science students through open access to institutional academic heritage.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-black/40 p-6 sm:p-8 rounded-xl sm:rounded-2xl border dark:border-white/5">
                    <h4 className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Team</h4>
                    <p className="text-slate-900 dark:text-white font-black text-xl sm:text-2xl">Softlink Africa</p>
                  </div>
                  <div className="bg-emerald-600 p-6 sm:p-8 rounded-xl sm:rounded-2xl text-white shadow-xl">
                    <h4 className="text-[8px] font-black text-emerald-100 uppercase mb-2 tracking-widest">Lead Dev</h4>
                    <p className="font-black text-xl sm:text-2xl mb-6">Cleven Samwel</p>
                    <a href="https://wa.me/255685208576" className="inline-flex items-center px-6 py-3 bg-white/20 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-white/30 transition-all">Contact <ChevronRightIcon className="ml-2 w-4 h-4" /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Operations Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-[#0A0A0A] w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-3xl border border-slate-100 dark:border-white/10 animate-slide-in relative max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    {editingResource ? 'Edit Resource' : 'New Publication'}
                  </h3>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-2">MUST Registry</p>
                </div>
                <button onClick={() => setIsResourceModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 transition-all hover:text-slate-900 dark:hover:text-white">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveResource} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Title</label>
                  <input type="text" placeholder="Lecture 01 - Basics" required value={resourceFormData.title} onChange={e => setResourceFormData({...resourceFormData, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-bold text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type</label>
                    <select value={resourceFormData.type} onChange={e => setResourceFormData({...resourceFormData, type: e.target.value as ResourceType})} className="w-full px-5 py-4 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-black text-xs appearance-none">
                      <option value="Notes">Lecture Note</option>
                      <option value="Past Paper">Gaka Exam</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">View URL</label>
                    <input type="url" placeholder="Drive preview" required value={resourceFormData.viewUrl} onChange={e => setResourceFormData({...resourceFormData, viewUrl: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-bold text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Download URL</label>
                  <input type="url" placeholder="Direct link" required value={resourceFormData.downloadUrl} onChange={e => setResourceFormData({...resourceFormData, downloadUrl: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-bold text-xs" />
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setIsResourceModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 font-black text-[10px] uppercase rounded-xl transition-all active:scale-95">Discard</button>
                  <button type="submit" disabled={isProcessing} className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all active:scale-95">
                    {isProcessing ? "Processing..." : editingResource ? 'Save Changes' : 'Publish File'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 px-6 border-t border-slate-50 dark:border-white/5 text-center opacity-30">
         <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.4em] leading-relaxed">&copy; {new Date().getFullYear()} SOFTLINK AFRICA • INNOVATION IN ENGINEERING</p>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;
