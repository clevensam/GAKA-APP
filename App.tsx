import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { RecentFileCard } from './components/RecentFileCard';
import { ResourceItem } from './components/ResourceItem';
import { SearchIcon, BackIcon, BookOpenIcon, DownloadIcon, FileIcon, ChevronRightIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { Analytics } from '@vercel/analytics/react';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

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
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gaka-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('gaka-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('gaka-theme', 'light');
    }
  }, [isDark]);

  const fetchDataWithRetry = async (url: string, retries = 2): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        // Some Google Sheet published CSVs fail with cache-busting on certain domains due to CORS
        const response = await fetch(url);
        if (response.ok) return response;
      } catch (e) {
        if (i === retries - 1) throw e;
      }
      await new Promise(res => setTimeout(res, 800 * (i + 1)));
    }
    throw new Error('Sync timed out. Using local fallback.');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchDataWithRetry(LIVE_CSV_URL);
        const csvText = await response.text();
        const allRows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
        if (allRows.length < 2) throw new Error('Remote registry is empty.');
        
        const headers = allRows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const colIdx = {
          code: headers.findIndex(h => h === 'module code' || h === 'code' || h.includes('module')),
          type: headers.findIndex(h => h === 'type'),
          title: headers.findIndex(h => h === 'title'),
          download: headers.findIndex(h => h === 'download url' || h === 'download link' || h === 'url'),
          view: headers.findIndex(h => h === 'view url' || h === 'preview url' || h === 'view link')
        };

        if (colIdx.code === -1 || colIdx.title === -1) throw new Error('Incompatible CSV format.');

        const moduleMap = new Map<string, Module>();
        MODULES_DATA.forEach(m => {
          moduleMap.set(m.code.replace(/\s+/g, '').toLowerCase(), { ...m, resources: [] });
        });

        const allExtractedFiles: (AcademicFile & { moduleCode: string; moduleId: string; rowIndex: number })[] = [];
        allRows.slice(1).forEach((row, index) => {
          const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val?.trim().replace(/^"|"$/g, ''));
          const moduleCode = parts[colIdx.code] || "";
          const typeStr = parts[colIdx.type] || "";
          const title = parts[colIdx.title] || "";
          const rawDownloadUrl = parts[colIdx.download] || "#";
          const rawViewUrl = colIdx.view !== -1 ? parts[colIdx.view] : rawDownloadUrl;
          
          if (!moduleCode || !title) return;

          const downloadUrl = transformToDirectDownload(rawDownloadUrl);
          const viewUrl = ensureViewUrl(rawViewUrl);
          const normalizedCode = moduleCode.replace(/\s+/g, '').toLowerCase();

          if (!moduleMap.has(normalizedCode)) {
            moduleMap.set(normalizedCode, {
              id: `dynamic-${normalizedCode}`,
              code: moduleCode.toUpperCase(),
              name: `Module ${moduleCode.toUpperCase()}`,
              description: 'Educational resources sync.',
              resources: []
            });
          }

          const target = moduleMap.get(normalizedCode)!;
          const resource: AcademicFile = {
            id: `res-${index}`,
            title,
            type: (typeStr.toLowerCase().includes('note')) ? 'Notes' : 'Past Paper',
            downloadUrl,
            viewUrl,
            size: '---'
          };
          target.resources.unshift(resource);
          allExtractedFiles.push({ ...resource, moduleCode: target.code, moduleId: target.id, rowIndex: index });
        });

        const finalModules = Array.from(moduleMap.values()).filter(m => m.resources.length > 0);
        setModules(finalModules);
        setRecentFiles(allExtractedFiles.sort((a, b) => b.rowIndex - a.rowIndex).slice(0, 3));
        setError(null);
      } catch (err: any) {
        console.warn("Cloud Sync Error:", err);
        setError("Running in offline mode. Remote updates unavailable.");
        // Fallback to local data if any
        setModules(MODULES_DATA.filter(m => m.resources.length > 0));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/modules') setCurrentView('modules');
      else if (hash === '#/about') setCurrentView('about');
      else if (hash.startsWith('#/module/')) {
        const moduleId = hash.split('/').pop();
        const found = modules.find(m => m.id === moduleId);
        if (found) {
          setSelectedModule(found);
          setCurrentView('detail');
          setFilterType('All'); 
        } else if (modules.length > 0) navigateTo('#/modules');
      } else setCurrentView('home');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [modules]);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredModules = useMemo(() => 
    modules.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.code.toLowerCase().includes(searchQuery.toLowerCase())
    ), [modules, searchQuery]
  );

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType]);

  const handleShare = (title: string) => {
    const msg = `Academic Resource from *GAKA Portal*: \n\n*${title}*\n ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string, url: string) => {
    if (url === '#') { e.preventDefault(); return; }
    setDownloadingId(id);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 border-[4px] border-slate-100 dark:border-white/5 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-100 dark:shadow-emerald-900/40">G</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-500 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onLogoClick={() => navigateTo('#/home')} 
        onHomeClick={() => navigateTo('#/home')} 
        onDirectoryClick={() => navigateTo('#/modules')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8">
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] sm:text-[14px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-8 px-1">
            <button onClick={() => navigateTo('#/home')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</button>
            <ChevronRightIcon className="w-3.5 h-3.5" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-white font-bold">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-white font-bold">About</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('#/modules')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3.5 h-3.5" />
                <span className="text-slate-900 dark:text-white font-bold">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}

        {error && (
          <div className="mb-12 p-6 bg-amber-50/40 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl text-amber-800 dark:text-amber-400 text-sm font-medium flex items-center justify-between animate-fade-in shadow-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-4 animate-pulse"></span>
              <p>{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="text-amber-600 font-bold underline">Try Refresh</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center">
            <div className="text-center pt-8 pb-16 lg:pt-32">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-[#1E1E1E] px-4 py-2 rounded-full mb-8 border dark:border-white/5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Academic Portal</span>
              </div>
              <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 dark:text-white mb-8 leading-[1.05] tracking-tight">
                Academic <span className="gradient-text">Resource</span> <br className="hidden sm:block"/> Repository.
              </h2>
              <p className="text-base sm:text-2xl text-slate-500 dark:text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed px-4">
                Verified lecture materials and past examination papers for MUST Computer Science students.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center px-6">
                <button onClick={() => navigateTo('#/modules')} className="px-12 py-5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/20 hover:scale-[1.03] transition-all active:scale-95">
                  Browse Modules
                </button>
                <button onClick={() => navigateTo('#/about')} className="px-12 py-5 bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-white border border-slate-200 dark:border-white/5 rounded-full font-bold hover:bg-slate-50 transition-all active:scale-95">
                  About Gaka
                </button>
              </div>
            </div>

            {recentFiles.length > 0 && (
              <div className="w-full max-w-6xl mb-24 px-4">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">New Updates</h3>
                  <button onClick={() => navigateTo('#/modules')} className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest">View Registry</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {recentFiles.map((file, idx) => (
                    <RecentFileCard 
                      key={file.id} 
                      file={file} 
                      delay={idx * 100} 
                      onNavigate={navigateTo} 
                      moduleName={modules.find(m => m.id === file.moduleId)?.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
              <div className="px-1">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Modules</h2>
                <span className="text-slate-400 dark:text-white/40 font-semibold text-base">{filteredModules.length} Active Courses</span>
              </div>
              <div className="relative w-full lg:w-[480px]">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 dark:text-white/20" />
                <input 
                  type="text" 
                  placeholder="Filter courses..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-2xl sm:rounded-3xl outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm text-lg" 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {filteredModules.map((module, i) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ModuleCard module={module} onClick={() => navigateTo(`#/module/${module.id}`)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-32">
            <div className="mb-8"><button onClick={() => navigateTo('#/modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold uppercase tracking-widest text-xs hover:text-emerald-600"><BackIcon className="mr-3 w-6 h-6" />Back</button></div>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-900 p-8 sm:p-24 rounded-[3rem] text-white shadow-2xl mb-12 relative overflow-hidden">
               <div className="relative z-10">
                 <span className="bg-white/20 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 inline-block">{selectedModule.code}</span>
                 <h2 className="text-3xl sm:text-7xl font-extrabold mb-8 leading-tight tracking-tight">{selectedModule.name}</h2>
               </div>
            </div>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[3rem] p-8 sm:p-16 border dark:border-white/5">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
                <h3 className="text-2xl font-bold dark:text-white">Files</h3>
                <div className="flex bg-slate-100 dark:bg-black p-1.5 rounded-2xl w-full sm:w-auto">
                  {['All', 'Notes', 'Past Paper'].map((v) => (
                    <button key={v} onClick={() => setFilterType(v as any)} className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${filterType === v ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>{v === 'Past Paper' ? 'Gaka' : v}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.map((file, i) => (
                  <ResourceItem 
                    key={file.id} 
                    file={file} 
                    delay={i * 80} 
                    downloadingId={downloadingId} 
                    onDownload={handleDownloadClick} 
                    onShare={handleShare}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-4xl mx-auto py-12">
             <h2 className="text-4xl sm:text-7xl font-extrabold mb-12 dark:text-white">Academic <span className="gradient-text">Efficiency.</span></h2>
             <div className="space-y-12 text-slate-600 dark:text-white/60 text-lg leading-relaxed">
                <p className="text-2xl font-semibold dark:text-white/90">GAKA bridges the gap between students and their course materials at MUST.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-3xl border dark:border-white/5">
                    <h4 className="text-[10px] font-bold uppercase text-emerald-600 mb-4">Development</h4>
                    <p className="font-bold text-xl dark:text-white mb-2">Softlink Africa</p>
                    <p className="text-sm">Modern engineering optimized for student mobile environments.</p>
                  </div>
                  <div className="bg-emerald-600 text-white p-10 rounded-3xl">
                    <h4 className="text-[10px] font-bold uppercase opacity-60 mb-4">Lead Developer</h4>
                    <p className="font-bold text-xl mb-6">Cleven Sam</p>
                    <a href="https://wa.me/255685208576" className="inline-block bg-white/20 px-8 py-3 rounded-full text-[10px] font-bold uppercase">WhatsApp</a>
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-black border-t dark:border-white/5 py-12">
        <div className="container mx-auto px-8 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">G</div><span className="font-bold uppercase tracking-widest text-sm dark:text-white">Gaka Portal</span></div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} Softlink Africa | MUST ICT</p>
        </div>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;