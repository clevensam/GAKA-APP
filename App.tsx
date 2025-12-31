import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon } from './components/Icons';
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

  // Fetch CSV data
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
          download: headers.findIndex(h => h === 'download url' || h === 'download link' || h === 'url')
        };

        const rows = allRows.slice(1); 
        const skeletonModules: Module[] = MODULES_DATA.map(m => ({ ...m, resources: [] }));

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

        setModules(skeletonModules.filter(m => m.resources.length > 0));
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

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === '/modules') {
        setCurrentView('modules');
      } else if (hash === '/about') {
        setCurrentView('about');
      } else if (hash.startsWith('/module/')) {
        const moduleId = hash.split('/').pop();
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          setSelectedModule(module);
          setCurrentView('detail');
          setFilterType('All');
        } else {
          setCurrentView('modules');
        }
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [modules]);

  // Navigate function
  const navigateTo = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    window.location.hash = cleanPath;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered modules
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [modules, searchQuery]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => filterType === 'All' || r.type === filterType);
  }, [selectedModule, filterType]);

  // Share resource
  const handleShare = (resourceTitle: string) => {
    const url = window.location.href;
    const shareMessage = `Academic Resource from *GAKA Portal*: \n\n📄 *${resourceTitle}*\n🔗 ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Download resource
  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, file: AcademicFile) => {
    if (file.downloadUrl === '#') {
      e.preventDefault();
      return;
    }
    setDownloadingId(file.id);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  // Breadcrumb component
  const Breadcrumbs = () => (
    <nav className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide animate-fade-in">
      <button onClick={() => navigateTo('/home')} className="hover:text-emerald-600 transition-colors">Home</button>
      <ChevronRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
      {currentView === 'modules' && <span className="text-slate-900 font-bold">Directory</span>}
      {currentView === 'about' && <span className="text-slate-900 font-bold">About</span>}
      {currentView === 'detail' && (
        <>
          <button onClick={() => navigateTo('/modules')} className="hover:text-emerald-600 transition-colors">Directory</button>
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
      ].map(tab => (
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

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="w-20 h-20 sm:w-24 sm:h-24 border-[4px] border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-100 animate-pulse">G</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar 
        onLogoClick={() => navigateTo('/home')} 
        onHomeClick={() => navigateTo('/home')}
        onDirectoryClick={() => navigateTo('/modules')}
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

        {/* ----- Views (Home, About, Modules, Detail) ----- */}
        {/* HOME, ABOUT, MODULES, DETAIL */}
        {/* Your previous JSX here (replace # paths with / paths) */}
        {/* Keep everything else exactly the same as in your code */}
      </main>

      <footer className="bg-white border-t border-slate-50 py-12 sm:py-16">
        {/* ... footer JSX unchanged ... */}
      </footer>
    </div>
  );
};

export default App;
