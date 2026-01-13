
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { Module, ResourceType, AcademicFile } from './types';
import { Analytics } from '@vercel/analytics/react';

// Pages
import HomePage from './pages/HomePage';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import AboutPage from './pages/AboutPage';

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://tgnljtmvigschazflxis.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nXfVOz8QEqs1mT0sxx_nYw_P8fmPVmI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('gaka-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .order('code', { ascending: true });

        if (modulesError) throw modulesError;

        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*, modules(code)')
          .order('created_at', { ascending: false });

        if (resourcesError) throw resourcesError;

        const finalModules: Module[] = (modulesData || []).map(m => ({
          id: m.id,
          code: m.code,
          name: m.name,
          description: m.description || 'Verified academic resource module.',
          resources: (resourcesData || [])
            .filter(r => r.module_id === m.id)
            .map(r => ({
              id: r.id,
              title: r.title,
              type: r.type as ResourceType,
              downloadUrl: r.download_url ? transformToDirectDownload(r.download_url) : '#',
              viewUrl: r.view_url ? ensureViewUrl(r.view_url) : '#',
              size: '---'
            }))
        }));

        setModules(finalModules);

        const topRecent = (resourcesData || []).slice(0, 3).map(r => ({
          id: r.id,
          title: r.title,
          type: r.type as ResourceType,
          downloadUrl: transformToDirectDownload(r.download_url),
          viewUrl: ensureViewUrl(r.view_url),
          moduleCode: r.modules?.code || 'CS',
          moduleId: r.module_id
        }));
        
        setRecentFiles(topRecent);
        setError(null);
      } catch (err: any) {
        console.error("Registry Sync Failure:", err);
        setError("Unable to retrieve registered modules at this time.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black transition-colors duration-500">
        <div className="book-loader">
          <div className="book-back"></div>
          <div className="book-page"></div>
          <div className="book-page"></div>
          <div className="book-page"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-colors duration-500 ${isDark ? 'dark bg-black text-white/90' : 'bg-[#fcfdfe] text-slate-900'}`}>
        <NavbarContent isDark={isDark} setIsDark={setIsDark} />
        
        <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-8 transition-colors duration-500">
          {error && (
            <div className="mb-12 p-6 bg-amber-50/50 dark:bg-[#1E1E1E] border border-amber-100 dark:border-amber-900/30 rounded-3xl text-amber-800 dark:text-amber-400 text-sm font-medium flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-4 shadow-sm">
              <div className="flex items-center">
                <span className="relative flex h-3 w-3 mr-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div className="flex flex-col"><p className="font-bold">Sync Error</p><p className="opacity-80">{error}</p></div>
              </div>
              <button onClick={() => window.location.reload()} className="bg-white dark:bg-[#282828] px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-white/5 font-semibold">Retry</button>
            </div>
          )}

          <Routes>
            <Route path="/" element={<HomePage recentFiles={recentFiles} />} />
            <Route path="/modules" element={<ModulesPage modules={modules} />} />
            <Route path="/module/:id" element={<ModuleDetailPage modules={modules} />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        <Footer />
        <Analytics />
      </div>
    </Router>
  );
};

const NavbarContent: React.FC<{ isDark: boolean; setIsDark: (val: boolean) => void }> = ({ isDark, setIsDark }) => {
  const navigate = useNavigate();
  return (
    <Navbar 
      onLogoClick={() => navigate('/')} 
      onHomeClick={() => navigate('/')} 
      onDirectoryClick={() => navigate('/modules')}
      isDark={isDark}
      onToggleDark={() => setIsDark(!isDark)}
    />
  );
};

const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-black border-t border-slate-50 dark:border-white/5 py-12 transition-colors duration-500">
    <div className="container mx-auto px-6 sm:px-8 max-w-7xl text-center md:text-left">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
        <div className="space-y-4">
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <div className="w-9 h-9 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg">G</div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white/90 uppercase">GAKA Portal</span>
          </div>
          <p className="text-slate-400 dark:text-white/30 text-xs sm:text-sm font-medium max-w-sm leading-relaxed mx-auto md:mx-0">Centralized academic hub for MUST Computer Science students.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-sm">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Connect</h4>
            <a href="https://wa.me/255685208576" className="block text-slate-600 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">Support Channel</a>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Team</h4>
            <p className="text-slate-900 dark:text-white/90 font-bold">Cleven Samwel</p>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-50 dark:border-white/5 text-center">
        <p className="text-slate-300 dark:text-white/10 text-[9px] font-bold uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} Softlink Africa | MUST ICT</p>
      </div>
    </div>
  </footer>
);

export default App;
