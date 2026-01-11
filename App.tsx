import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChevronRightIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';
import { transformToDirectDownload, ensureViewUrl } from './utils/drive';
import { Analytics } from '@vercel/analytics/react';

// Pages
import { Home } from './pages/Home';
import { Modules } from './pages/Modules';
import { ModuleDetail } from './pages/ModuleDetail';
import { About } from './pages/About';
import { ErrorPage } from './pages/Error';

const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";
const CACHE_KEY = 'gaka_registry_cache';

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [recentFiles, setRecentFiles] = useState<(AcademicFile & { moduleCode: string; moduleId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'modules' | 'detail' | 'about'>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gaka-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gaka-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gaka-theme', 'light');
    }
  }, [isDark]);

  // Load cached data immediately on mount for instant mobile responsiveness
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { modules: cachedModules, recentFiles: cachedRecent } = JSON.parse(cached);
        if (cachedModules && cachedModules.length > 0) {
          setModules(cachedModules);
          setRecentFiles(cachedRecent);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Cache parsing failed", e);
      }
    }
  }, []);

  // Dynamic SEO Metadata Handler
  useEffect(() => {
    let title = "GAKA | MUST CS Academic Resource Hub";
    let description = "Access Mbeya University of Science and Technology (MUST) Computer Science lecture notes and past papers.";

    if (currentView === 'modules') {
      title = "Browse Modules | GAKA Portal";
      description = "Explore all available Computer Science modules and academic resources at MUST.";
    } else if (currentView === 'detail' && selectedModule) {
      title = `${selectedModule.code} - ${selectedModule.name} | GAKA`;
      description = `Download notes and past papers for ${selectedModule.name} (${selectedModule.code}) at MUST.`;
    } else if (currentView === 'about') {
      title = "About GAKA | Academic Efficiency";
      description = "Learn about the mission of GAKA Portal and the team behind MUST's academic resource hub.";
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
  }, [currentView, selectedModule]);

  const fetchData = async () => {
    const startTime = Date.now();
    try {
      setIsSyncing(true);
      setError(null);
      
      // Add cache-busting timestamp to bypass aggressive mobile ISP/browser caching
      const fetchUrl = `${LIVE_CSV_URL}&t=${Date.now()}`;
      
      const response = await fetch(fetchUrl, {
        cache: 'no-cache', // Force fresh data on mobile
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error('Cloud registry server unreachable.');
      
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
      
      if (colIdx.code === -1 || colIdx.title === -1) throw new Error('Invalid registry format.');
      
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
      const finalRecent = allExtractedFiles.sort((a, b) => b.rowIndex - a.rowIndex).slice(0, 3);
      
      setModules(finalModules);
      setRecentFiles(finalRecent);
      setError(null);
      
      // Update persistent cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        modules: finalModules,
        recentFiles: finalRecent,
        timestamp: Date.now()
      }));
      
    } catch (err: any) {
      console.warn("Registry Sync Error:", err);
      // Only show error if we have no data at all (neither memory nor cache)
      if (modules.length === 0) {
        setError(err.message || "Network error. Please check your data connection.");
      }
    } finally {
      const remainingTime = Math.max(0, 1000 - (Date.now() - startTime));
      setTimeout(() => {
        setIsLoading(false);
        setIsSyncing(false);
      }, remainingTime);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/modules') {
        setCurrentView('modules');
      } else if (path === '/about') {
        setCurrentView('about');
      } else if (path.startsWith('/module/')) {
        const moduleId = path.split('/').pop();
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
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [modules]);

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [modules, searchQuery]);

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

  if (isLoading && modules.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-[3px] border-slate-100 dark:border-white/5 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg animate-pulse">G</div>
          </div>
        </div>
      </div>
    );
  }

  const isFatalError = error && modules.length === 0;

  return (
    <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-500 ${isDark ? 'dark bg-black' : 'bg-[#fcfdfe]'}`}>
      <Navbar 
        onLogoClick={() => navigateTo('/')} 
        onHomeClick={() => navigateTo('/')} 
        onDirectoryClick={() => navigateTo('/modules')}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
      />
      
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12">
        {!isFatalError && currentView !== 'home' && (
          <nav className="flex items-center space-x-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/30 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
            <button onClick={() => navigateTo('/')} className="hover:text-emerald-600 transition-colors">Home</button>
            <ChevronRightIcon className="w-3 h-3 opacity-30" />
            {currentView === 'modules' && <span className="text-slate-900 dark:text-white/90">Modules</span>}
            {currentView === 'about' && <span className="text-slate-900 dark:text-white/90">About</span>}
            {currentView === 'detail' && (
              <>
                <button onClick={() => navigateTo('/modules')} className="hover:text-emerald-600 transition-colors">Modules</button>
                <ChevronRightIcon className="w-3 h-3 opacity-30" />
                <span className="text-slate-900 dark:text-white/90">{selectedModule?.code}</span>
              </>
            )}
          </nav>
        )}

        {isFatalError ? (
          <ErrorPage message={error} onRetry={fetchData} isRetrying={isSyncing} onGoHome={() => navigateTo('/')} />
        ) : (
          <>
            {currentView === 'home' && <Home recentFiles={recentFiles} modules={modules} onNavigate={navigateTo} />}
            {currentView === 'modules' && <Modules filteredModules={filteredModules} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onNavigate={navigateTo} isLoadingData={modules.length === 0} />}
            {currentView === 'detail' && selectedModule && <ModuleDetail module={selectedModule} filterType={filterType} setFilterType={setFilterType} downloadingId={downloadingId} onDownload={handleDownloadClick} onShare={handleShare} onNavigate={navigateTo} />}
            {currentView === 'about' && <About />}
          </>
        )}
      </main>

      <Footer />
      <Analytics />
    </div>
  );
};

export default App;