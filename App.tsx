import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { Analytics } from '@vercel/analytics/react';
import { GoogleGenAI } from "@google/genai";

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";
const CACHE_KEY = 'gaka_resource_cache';

const transformToDirectDownload = (url: string): string => {
  if (!url || url === '#') return '#';
  const match = url.match(/\/file\/d\/([^/]+)\/(?:view|edit)/);
  return match ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url;
};

const ensureViewUrl = (url: string): string => {
  if (!url || url === '#') return '#';
  const match = url.match(/\/file\/d\/([^/]+)\/(?:view|edit|uc)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/view` : url;
};

// --- Sub Components for Better Organization ---

const ResourceItem: React.FC<{ 
  file: AcademicFile; 
  moduleCode?: string; 
  delay: number;
  onDownload: (id: string, url: string) => void;
  downloadingId: string | null;
  onShare: (title: string) => void;
}> = ({ file, moduleCode, delay, onDownload, downloadingId, onShare }) => (
  <div 
    className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-7 bg-white dark:bg-[#121212] border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 rounded-3xl transition-all duration-500 hover:shadow-2xl animate-slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center space-x-5 mb-5 sm:mb-0">
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
        file.type === 'Notes' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
      }`}>
        <FileIcon className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          {moduleCode && <span className="text-[10px] font-black bg-slate-100 dark:bg-black text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">{moduleCode}</span>}
          <span className={`text-[10px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>{file.type}</span>
        </div>
        <h4 className="font-bold text-slate-800 dark:text-white/90 text-base sm:text-lg leading-tight group-hover:text-emerald-600 transition-colors">{file.title}</h4>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={() => onShare(file.title)} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-all active:scale-90">
        <ShareIcon className="w-5 h-5" />
      </button>
      <a href={file.viewUrl} target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all">
        <ViewIcon className="w-5 h-5" />
      </a>
      <button 
        onClick={() => onDownload(file.id, file.downloadUrl)} 
        disabled={downloadingId === file.id}
        className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-8 py-4 font-bold text-xs rounded-2xl transition-all active:scale-95 ${
          downloadingId === file.id ? 'bg-slate-200 dark:bg-white/10 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
        }`}
      >
        {downloadingId === file.id ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent animate-spin rounded-full"></div> : <><DownloadIcon className="w-4 h-4" /><span>Download</span></>}
      </button>
    </div>
  </div>
);

// --- Main App Component ---

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
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gaka-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('gaka-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const loadCache = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      setModules(data.modules);
      setRecentFiles(data.recent);
      setIsLoading(false);
    }
  };

  const syncData = useCallback(async () => {
    try {
      const response = await fetch(`${LIVE_CSV_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error('Registry sync failed');
      const csvText = await response.text();
      const rows = csvText.split(/\r?\n/).filter(r => r.trim() !== "");
      if (rows.length < 2) return;

      const headers = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const col = {
        code: headers.findIndex(h => h.includes('code') || h.includes('module')),
        type: headers.findIndex(h => h === 'type'),
        title: headers.findIndex(h => h === 'title'),
        url: headers.findIndex(h => h.includes('url') || h.includes('link'))
      };

      const moduleMap = new Map<string, Module>();
      MODULES_DATA.forEach(m => moduleMap.set(m.code.toLowerCase().replace(/\s/g, ''), { ...m, resources: [] }));

      const allFiles: any[] = [];
      rows.slice(1).forEach((row, idx) => {
        const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v?.trim().replace(/^"|"$/g, ''));
        const code = parts[col.code] || "";
        const title = parts[col.title] || "";
        if (!code || !title) return;

        const normalizedCode = code.toLowerCase().replace(/\s/g, '');
        if (!moduleMap.has(normalizedCode)) {
          moduleMap.set(normalizedCode, {
            id: `dyn-${normalizedCode}`,
            code: code.toUpperCase(),
            name: `Module ${code.toUpperCase()}`,
            description: 'Academic Resource Module',
            resources: []
          });
        }

        const mod = moduleMap.get(normalizedCode)!;
        const file: AcademicFile = {
          id: `f-${idx}`,
          title,
          type: (parts[col.type] || "").toLowerCase().includes('note') ? 'Notes' : 'Past Paper',
          downloadUrl: transformToDirectDownload(parts[col.url] || "#"),
          viewUrl: ensureViewUrl(parts[col.url] || "#")
        };
        mod.resources.push(file);
        allFiles.push({ ...file, moduleCode: mod.code, moduleId: mod.id, idx });
      });

      const finalModules = Array.from(moduleMap.values()).filter(m => m.resources.length > 0);
      const recent = allFiles.sort((a, b) => b.idx - a.idx).slice(0, 3);

      setModules(finalModules);
      setRecentFiles(recent);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ modules: finalModules, recent, time: Date.now() }));
      setError(null);
    } catch (err: any) {
      if (!modules.length) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [modules.length]);

  useEffect(() => {
    loadCache();
    syncData();
  }, [syncData]);

  // Handle Routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#/modules') setCurrentView('modules');
      else if (hash === '#/about') setCurrentView('about');
      else if (hash.startsWith('#/module/')) {
        const id = hash.split('/').pop();
        const mod = modules.find(m => m.id === id);
        if (mod) { setSelectedModule(mod); setCurrentView('detail'); }
        else if (modules.length) window.location.hash = '#/modules';
      } else setCurrentView('home');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [modules]);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (id: string, url: string) => {
    if (url === '#') return;
    setDownloadingId(id);
    window.location.href = url;
    setTimeout(() => setDownloadingId(null), 3000);
  };

  const handleShare = (title: string) => {
    const msg = `Download "${title}" from GAKA Academic Portal: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // AI Smart Search Suggestions
  useEffect(() => {
    if (searchQuery.length < 5) { setAiSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const resp = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Given these module names: ${modules.map(m => m.name).join(', ')}. The user searched: "${searchQuery}". Suggest 2 relevant module names that might match their intent. Output only the names separated by a comma.`,
        });
        const suggestions = resp.text?.split(',').map(s => s.trim()) || [];
        setAiSuggestions(suggestions);
      } catch (e) { console.error(e); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery, modules]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return modules.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [modules, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType]);

  if (isLoading && !modules.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold tracking-widest text-emerald-600 animate-pulse">SYNCING CLOUD REGISTRY...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDark ? 'dark bg-[#050505]' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onLogoClick={() => navigateTo('#/home')} 
        onHomeClick={() => navigateTo('#/home')} 
        onDirectoryClick={() => navigateTo('#/modules')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />

      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:px-10">
        {currentView === 'home' && (
          <div className="animate-slide-up flex flex-col items-center text-center">
            <div className="pt-20 pb-16">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-full mb-8 border border-emerald-100 dark:border-emerald-500/20 shadow-sm animate-glow">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">MUST Academic Hub</span>
              </div>
              <h2 className="text-5xl sm:text-[100px] font-black leading-[0.95] tracking-tighter text-slate-900 dark:text-white mb-8">
                The <span className="gradient-text">GAKA</span> <br/> Experience.
              </h2>
              <p className="text-lg sm:text-2xl text-slate-500 dark:text-white/60 max-w-2xl mx-auto mb-12">
                Fast, registration-free access to Computer Science lecture notes and past examination papers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigateTo('#/modules')} className="px-12 py-5 bg-emerald-600 text-white rounded-full font-bold shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95">Access Resources</button>
                <button onClick={() => navigateTo('#/about')} className="px-12 py-5 bg-white dark:bg-white/5 border dark:border-white/10 text-slate-700 dark:text-white rounded-full font-bold hover:bg-slate-50 transition-all">About Portal</button>
              </div>
            </div>

            {recentFiles.length > 0 && (
              <div className="w-full mt-10">
                <div className="flex items-center justify-between mb-10 px-2">
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white">Recent Uploads</h3>
                   <button onClick={() => navigateTo('#/modules')} className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {recentFiles.map((file, i) => (
                    <div key={file.id} className="card-premium p-8 text-left group">
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">{file.moduleCode}</span>
                        <FileIcon className="w-6 h-6 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-6 line-clamp-2">{file.title}</h4>
                      <button onClick={() => navigateTo(`#/module/${file.moduleId}`)} className="w-full py-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Open Module</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-slide-up">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8 px-2">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900 dark:text-white">Directory</h2>
                <p className="text-slate-500 dark:text-white/40 font-medium">{filteredModules.length} Modules available</p>
              </div>
              <div className="relative w-full lg:w-[450px]">
                <div className="absolute inset-y-0 left-6 flex items-center"><SearchIcon className="w-6 h-6 text-slate-300" /></div>
                <input 
                  type="text" 
                  placeholder="Search code or name..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] focus:ring-4 focus:ring-emerald-500/10 outline-none text-xl font-medium placeholder:text-slate-300 dark:text-white"
                />
                {aiSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 z-10 animate-slide-up">
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2">Smart Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.map(s => (
                        <button key={s} onClick={() => setSearchQuery(s)} className="text-xs font-semibold px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border dark:border-white/10 hover:border-emerald-500 transition-all">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((m, i) => (
                <div key={m.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-slide-up">
                  <ModuleCard module={m} onClick={() => navigateTo(`#/module/${m.id}`)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-slide-up max-w-5xl mx-auto">
             <button onClick={() => navigateTo('#/modules')} className="flex items-center text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest mb-10 transition-all group">
               <BackIcon className="mr-3 w-6 h-6 group-hover:-translate-x-2 transition-transform" /> Back to Modules
             </button>
             <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-10 sm:p-20 rounded-[3rem] text-white shadow-2xl mb-12">
               <span className="bg-white/20 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 inline-block">{selectedModule.code}</span>
               <h2 className="text-4xl sm:text-7xl font-black mb-4 leading-tight">{selectedModule.name}</h2>
               <p className="text-emerald-100 opacity-80 text-lg">{selectedModule.description}</p>
             </div>
             
             <div className="card-premium p-8 sm:p-12">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                 <h3 className="text-3xl font-black dark:text-white">Resources</h3>
                 <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border dark:border-white/5">
                   {['All', 'Notes', 'Past Paper'].map(v => (
                     <button key={v} onClick={() => setFilterType(v as any)} className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                       {v === 'Past Paper' ? 'GAKA' : v}
                     </button>
                   ))}
                 </div>
               </div>
               <div className="space-y-4">
                 {filteredResources.map((f, i) => (
                   <ResourceItem 
                    key={f.id} 
                    file={f} 
                    delay={i * 50} 
                    onDownload={handleDownload} 
                    downloadingId={downloadingId}
                    onShare={handleShare}
                   />
                 ))}
               </div>
             </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-slide-up max-w-4xl mx-auto py-20 text-center">
            <h2 className="text-5xl sm:text-7xl font-black mb-10 dark:text-white">Open <span className="gradient-text">Academic</span> Access.</h2>
            <div className="card-premium p-12 text-left space-y-8">
              <p className="text-xl text-slate-600 dark:text-white/60 leading-relaxed">GAKA is a streamlined hub for Computer Science materials at MUST, engineered to remove barriers to information.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 dark:bg-white/5 rounded-[2rem]">
                  <h4 className="text-xs font-bold uppercase text-emerald-600 mb-2">Development</h4>
                  <p className="font-bold text-lg dark:text-white">Softlink Africa</p>
                </div>
                <div className="p-8 bg-emerald-600 text-white rounded-[2rem] shadow-xl shadow-emerald-600/20">
                  <h4 className="text-xs font-bold uppercase text-emerald-100/60 mb-2">Lead Engineer</h4>
                  <p className="font-bold text-xl mb-4">Cleven Sam</p>
                  <a href="https://wa.me/255685208576" className="text-[10px] font-bold uppercase bg-white/20 px-6 py-2 rounded-full">Contact Support</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-20 px-10 border-t dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 opacity-50">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-slate-200 dark:bg-white/10 rounded-lg"></div>
             <span className="font-black text-sm tracking-widest uppercase dark:text-white">GAKA PORTAL</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] dark:text-white">&copy; {new Date().getFullYear()} Softlink Africa | MUST ICT</p>
        </div>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;