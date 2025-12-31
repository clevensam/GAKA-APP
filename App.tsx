import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
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

// Main App with Router
const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch CSV data and parse
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
          const targetModule = skeletonModules.find(m => m.code.replace(/\s+/g, '').toLowerCase() === normalizedSheetCode);

          if (targetModule) {
            const resource: AcademicFile = {
              id: `dynamic-${index}`,
              title: title || 'Academic Resource',
              type: typeStr.toLowerCase().includes('note') ? 'Notes' : 'Past Paper',
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
        setError("Something went wrong on our side. Please try again in a moment.");
        setModules([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <Router>
      <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <Navbar />

        <main className="flex-grow container mx-auto max-w-7xl px-5 py-8 sm:py-12 sm:px-8">
          <Routes>
            <Route path="/" element={<Home navigateTo={() => {}} />} />
            <Route path="/about" element={<About />} />
            <Route path="/modules" element={<Modules modules={modules} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/module/:id" element={
              <ModuleDetail 
                modules={modules} 
                filterType={filterType} 
                setFilterType={setFilterType} 
                downloadingId={downloadingId} 
                setDownloadingId={setDownloadingId} 
              />} 
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    <div className="relative">
      <div className="w-20 h-20 sm:w-24 sm:h-24 border-[4px] border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-100 animate-pulse">G</div>
      </div>
    </div>
  </div>
);

// Home Page
const Home = ({ navigateTo }: { navigateTo: () => void }) => (
  <div className="animate-fade-in flex flex-col items-center text-center pt-8 pb-16 lg:pt-32">
    <h2 className="text-4xl sm:text-[90px] font-extrabold text-slate-900 mb-8 max-w-6xl leading-[1.1] sm:leading-[1.05] tracking-tight break-words">
      Centralized <span className="gradient-text">Academic</span> <br className="hidden sm:block"/> Repository.
    </h2>
    <Link to="/modules" className="px-10 py-5 bg-emerald-600 text-white rounded-full font-bold">Access Modules</Link>
  </div>
);

// About Page
const About = () => (
  <div className="animate-fade-in max-w-5xl mx-auto py-8 sm:py-12">
    <h2 className="text-4xl font-extrabold mb-4">About GAKA</h2>
    <p>A unified platform for MUST students to access verified academic materials.</p>
  </div>
);

// Modules Listing
const Modules = ({ modules, searchQuery, setSearchQuery }: any) => {
  const navigate = useNavigate();
  const filteredModules = useMemo(() => modules.filter((m: Module) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  ), [modules, searchQuery]);

  return (
    <>
      <div className="mb-8 flex items-center">
        <input
          type="text"
          placeholder="Find your course..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-lg border"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module: Module) => (
          <ModuleCard key={module.id} module={module} onClick={() => navigate(`/module/${module.id}`)} />
        ))}
      </div>
    </>
  );
};

// Module Detail Page
const ModuleDetail = ({ modules, filterType, setFilterType, downloadingId, setDownloadingId }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedModule = modules.find((m: Module) => m.id === id);
  if (!selectedModule) return <p>Module not found</p>;

  const filteredResources = useMemo(() => {
    return selectedModule.resources.filter((r: AcademicFile) =>
      filterType === 'All' || r.type === filterType
    );
  }, [selectedModule, filterType]);

  const handleDownloadClick = (file: AcademicFile) => {
    if (file.downloadUrl === '#') return;
    setDownloadingId(file.id);
    setTimeout(() => setDownloadingId(null), 3000);
  };

  const handleShare = (title: string) => {
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Academic Resource: ${title}\n${url}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div>
      <button onClick={() => navigate('/modules')}>Back to Modules</button>
      <h2>{selectedModule.name}</h2>
      <div>
        <button onClick={() => setFilterType('All')}>All</button>
        <button onClick={() => setFilterType('Notes')}>Notes</button>
        <button onClick={() => setFilterType('Past Paper')}>Past Paper</button>
      </div>
      <div>
        {filteredResources.map((file: AcademicFile) => (
          <div key={file.id}>
            <span>{file.title}</span>
            <button onClick={() => handleShare(file.title)}>Share</button>
            <a href={file.downloadUrl} onClick={() => handleDownloadClick(file)}>
              {downloadingId === file.id ? 'Starting...' : 'Download'}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => (
  <footer className="bg-white border-t border-slate-50 py-12 text-center">
    <p>&copy; {new Date().getFullYear()} Softlink Africa | MUST Engineering</p>
  </footer>
);

export default App;
