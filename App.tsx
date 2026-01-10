import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { RecentFileCard } from './components/RecentFileCard';
import { ResourceItem } from './components/ResourceItem';
import { Footer } from './components/Footer';
import { SearchIcon, BackIcon, DownloadIcon, FileIcon, ChevronRightIcon, BookOpenIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { transformToDirectDownload, ensureViewUrl } from './utils/drive';
import { Analytics } from '@vercel/analytics/react';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

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
  
  // Theme state initialized from localStorage
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gaka-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Persist theme changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gaka-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gaka-theme', 'light');
    }
  }, [isDark]);

  const fetchData = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(LIVE_CSV_URL);
      if (!response.ok) throw new Error('Registry unreachable.');
      
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
            description: 'Resource repository.',
            resources: []
          });
        }
        
        const targetModule = moduleMap.get(normalizedCode)!;
        const resource: AcademicFile = {
          id: `res-${index}`,
          title: title || 'Resource',
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
      setRecentFiles(allExtractedFiles.sort((a, b) => b.rowIndex - a.rowIndex).slice(0, 3));
      setError(null);
    } catch (err: any) {
      console.warn("Registry Sync Error:", err);
      setError("Running in offline mode. Updates unavailable.");
      setModules(MODULES_DATA.filter(m => m.resources.length > 0));
    } finally {
      const elapsedTime = Date.now() - startTime;
      const minDelay = 800;
      const remainingTime = Math.max(0, minDelay - elapsedTime);
      setTimeout(() => setIsLoading(false), remainingTime);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/modules') setCurrentView('modules');
      else if (hash === '#/about') setCurrentView('about');
      else if (hash.startsWith('#/module/')) {
        const moduleId = hash.split('/').pop();
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          setSelectedModule(module);
          setCurrentView('detail');
          setFilterType('All'); 
        } else if (modules.length > 0) setCurrentView('modules');
        else setCurrentView('home');
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

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, fileId: string, downloadUrl: string) => {
    if (downloadUrl === '#') { e.preventDefault(); return; }
    setDownloadingId(fileId);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-[3px] border-slate-100 dark:border-white/5 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-100 dark:shadow-emerald-900/40 animate-pulse">G</div>
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
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8 transition-colors duration-500">
        {/* Breadcrumbs */}
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] sm:text-[14px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in px-1">
            <button onClick={() => navigateTo('#/home')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</button>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-white/90 font-bold">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-white/90 font-bold">About</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('#/modules')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 dark:text-white/10 flex-shrink-0" />
                <span className="text-slate-900 dark:text-white/90 font-bold">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-12 p-6 bg-amber-50/50 dark:bg-[#1E1E1E] border border-amber-100 dark:border-amber-900/30 rounded-3xl text-amber-800 dark:text-amber-400 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-4"></span>
              <div className="flex flex-col"><p className="font-bold">Registry Sync Info</p><p className="opacity-80">{error}</p></div>
            </div>
            <button onClick={() => fetchData()} className="bg-white dark:bg-[#282828] px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-white/5 font-semibold">Retry Sync</button>
          </div>
        )}

        {/* Home View */}
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
                <button onClick={() => navigateTo('#/modules')} className="group flex items-center justify-center px-10 py-5 sm:px-16 sm:py-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/10 hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:scale-[1.03] transition-all duration-300 active:scale-95">
                  Access Modules <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
                <button onClick={() => navigateTo('#/about')} className="px-10 py-5 sm:px-16 sm:py-6 bg-white dark:bg-[#1E1E1E] text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/5 rounded-full font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-[#282828] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 shadow-sm active:scale-95">
                  Learn More
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
                  <button onClick={() => navigateTo('#/modules')} className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
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
            {/* Services Section */}
            <div className="w-full max-w-5xl mb-12 px-4 text-left sm:text-center mt-6 sm:mt-8"><h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white/90 tracking-tight">Our Services</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 w-full max-w-6xl px-4 pb-20">
              {[
                { title: 'Material Distribution', text: 'Seamless delivery of lecture notes and academic modules directly to your device.', icon: <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8" /> },
                { title: 'One-Tap Downloads', text: 'Accelerated file retrieval engine that bypasses secondary login prompts and redirects.', icon: <DownloadIcon className="w-6 h-6 sm:w-8 sm:h-8" /> },
                { title: 'Exam Preparation', text: 'Extensive archive of verified past examination papers (Gaka) to enhance your revision process.', icon: <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" /> }
              ].map((service, idx) => (
                <div key={idx} className="bg-white dark:bg-[#1E1E1E] p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 text-left group">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-[#282828] rounded-[1.2rem] flex items-center justify-center text-slate-400 dark:text-white/40 mb-6 sm:mb-8 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">{service.icon}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white/90 mb-3 sm:mb-4 tracking-tight">{service.title}</h3>
                  <p className="text-slate-500 dark:text-white/60 text-sm sm:text-base font-normal leading-relaxed">{service.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modules Grid View */}
        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8 sm:gap-10">
              <div className="space-y-3 sm:space-y-4 px-1">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white/90 tracking-tight">Modules</h2>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex bg-emerald-100/50 dark:bg-[#1E1E1E] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-200/30 dark:border-white/5 shadow-sm">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Live Feed</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10"></div>
                  <span className="text-slate-400 dark:text-white/40 font-semibold text-sm sm:text-base tracking-tight">{filteredModules.length} Modules Found</span>
                </div>
              </div>
              <div className="relative w-full lg:w-[480px] group px-1">
                <div className="absolute inset-y-0 left-6 sm:left-8 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 sm:w-6 h-6 text-slate-300 dark:text-white/20 group-focus-within:text-emerald-500 transition-colors" /></div>
                <input type="text" placeholder="Search course..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 sm:pl-20 pr-6 py-5 sm:py-7 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-white/5 rounded-2xl sm:rounded-3xl focus:ring-8 focus:ring-emerald-50 dark:focus:ring-emerald-500/5 focus:border-emerald-300 dark:focus:border-emerald-500 outline-none transition-all shadow-sm hover:shadow-md text-lg sm:text-xl font-medium placeholder:text-slate-200 dark:placeholder:text-white/10 text-slate-900 dark:text-white/90" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
              {filteredModules.map((module, i) => <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}><ModuleCard module={module} onClick={() => navigateTo(`#/module/${module.id}`)} /></div>)}
              {filteredModules.length === 0 && <div className="col-span-full py-16 sm:py-24 text-center"><p className="text-slate-400 dark:text-white/20 font-medium text-base sm:text-lg italic px-4">{modules.length === 0 ? "Synchronizing with cloud registry..." : "No matching modules found."}</p></div>}
            </div>
          </div>
        )}

        {/* Module Detail View */}
        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20 sm:pb-32">
            <div className="mb-8 px-1"><button onClick={() => navigateTo('#/modules')} className="flex items-center text-slate-800 dark:text-white/60 font-bold text-[13px] sm:text-[14px] uppercase tracking-widest hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"><BackIcon className="mr-3 w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-2 transition-transform" />Back to Modules</button></div>
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-950 p-8 sm:p-24 rounded-[2rem] sm:rounded-[3.5rem] text-white shadow-2xl shadow-emerald-100 dark:shadow-none mb-8 sm:mb-12 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8 sm:mb-10">
                  <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.code}</span>
                  <span className="bg-black/10 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.resources.length} Files</span>
                </div>
                <h2 className="text-3xl sm:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight sm:leading-[1.05] tracking-tight max-w-4xl break-words">{selectedModule.name}</h2>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-16 shadow-sm border border-slate-100 dark:border-white/5 transition-colors duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 sm:mb-12">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white/90">Resources</h3>
                <div className="flex bg-slate-100/50 dark:bg-black/40 p-1.5 rounded-2xl w-full sm:w-fit animate-fade-in shadow-inner border dark:border-white/5">
                  {['All', 'Notes', 'Past Paper'].map((v) => <button key={v} onClick={() => setFilterType(v as any)} className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg dark:shadow-emerald-900/10' : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/80'}`}>{v === 'Past Paper' ? 'Gaka' : v.toUpperCase()}</button>)}
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
                {filteredResources.length === 0 && <div className="text-center py-16 sm:py-24 bg-slate-50/50 dark:bg-black/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 px-4"><p className="text-slate-400 dark:text-white/20 font-medium text-base italic">No resources matched your filter criteria.</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* About View */}
        {currentView === 'about' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-4 sm:py-12">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-24 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-50 dark:bg-emerald-400/5 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 opacity-50 transition-colors"></div>
               <h2 className="text-3xl sm:text-7xl font-extrabold text-slate-900 dark:text-white/90 mb-8 sm:mb-12 leading-tight tracking-tight relative break-words">Academic <span className="gradient-text">Efficiency.</span></h2>
               <div className="space-y-10 sm:space-y-16 text-slate-600 dark:text-white/60 leading-relaxed text-base sm:text-lg font-normal relative">
                <section>
                  <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-4 sm:mb-6">Our Objective</h3>
                  <p className="text-xl sm:text-3xl font-semibold text-slate-800 dark:text-white/90 tracking-tight leading-snug">GAKA bridges the gap between students and their course materials.</p>
                  <p className="mt-6 sm:mt-8">By providing a unified interface for Mbeya University of Science and Technology (MUST) resources, we ensure that focus remains on learning rather than logistics.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  <div className="bg-slate-50 dark:bg-[#282828] p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3">Development</h4>
                    <p className="text-slate-900 dark:text-white font-bold text-lg sm:text-xl mb-1">Softlink Africa</p>
                    <p className="text-sm sm:text-base font-normal">Modern engineering optimized for MUST mobile environments.</p>
                  </div>
                  <div className="bg-emerald-600 dark:bg-emerald-500 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl shadow-emerald-100 dark:shadow-emerald-900/10 group">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/60 mb-3">Lead Developer</h4>
                    <p className="font-bold text-xl sm:text-2xl mb-4">Cleven Sam</p>
                    <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-6 py-2.5 sm:px-8 sm:py-3 rounded-full hover:bg-white/30 transition-all active:scale-95 shadow-sm">WhatsApp Connect</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <Analytics />
    </div>
  );
};

export default App;
