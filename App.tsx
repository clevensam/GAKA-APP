import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, ViewIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { Analytics } from '@vercel/analytics/react';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

const transformToDirectDownload = (url: string): string => {
  if (!url || url === '#') return '#';
  const driveRegex = /\/file\/d\/([^/]+)\/(?:view|edit)/;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(LIVE_CSV_URL);
        if (!response.ok) throw new Error('Sync failed');
        
        const csvText = await response.text();
        const allRows = csvText.split(/\r?\n/).filter(row => row.trim() !== "");
        if (allRows.length < 2) throw new Error('No data found in sheet');

        const headers = allRows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        
        const colIdx = {
          code: headers.findIndex(h => h === 'module code' || h === 'code' || h.includes('module')),
          type: headers.findIndex(h => h === 'type'),
          title: headers.findIndex(h => h === 'title'),
          download: headers.findIndex(h => h === 'download url' || h === 'download link' || h === 'url'),
          view: headers.findIndex(h => h === 'view url' || h === 'preview url' || h === 'view link')
        };

        const rows = allRows.slice(1); 
        const moduleMap = new Map<string, Module>();
        MODULES_DATA.forEach(m => {
          moduleMap.set(m.code.replace(/\s+/g, '').toLowerCase(), { ...m, resources: [] });
        });

        const allExtractedFiles: (AcademicFile & { moduleCode: string; moduleId: string; rowIndex: number })[] = [];

        rows.forEach((row, index) => {
          const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val?.trim().replace(/^"|"$/g, ''));
          const moduleCode = parts[colIdx.code] || "";
          const typeStr = parts[colIdx.type] || "";
          const title = parts[colIdx.title] || "";
          const rawDownloadUrl = parts[colIdx.download] || "#";
          const rawViewUrl = colIdx.view !== -1 ? parts[colIdx.view] : rawDownloadUrl;

          const downloadUrl = transformToDirectDownload(rawDownloadUrl);
          const viewUrl = ensureViewUrl(rawViewUrl);
          
          if (!moduleCode) return;

          const normalizedSheetCode = moduleCode.replace(/\s+/g, '').toLowerCase();
          
          if (!moduleMap.has(normalizedSheetCode)) {
            moduleMap.set(normalizedSheetCode, {
              id: `dynamic-mod-${normalizedSheetCode}`,
              code: moduleCode.toUpperCase(),
              name: `Module ${moduleCode.toUpperCase()}`,
              description: 'Automatically discovered academic resource module.',
              resources: []
            });
          }

          const targetModule = moduleMap.get(normalizedSheetCode)!;
          const resource: AcademicFile = {
            id: `dynamic-res-${index}`,
            title: title || 'Academic Resource',
            type: (typeStr.toLowerCase().includes('note')) ? 'Notes' : 'Past Paper',
            downloadUrl: downloadUrl.startsWith('http') ? downloadUrl : '#',
            viewUrl: viewUrl.startsWith('http') ? viewUrl : '#',
            size: '---' 
          };
          
          targetModule.resources.unshift(resource);
          allExtractedFiles.push({ 
            ...resource, 
            moduleCode: targetModule.code, 
            moduleId: targetModule.id, 
            rowIndex: index 
          });
        });

        const finalModules = Array.from(moduleMap.values()).filter(m => m.resources.length > 0);
        setModules(finalModules);
        
        // Show only top 3 recently uploaded across all modules
        const topRecent = allExtractedFiles
          .sort((a, b) => b.rowIndex - a.rowIndex)
          .slice(0, 3);
        setRecentFiles(topRecent);

        setError(null);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Internal Server Error - Check Connection");
        setModules([]); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/modules') {
        setCurrentView('modules');
      } else if (hash === '#/about') {
        setCurrentView('about');
      } else if (hash.startsWith('#/module/')) {
        const moduleId = hash.split('/').pop();
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          setSelectedModule(module);
          setCurrentView('detail');
          setFilterType('All'); 
        } else if (modules.length > 0) {
          setCurrentView('modules');
        } else {
          setCurrentView('home');
        }
      } else {
        setCurrentView('home');
      }
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
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           m.code.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (downloadUrl === '#') {
      e.preventDefault();
      return;
    }
    setDownloadingId(fileId);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  const ResourceItem: React.FC<{ file: AcademicFile; moduleCode?: string; delay: number }> = ({ file, moduleCode, delay }) => (
    <div 
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-7 bg-white hover:bg-slate-50/50 border border-slate-100 hover:border-emerald-100 rounded-3xl transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center space-x-5 mb-5 sm:mb-0">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-105 ${
          file.type === 'Notes' ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600'
        }`}>
          <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {moduleCode && (
              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                {moduleCode}
              </span>
            )}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
              {file.type === 'Notes' ? 'Note' : 'Gaka'}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 text-base sm:text-lg leading-tight break-words pr-4 group-hover:text-emerald-900 transition-colors">
            {file.title}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleShare(file.title)}
            className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all active:scale-90 border border-transparent hover:border-emerald-100"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          <a 
            href={file.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-2xl transition-all active:scale-90"
          >
            <ViewIcon className="w-5 h-5" />
          </a>
        </div>
        
        <a 
          href={file.downloadUrl} 
          onClick={(e) => handleDownloadClick(e, file.id, file.downloadUrl)}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-3 px-6 py-4 sm:px-8 sm:py-4 font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-95 ${
            downloadingId === file.id 
            ? 'bg-slate-800 text-white shadow-none cursor-default' 
            : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'
          }`}
        >
          {downloadingId === file.id ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <DownloadIcon className="w-4 h-4" />
              <span>Download</span>
            </>
          )}
        </a>
      </div>
    </div>
  );

  const RecentFileCard: React.FC<{ file: AcademicFile & { moduleCode: string; moduleId: string }; delay: number }> = ({ file, delay }) => {
    const module = modules.find(m => m.id === file.moduleId);
    const moduleName = module ? module.name : file.moduleCode;

    return (
      <div 
        className="group bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-100 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col h-full animate-fade-in relative overflow-hidden"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl uppercase tracking-tighter">
              {file.moduleCode}
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${file.type === 'Notes' ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
        </div>
        
        <div className="flex-grow">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 line-clamp-1">{moduleName}</h4>
          <h3 className="text-xl font-bold text-slate-800 leading-[1.2] mb-8 line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {file.title}
          </h3>
        </div>

        <a 
          href={file.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 bg-slate-50 text-slate-600 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 border border-slate-100 group-hover:border-transparent"
        >
          <span>View</span>
          <ViewIcon className="w-4 h-4" />
        </a>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 border-[4px] border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-100 animate-pulse">G</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <Navbar 
        onLogoClick={() => navigateTo('#/home')} 
        onHomeClick={() => navigateTo('#/home')}
        onDirectoryClick={() => navigateTo('#/modules')}
      />

      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8">
        {currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in px-1">
            <button onClick={() => navigateTo('#/home')} className="hover:text-emerald-600 transition-colors">Home</button>
            <ChevronRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
            {currentView === 'modules' && <span className="text-slate-900 font-bold">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 font-bold">About</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('#/modules')} className="hover:text-emerald-600 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
                <span className="text-slate-900 font-bold">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}

        {error && (
          <div className="mb-12 p-6 bg-amber-50/50 border border-amber-100 rounded-3xl text-amber-800 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="relative flex h-3 w-3 mr-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <p>{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="bg-white px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 border border-amber-100 font-semibold">Try Again</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center">
            {/* Hero Section */}
            <div className="text-center pt-4 pb-16 lg:pt-32">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full mb-8 border border-emerald-100/50 animate-slide-in">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">MUST CS Portal</span>
              </div>
              
              <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 mb-8 max-w-6xl mx-auto leading-[1.1] sm:leading-[1.05] tracking-tight break-words px-2 text-center">
                Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
              </h2>
              
              <p className="text-base sm:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 font-normal leading-relaxed px-4 text-center">
                Verified lecture materials, modules, and past examination papers for Computer Science students.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 justify-center">
                <button 
                  onClick={() => navigateTo('#/modules')}
                  className="group flex items-center justify-center px-10 py-5 sm:px-16 sm:py-6 bg-emerald-600 text-white rounded-full font-bold text-sm sm:text-base shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.03] transition-all duration-300 active:scale-95"
                >
                  Access Modules
                  <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
                <button 
                  onClick={() => navigateTo('#/about')}
                  className="px-10 py-5 sm:px-16 sm:py-6 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-sm sm:text-base hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm active:scale-95"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Recently Added Section - Dynamic and Vertical cards */}
            {recentFiles.length > 0 && (
              <div className="w-full max-w-6xl mb-8 px-4 animate-fade-in">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center space-x-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Recently Uploaded</h3>
                  </div>
                  <button 
                    onClick={() => navigateTo('#/modules')}
                    className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    View All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  {recentFiles.map((file, idx) => (
                    <RecentFileCard key={file.id} file={file} delay={idx * 100} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Features Section Heading */}
            <div className="w-full max-w-5xl mb-12 px-4 text-left sm:text-center mt-6 sm:mt-8">
              <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mb-4">Core Principles</h3>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Our Core Pillars</h2>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 w-full max-w-6xl px-4 pb-20">
              {[
                { title: 'Open Access', text: 'Built for students, by students. Completely free of charge and always accessible.', icon: '01' },
                { title: 'Live Registry', text: 'Directly synchronized with departmental cloud for real-time resource updates.', icon: '02' },
                { title: 'Seamless Flow', text: 'Zero barriers to entry. No registration, no login, just pure education.', icon: '03' }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 text-left group">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 rounded-[1.2rem] flex items-center justify-center text-slate-400 mb-6 sm:mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                    <span className="text-lg sm:text-xl font-bold">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 text-sm sm:text-base font-normal leading-relaxed">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-5xl mx-auto py-4 sm:py-12">
            <div className="bg-white rounded-[2rem] sm:rounded-[3.5rem] p-8 sm:p-24 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-50 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 opacity-50"></div>
               <h2 className="text-3xl sm:text-7xl font-extrabold text-slate-900 mb-8 sm:mb-12 leading-tight tracking-tight relative break-words">Academic <span className="gradient-text">Efficiency.</span></h2>
               <div className="space-y-10 sm:space-y-16 text-slate-600 leading-relaxed text-base sm:text-lg font-normal relative">
                <section>
                  <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mb-4 sm:mb-6">Our Objective</h3>
                  <p className="text-xl sm:text-3xl font-semibold text-slate-800 tracking-tight leading-snug">GAKA bridges the gap between students and their course materials.</p>
                  <p className="mt-6 sm:mt-8">By providing a unified interface for Mbeya University of Science and Technology (MUST) resources, we ensure that focus remains on learning rather than logistics.</p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  <div className="bg-slate-50 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Development</h4>
                    <p className="text-slate-900 font-bold text-lg sm:text-xl mb-1">Softlink Africa</p>
                    <p className="text-sm sm:text-base font-normal">Modern engineering optimized for MUST mobile environments.</p>
                  </div>
                  <div className="bg-emerald-600 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl shadow-emerald-100 group">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-3">Lead Developer</h4>
                    <p className="font-bold text-xl sm:text-2xl mb-4">Cleven Sam</p>
                    <a href="https://wa.me/255685208576" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-6 py-2.5 sm:px-8 sm:py-3 rounded-full hover:bg-white/30 transition-all active:scale-95">WhatsApp Connect</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8 sm:gap-10">
              <div className="space-y-3 sm:space-y-4 px-1">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Modules</h2>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex bg-emerald-100/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-200/30">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Live Feed</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                  <span className="text-slate-400 font-semibold text-sm sm:text-base tracking-tight">{filteredModules.length} Modules Found</span>
                </div>
              </div>
              <div className="relative w-full lg:w-[480px] group px-1">
                <div className="absolute inset-y-0 left-6 sm:left-8 flex items-center pointer-events-none">
                  <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="text" placeholder="Search course..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 sm:pl-20 pr-6 py-5 sm:py-7 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 outline-none transition-all shadow-sm hover:shadow-md text-lg sm:text-xl font-medium placeholder:text-slate-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
              {filteredModules.map((module, i) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ModuleCard module={module} onClick={() => navigateTo(`#/module/${module.id}`)} />
                </div>
              ))}
              {filteredModules.length === 0 && (
                <div className="col-span-full py-16 sm:py-24 text-center">
                  <p className="text-slate-400 font-medium text-base sm:text-lg italic px-4">
                    {modules.length === 0 ? "Synchronizing with cloud registry..." : "No matching modules found."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20 sm:pb-32">
            <div className="mb-6 sm:mb-10 px-1">
               <button onClick={() => navigateTo('#/modules')} className="flex items-center text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-widest hover:text-emerald-600 transition-all group">
                <BackIcon className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1.5 transition-transform" />
                Back to Modules
              </button>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 sm:p-24 rounded-[2rem] sm:rounded-[3.5rem] text-white shadow-2xl shadow-emerald-100 mb-8 sm:mb-12 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8 sm:mb-10">
                  <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.code}</span>
                  <span className="bg-black/10 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">{selectedModule.resources.length} Assets</span>
                </div>
                <h2 className="text-3xl sm:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight sm:leading-[1.05] tracking-tight max-w-4xl break-words">{selectedModule.name}</h2>
              </div>
            </div>
            <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] p-6 sm:p-16 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 sm:mb-12">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">Resources</h3>
                <div className="flex bg-slate-100/50 p-1 rounded-2xl w-full sm:w-fit animate-fade-in shadow-inner">
                  {['All', 'Notes', 'Past Paper'].map((v) => (
                    <button key={v} onClick={() => setFilterType(v as any)} className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all ${filterType === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}>{v === 'Past Paper' ? 'Gaka' : v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {filteredResources.map((file, i) => (
                  <ResourceItem key={file.id} file={file} delay={i * 80} />
                ))}
                {filteredResources.length === 0 && (
                  <div className="text-center py-16 sm:py-24 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 px-4">
                     <p className="text-slate-400 font-medium text-base italic">No resources matched your filter criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-50 py-12">
        <div className="container mx-auto px-6 sm:px-8 max-w-7xl text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg">G</div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">GAKA Portal</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-sm leading-relaxed mx-auto md:mx-0">Centralized academic hub for MUST Computer Science students.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-sm">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Connect</h4>
                <a href="https://wa.me/255685208576" className="block text-slate-600 hover:text-emerald-600 transition-colors font-medium">+255 685 208 576</a>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Developer</h4>
                <p className="text-slate-900 font-bold">Cleven Sam</p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-300 text-[9px] font-bold uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} Softlink Africa | MUST Engineering</p>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
};

export default App;