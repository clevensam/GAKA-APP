import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import {
  SearchIcon,
  BackIcon,
  FileIcon,
  DownloadIcon,
  ShareIcon,
  ChevronRightIcon
} from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';

const LIVE_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv';

/* ---------------- Helpers ---------------- */
const transformToDirectDownload = (url: string): string => {
  if (!url || url === '#') return '#';
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match
    ? `https://drive.google.com/uc?export=download&id=${match[1]}`
    : url;
};

/* ---------------- App ---------------- */
const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const [currentView, setCurrentView] =
    useState<'home' | 'modules' | 'detail' | 'about'>('home');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  /* ---------------- Data Fetch ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(LIVE_CSV_URL);
        if (!res.ok) throw new Error();

        const text = await res.text();
        const rows = text.split(/\r?\n/).filter(Boolean);

        const headers = rows[0]
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(h => h.toLowerCase());

        const idx = {
          code: headers.findIndex(h => h.includes('module')),
          type: headers.findIndex(h => h === 'type'),
          title: headers.findIndex(h => h === 'title'),
          url: headers.findIndex(h => h.includes('url'))
        };

        const base = MODULES_DATA.map(m => ({ ...m, resources: [] }));

        rows.slice(1).forEach((row, i) => {
          const cols = row
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map(v => v.replace(/(^"|"$)/g, ''));

          const code = cols[idx.code];
          if (!code) return;

          const module = base.find(
            m =>
              m.code.replace(/\s/g, '').toLowerCase() ===
              code.replace(/\s/g, '').toLowerCase()
          );

          if (!module) return;

          module.resources.push({
            id: `file-${i}`,
            title: cols[idx.title] || 'Academic Resource',
            type: cols[idx.type]?.toLowerCase().includes('note')
              ? 'Notes'
              : 'Past Paper',
            downloadUrl: transformToDirectDownload(cols[idx.url]),
            size: '---'
          });
        });

        setModules(base.filter(m => m.resources.length));
        setError(null);
      } catch {
        setError('Something went wrong. Please try again shortly.');
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ---------------- Hash Routing ---------------- */
  useEffect(() => {
    const handleRoute = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === '/modules') {
        setCurrentView('modules');
      } else if (hash === '/about') {
        setCurrentView('about');
      } else if (hash.startsWith('/module/')) {
        const id = hash.split('/').pop();
        const module = modules.find(m => m.id === id);

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

    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    return () => window.removeEventListener('hashchange', handleRoute);
  }, [modules]);

  const navigateTo = (path: string) => {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------------- Filters ---------------- */
  const filteredModules = useMemo(
    () =>
      modules.filter(m =>
        `${m.name} ${m.code}`.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [modules, searchQuery]
  );

  const filteredResources = useMemo(
    () =>
      selectedModule
        ? selectedModule.resources.filter(
            r => filterType === 'All' || r.type === filterType
          )
        : [],
    [selectedModule, filterType]
  );

  /* ---------------- Actions ---------------- */
  const handleDownload = (file: AcademicFile) => {
    setDownloadingId(file.id);
    setTimeout(() => setDownloadingId(null), 2500);
  };

  const handleShare = (title: string) => {
    const msg = `Academic Resource:\n\n${title}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-20 h-20 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onLogoClick={() => navigateTo('/home')}
        onHomeClick={() => navigateTo('/home')}
        onDirectoryClick={() => navigateTo('/modules')}
      />

      <main className="flex-grow container mx-auto px-6 py-10">
        {error && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-xl flex justify-between">
            <p className="text-amber-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="font-bold text-amber-600"
            >
              Try again
            </button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="text-center py-24">
            <h1 className="text-5xl font-extrabold mb-6">
              Centralized Academic Repository
            </h1>
            <button
              onClick={() => navigateTo('/modules')}
              className="px-12 py-4 bg-emerald-600 text-white rounded-full font-bold"
            >
              Access Modules
            </button>
          </div>
        )}

        {currentView === 'modules' && (
          <>
            <input
              placeholder="Search module..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full mb-10 p-4 border rounded-xl"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredModules.map(m => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  onClick={() => navigateTo(`/module/${m.id}`)}
                />
              ))}
            </div>
          </>
        )}

        {currentView === 'detail' && selectedModule && (
          <>
            <button
              onClick={() => navigateTo('/modules')}
              className="mb-6 text-emerald-600 font-bold"
            >
              ← Back to Modules
            </button>

            <h2 className="text-4xl font-extrabold mb-8">
              {selectedModule.name}
            </h2>

            <div className="space-y-4">
              {filteredResources.map(file => (
                <div
                  key={file.id}
                  className="flex justify-between items-center p-5 border rounded-xl"
                >
                  <span>{file.title}</span>

                  <div className="flex gap-3">
                    <button onClick={() => handleShare(file.title)}>
                      <ShareIcon />
                    </button>

                    <a
                      href={file.downloadUrl}
                      onClick={() => handleDownload(file)}
                      className="px-5 py-2 bg-emerald-600 text-white rounded-lg"
                    >
                      {downloadingId === file.id ? 'Starting…' : 'Download'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
