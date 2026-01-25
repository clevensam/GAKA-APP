
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { AuthPage } from './components/AuthPage';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon, PlusIcon, EditIcon, TrashIcon, BookmarkIcon, BookmarkFilledIcon } from './components/Icons';
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
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // User Saved Resources State (Persistent locally for students)
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
      
      const topRecent = (rData || []).slice(0, 3).map(r => ({
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
      setError("Sync failure.");
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
      if (editingResource) await supabase.from('resources').update(payload).eq('id', editingResource.id);
      else await supabase.from('resources').insert([payload]);
      setIsResourceModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Remove permanently?")) return;
    await supabase.from('resources').delete().eq('id', id);
    await fetchData();
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
    if (module) setSelectedModule(module);
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
  }, [selectedModule, filterType]);

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
        className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-9 bg-white dark:bg-[#1A1A1A] hover:bg-slate-50 dark:hover:bg-[#222] border border-slate-100 dark:border-white/5 rounded-[3rem] transition-all duration-500 animate-fade-in"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center space-x-7 mb-7 sm:mb-0">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-105 shadow-sm ${
            file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
          }`}>
            <FileIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              {moduleCode && (
                <span className="text-[10px] font-black bg-slate-100 dark:bg-black text-slate-500 dark:text-white/40 px-2.5 py-1 rounded-lg uppercase border dark:border-white/5">
                  {moduleCode}
                </span>
              )}
              <span className={`text-[10px] font-black uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
                {file.type === 'Notes' ? 'Note' : 'Gaka'}
              </span>
            </div>
            <h4 className="font-black text-slate-800 dark:text-white/95 text-lg sm:text-xl leading-tight group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors">
              {file.title}
            </h4>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <div className="flex items-center bg-slate-100/50 dark:bg-black/40 rounded-3xl p-1.5 border dark:border-white/10 shadow-sm">
            {profile?.role === 'admin' ? (
              <>
                <button onClick={() => openEditModal(file)} className="p-2.5 text-slate-500 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90"><EditIcon /></button>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <button onClick={() => handleDeleteResource(file.id)} className="p-2.5 text-slate-500 dark:text-white/60 hover:text-red-500 dark:hover:text-red-400 active:scale-90"><TrashIcon /></button>
              </>
            ) : (
              <>
                {profile && (
                  <button 
                    onClick={() => toggleSave(file.id)} 
                    className={`p-2.5 active:scale-90 ${isSaved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/30 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                  >
                    {isSaved ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                  </button>
                )}
                {!profile && <button onClick={() => handleShare(file.title)} className="p-2.5 text-slate-400 dark:text-white/30 hover:text-emerald-600 active:scale-90"><ShareIcon /></button>}
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-500 dark:text-white/60 hover:text-emerald-600 active:scale-90"><ViewIcon /></a>
              </>
            )}
          </div>
          <a 
            href={file.downloadUrl} 
            onClick={onDownload}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-8 py-4 sm:px-10 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all ${
              isDownloading ? 'bg-slate-800 dark:bg-black text-white' : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700'
            }`}
          >
            {isDownloading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <><DownloadIcon className="w-4 h-4" /><span>Download</span></>}
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
      
      <main className="flex-grow container mx-auto max-w-7xl px-5 py-8 sm:py-16 sm:px-10">
        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center text-center pt-10 pb-20 lg:pt-32">
            <div className="inline-flex items-center space-x-3 bg-emerald-50 dark:bg-[#1E1E1E] px-6 py-2 rounded-full mb-10 border border-emerald-100/50 dark:border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">MUST CS Portal</span>
            </div>
            <h2 className="text-5xl sm:text-[100px] font-black mb-10 tracking-tighter leading-[0.95]">
              Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
            </h2>
            <p className="text-lg sm:text-2xl text-slate-500 dark:text-white/40 max-w-3xl mb-16 font-medium">Verified materials for MUST Computer Science students.</p>
            <button onClick={() => navigateTo('modules')} className="group flex items-center px-14 py-6 sm:px-24 sm:py-7 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-black text-sm sm:text-xl shadow-2xl hover:scale-105 transition-all">
              Explore Resources <ChevronRightIcon className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8 px-2">
              <div className="space-y-4">
                <h2 className="text-5xl sm:text-7xl font-black tracking-tighter">Modules</h2>
                <p className="text-slate-500 dark:text-white/40 font-semibold text-lg">Browse curated MUST CS directory.</p>
              </div>
              <div className="relative w-full lg:w-[480px]">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none"><SearchIcon className="w-7 h-7 text-slate-300 dark:text-white/20" /></div>
                <input type="text" placeholder="Search code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-20 pr-8 py-6 sm:py-7 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/10 rounded-[2.5rem] focus:ring-emerald-500/10 outline-none shadow-sm text-lg font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-20">
              {filteredModules.map((m, i) => <div key={m.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}><ModuleCard module={m} onClick={() => navigateTo('detail', m)} /></div>)}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-6xl mx-auto pb-24">
            <div className="flex items-center justify-between mb-10 gap-6">
              <button onClick={() => navigateTo('modules')} className="flex items-center text-slate-800 dark:text-white/60 font-black text-[13px] uppercase tracking-widest hover:text-emerald-600 group">
                <BackIcon className="mr-4 group-hover:-translate-x-2 transition-transform" /> Back
              </button>
              {profile?.role === 'admin' && <button onClick={openAddModal} className="flex items-center space-x-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95"><PlusIcon /><span>Upload</span></button>}
            </div>
            <div className="bg-emerald-600 dark:bg-emerald-700 p-12 sm:p-20 rounded-[4rem] text-white mb-16 relative overflow-hidden">
               <span className="bg-white/10 px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase mb-8 inline-block">{selectedModule.code}</span>
               <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tighter">{selectedModule.name}</h2>
               <p className="text-emerald-50/70 max-w-2xl font-semibold text-lg">{selectedModule.description}</p>
            </div>
            <div className="space-y-6">
              {filteredResources.map((f, i) => <ResourceItem key={f.id} file={f} delay={i * 80} />)}
            </div>
          </div>
        )}

        {currentView === 'saved' && (
          <div className="animate-fade-in max-w-6xl mx-auto pb-32">
            <div className="mb-16 px-2">
              <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4">Saved Hub</h2>
              <p className="text-slate-500 dark:text-white/40 font-semibold text-xl">Your personally curated academic library.</p>
            </div>
            <div className="space-y-8">
              {savedResources.map((f, i) => <ResourceItem key={f.id} file={f} moduleCode={f.moduleCode} delay={i * 80} />)}
              {savedResources.length === 0 && (
                <div className="text-center py-32 bg-slate-50/50 dark:bg-black/10 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                  <p className="text-slate-400 dark:text-white/20 font-black uppercase tracking-widest mb-8">No saved items yet.</p>
                  <button onClick={() => navigateTo('modules')} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl">Browse All</button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-10">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[4.5rem] p-12 sm:p-28 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
               <h2 className="text-5xl sm:text-[100px] font-black mb-16 tracking-tighter leading-none relative">Academic <br/><span className="gradient-text">Efficiency.</span></h2>
               <div className="space-y-16 relative">
                <section>
                  <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.5em] mb-8">Objective</h3>
                  <p className="text-3xl sm:text-5xl font-bold text-slate-800 dark:text-white tracking-tight leading-snug">GAKA bridges the gap between students and course materials.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-50 dark:bg-black/20 p-12 rounded-[3.5rem] border border-slate-100 dark:border-white/5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dev Team</h4>
                    <p className="text-slate-900 dark:text-white font-black text-3xl">Softlink Africa</p>
                  </div>
                  <div className="bg-emerald-600 p-12 rounded-[3.5rem] text-white shadow-3xl">
                    <h4 className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-4">Lead Developer</h4>
                    <p className="font-black text-3xl mb-8">Cleven Samwel</p>
                    <a href="https://wa.me/255685208576" className="inline-flex items-center px-10 py-4 bg-white/20 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-white/30 transition-all">Connect <ChevronRightIcon className="ml-3" /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Centered Admin Resource Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-fade-in">
          <div className="bg-white dark:bg-[#0A0A0A] w-full max-w-xl rounded-[4rem] shadow-3xl border border-slate-100 dark:border-white/10 animate-slide-in relative max-h-[90vh] overflow-y-auto">
            <div className="p-10 sm:p-16">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    {editingResource ? 'Edit File' : 'New File'}
                  </h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-3">Academic Registry</p>
                </div>
                <button onClick={() => setIsResourceModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 border dark:border-white/10">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSaveResource} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Title</label>
                  <input type="text" placeholder="Lecture 01 - Intro" required value={resourceFormData.title} onChange={e => setResourceFormData({...resourceFormData, title: e.target.value})} className="w-full px-8 py-5 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-[1.5rem] focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-bold" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Type</label>
                    <select value={resourceFormData.type} onChange={e => setResourceFormData({...resourceFormData, type: e.target.value as ResourceType})} className="w-full px-8 py-5 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-[1.5rem] focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-black text-xs appearance-none">
                      <option value="Notes">Lecture Note</option>
                      <option value="Past Paper">Gaka Exam</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-3">View URL</label>
                    <input type="url" placeholder="Preview link" required value={resourceFormData.viewUrl} onChange={e => setResourceFormData({...resourceFormData, viewUrl: e.target.value})} className="w-full px-8 py-5 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-[1.5rem] focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-bold text-xs" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-3">Download URL</label>
                  <input type="url" placeholder="Direct download link" required value={resourceFormData.downloadUrl} onChange={e => setResourceFormData({...resourceFormData, downloadUrl: e.target.value})} className="w-full px-8 py-5 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-[1.5rem] focus:border-emerald-500 outline-none text-slate-900 dark:text-white font-bold text-xs" />
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsResourceModalOpen(false)} className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 font-black text-[11px] uppercase rounded-2xl active:scale-95">Discard</button>
                  <button type="submit" disabled={isProcessing} className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 disabled:opacity-50">
                    {isProcessing ? "Saving..." : editingResource ? 'Update' : 'Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="py-24 px-10 border-t border-slate-50 dark:border-white/5 text-center opacity-60">
         <p className="text-[11px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.5em]">&copy; {new Date().getFullYear()} SOFTLINK AFRICA • MUST ENGINEERING</p>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;
