import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, BookOpenIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

// Helper to convert Google Drive "view" links to "direct download" links
const transformToDirectDownload = (url: string): string => {
  if (!url || url === '#') return '#';
  const driveRegex = /\/file\/d\/([^/]+)\/(?:view|edit)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
};

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
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

        // Extract headers to find column indices dynamically
        const headers = allRows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        
        const colIdx = {
          code: headers.findIndex(h => h === 'module code' || h === 'code' || h.includes('module')),
          type: headers.findIndex(h => h === 'type'),
          title: headers.findIndex(h => h === 'title'),
          download: headers.findIndex(h => h === 'download url' || h === 'download link' || h === 'url')
        };

        const rows = allRows.slice(1); 
        const skeletonModules: Module[] = MODULES_DATA.map(m => ({
          ...m,
          resources: [] 
        }));

        rows.forEach((row, index) => {
          const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val?.trim().replace(/^"|"$/g, ''));
          
          const moduleCode = parts[colIdx.code] || "";
          const typeStr = parts[colIdx.type] || "";
          const title = parts[colIdx.title] || "";
          const rawUrl = parts[colIdx.download] || "#";
          const downloadUrl = transformToDirectDownload(rawUrl);
          
          if (!moduleCode) return;

          const normalizedSheetCode = moduleCode.replace(/\s+/g, '').toLowerCase();
          
          const targetModule = skeletonModules.find(
            m => m.code.replace(/\s+/g, '').toLowerCase() === normalizedSheetCode
          );

          if (targetModule) {
            const resource: AcademicFile = {
              id: `dynamic-${index}`,
              title: title || 'Academic Resource',
              type: (typeStr.toLowerCase().includes('note')) ? 'Notes' : 'Past Paper',
              downloadUrl: downloadUrl.startsWith('http') ? downloadUrl : '#',
              size: '---' 
            };
            targetModule.resources.push(resource);
          }
        });

        const activeModules = skeletonModules.filter(m => m.resources.length > 0);
        setModules(activeModules);
        setError(null);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Synchronizing failed. No live data available.");
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
    return selectedModule.resources.filter(r => 
      filterType === 'All' || r.type === filterType
    );
  }, [selectedModule, filterType]);

  const handleShare = (resourceTitle: string) => {
    const url = window.location.href;
    const shareMessage = `Academic Resource from *GAKA Portal*: \n\n📄 *${resourceTitle}*\n🔗 ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, file: AcademicFile) => {
    if (file.downloadUrl === '#') {
      e.preventDefault();
      return;
    }
    
    // Set downloading state for animation
    setDownloadingId(file.id);
    
    // Reset after a few seconds (simulating start of stream)
    setTimeout(() => {
      setDownloadingId(null);
    }, 3000);
  };

  const Breadcrumbs = () => (
    <nav className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in">
      <button onClick={() => navigateTo('#/home')} className="hover:text-emerald-600 transition-colors">Home</button>
      <ChevronRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
      {currentView === 'modules' && <span className="text-slate-900 font-bold">Directory</span>}
      {currentView === 'about' && <span className="text-slate-900 font-bold">About</span>}
      {currentView === 'detail' && (
        <>
          <button onClick={() => navigateTo('#/modules')} className="hover:text-emerald-600 transition-colors">Directory</button>
          <ChevronRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <span className="text-slate-900 font-bold">{selectedModule?.code}</span>
        </>
      )}
    </nav>
  );

  const FilterTabs = () => (
    <div className="flex bg-slate-100/50 p-1 rounded-2xl w-full sm:w-fit mb-8 animate-fade-in shadow-inner">
      {[
        { label: 'ALL', value: 'All' },
        { label: 'Notes', value: 'Notes' },
        { label: 'Gaka', value: 'Past Paper' }
      ].map((tab) => (
        <button
          key={tab.value}
          onClick={() => setFilterType(tab.value as any)}
          className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 ${
            filterType === tab.value 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 border-[4px] border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-100 animate-pulse">G</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar 
        onLogoClick={() => navigateTo('#/home')} 
        onHomeClick={() => navigateTo('#/home')}
        onDirectoryClick={() => navigateTo('#/modules')}
      />

      <main className="flex-grow container mx-auto max-w-7xl px-5 py-8 sm:py-12 sm:px-8">
        {currentView !== 'home' && <Breadcrumbs />}

        {error && (
          <div className="mb-12 p-6 bg-amber-50/50 border border-amber-100 rounded-3xl text-amber-800 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
            <div className="flex items-center">
              <span className="relative flex h-3 w-3 mr-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <p>{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="bg-white px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 border border-amber-100 font-semibold">Retry Sync</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center text-center pt-8 pb-16 lg:pt-32">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full mb-8 border border-emerald-100/50 animate-slide-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">MUST CS Portal</span>
            </div>
            
            <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 mb-8 max-w-6xl leading-[1.1] sm:leading-[1.05] tracking-tight break-words">
              Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
            </h2>
            
            <p className="text-base sm:text-2xl text-slate-500 max-w-3xl mb-12 font-normal leading-relaxed px-2">
              Verified lecture materials, modules, and past examination papers for Computer Science students.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
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
            
            <div className="mt-20 sm:mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 w-full max-w-6xl">
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
          <div className="animate-fade-in max-w-5xl mx-auto py-8 sm:py-12">
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-24 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-50 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 opacity-50"></div>
               
               <h2 className="text-4xl sm:text-7xl font-extrabold text-slate-900 mb-8 sm:mb-12 leading-tight tracking-tight relative break-words">
                Academic <span className="gradient-text">Efficiency.</span>
              </h2>
              
              <div className="space-y-10 sm:space-y-16 text-slate-600 leading-relaxed text-base sm:text-lg font-normal relative">
                <section>
                  <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mb-4 sm:mb-6">Our Objective</h3>
                  <p className="text-xl sm:text-3xl font-semibold text-slate-800 tracking-tight leading-snug">
                    GAKA bridges the gap between students and their course materials.
                  </p>
                  <p className="mt-6 sm:mt-8">
                    By providing a unified interface for Mbeya University of Science and Technology (MUST) resources, we ensure that focus remains on learning rather than logistics.
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                  <div className="bg-slate-50 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Development</h4>
                    <p className="text-slate-900 font-bold text-lg sm:text-xl mb-1">Softlink Africa</p>
                    <p className="text-sm sm:text-base font-normal">Modern engineering optimized for MUST mobile environments.</p>
                  </div>
                  <div className="bg-emerald-600 p-8 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-xl shadow-emerald-100 group">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-3">Lead Developer</h4>
                    <p className="font-bold text-xl sm:text-2xl mb-4">Cleven Samwel</p>
                    <a 
                      href="https://wa.me/255685208576" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-6 py-2.5 sm:px-8 sm:py-3 rounded-full hover:bg-white/30 transition-all active:scale-95"
                    >
                      WhatsApp Connect
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 sm:mb-16 gap-8 sm:gap-10">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">Modules</h2>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex bg-emerald-100/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-emerald-200/30">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Available Modules</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                  <span className="text-slate-400 font-semibold text-sm sm:text-base tracking-tight">{filteredModules.length} Modules</span>
                </div>
              </div>
              
              <div className="relative w-full lg:w-[480px] group">
                <div className="absolute inset-y-0 left-6 sm:left-8 flex items-center pointer-events-none">
                  <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Find your course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 sm:pl-20 pr-6 py-5 sm:py-7 bg-white border border-slate-100 rounded-[1.5rem] sm:rounded-3xl focus:ring-8 focus:ring-emerald-50 focus:border-emerald-300 outline-none transition-all shadow-sm hover:shadow-md text-lg sm:text-xl font-medium placeholder:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {filteredModules.map((module, i) => (
                <div key={module.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ModuleCard 
                    module={module} 
                    onClick={() => navigateTo(`#/module/${module.id}`)} 
                  />
                </div>
              ))}
              {filteredModules.length === 0 && (
                <div className="col-span-full py-16 sm:py-24 text-center">
                  <p className="text-slate-400 font-medium text-base sm:text-lg italic">
                    {modules.length === 0 ? "The registry is currently empty." : "No matching modules found in the registry."}
                  </p>
                  {modules.length > 0 && (
                    <button onClick={() => { setSearchQuery(''); }} className="mt-4 text-emerald-600 font-bold hover:underline">Clear Search</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20 sm:pb-32">
            <div className="mb-8 sm:mb-10">
               <button 
                onClick={() => navigateTo('#/modules')}
                className="flex items-center text-slate-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-widest hover:text-emerald-600 transition-all group"
              >
                <BackIcon className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1.5 transition-transform" />
                Return to Modules
              </button>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-8 sm:p-24 rounded-[2.5rem] sm:rounded-[3.5rem] text-white shadow-2xl shadow-emerald-100 mb-8 sm:mb-12 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                  <span className="bg-white/15 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">
                    {selectedModule.code}
                  </span>
                  <span className="bg-black/10 backdrop-blur-md px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">
                    {selectedModule.resources.length} Academic Assets
                  </span>
                </div>
                <h2 className="text-3xl sm:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight sm:leading-[1.05] tracking-tight max-w-4xl break-words">{selectedModule.name}</h2>
                <p className="text-emerald-50/70 text-base sm:text-xl max-w-3xl font-normal leading-relaxed">
                  Verified resources synchronized with the official course registry.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-20 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8 mb-10 sm:mb-12">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">Resources</h3>
                <FilterTabs />
              </div>

              <div className="space-y-5 sm:space-y-6">
                {filteredResources.map((file, i) => (
                  <div 
                    key={file.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 bg-[#fcfdfe] hover:bg-white border border-slate-50 hover:border-emerald-100 rounded-[1.5rem] sm:rounded-3xl transition-all duration-500 hover:shadow-xl hover:shadow-emerald-50/30 animate-fade-in"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center space-x-5 sm:space-x-8 mb-6 sm:mb-0">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-105 ${
                        file.type === 'Notes' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-teal-50 text-teal-600'
                      }`}>
                        <FileIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-lg sm:text-2xl leading-tight break-words sm:truncate group-hover:text-emerald-900 transition-colors">
                          {file.title}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 sm:mt-2 block ${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
                          {file.type === 'Notes' ? 'Lecture Notes' : 'Gaka'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-start space-x-4">
                      <button 
                        onClick={() => handleShare(file.title)}
                        className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-full transition-all"
                      >
                        <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <a 
                        href={file.downloadUrl} 
                        onClick={(e) => handleDownloadClick(e, file)}
                        className={`relative overflow-hidden flex flex-1 sm:flex-none items-center justify-center space-x-3 sm:space-x-4 px-8 py-3.5 sm:px-12 sm:py-5 font-bold text-[12px] sm:text-[14px] rounded-[1rem] sm:rounded-2xl transition-all shadow-xl active:scale-95 ${
                          downloadingId === file.id 
                          ? 'bg-slate-800 text-white shadow-slate-100 cursor-default' 
                          : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'
                        }`}
                      >
                        {downloadingId === file.id ? (
                          <>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <span>Starting...</span>
                          </>
                        ) : (
                          <>
                            <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Download</span>
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                ))}
                {filteredResources.length === 0 && (
                  <div className="text-center py-16 sm:py-20 bg-slate-50/50 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed border-slate-200 px-4">
                     <p className="text-slate-400 font-medium text-sm sm:text-base italic">No files available in this category.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-50 py-12 sm:py-16">
        <div className="container mx-auto px-6 sm:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 sm:gap-12">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg">G</div>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 uppercase">GAKA Portal</span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-sm leading-relaxed">
                A streamlined hub for MUST students to access essential course documentation and archived examination papers.
              </p>
              <div className="pt-1 sm:pt-2">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Designed by</p>
                <p className="text-slate-900 font-extrabold text-base sm:text-lg">Cleven Sam</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 w-full md:w-auto">
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Enquiries</h4>
                <a 
                  href="mailto:clevensamwel@gmail.com" 
                  className="block text-slate-600 hover:text-emerald-600 transition-colors font-medium text-sm sm:text-base break-all"
                >
                  clevensamwel@gmail.com
                </a>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">WhatsApp</h4>
                <a 
                  href="https://wa.me/255685208576" 
                  className="block text-slate-600 hover:text-emerald-600 transition-colors font-medium text-sm sm:text-base"
                >
                  +255 685 208 576
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-300 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} Softlink Africa | MUST Engineering
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
