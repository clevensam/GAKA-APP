
import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ModuleCard } from './components/ModuleCard';
import { SearchIcon, BackIcon, FileIcon, DownloadIcon, ShareIcon, ChevronRightIcon, BookOpenIcon } from './components/Icons';
import { Module, ResourceType, AcademicFile } from './types';
import { MODULES_DATA } from './constants';

// The live Google Sheet URL provided by the user
const LIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn-pw2j_BMf_v--CHjpGLos3oFFAyOjrlZ8vsM0uFs4E23GPcGZ2F0tdBvRZGeg7VwZ-ZkIOpHU8zm/pub?output=csv";

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'modules' | 'detail' | 'about'>('home');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | 'All'>('All');

  // Fetch and parse Google Sheet data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(LIVE_CSV_URL);
        if (!response.ok) throw new Error('Could not connect to the academic portal. Please check your connection.');
        
        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "").slice(1); 
        
        const groupedModules: Record<string, Module> = {};

        rows.forEach((row, index) => {
          const parts = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val?.trim().replace(/^"|"$/g, ''));
          const [moduleCode, moduleName, type, title, viewUrl, downloadUrl] = parts;
          
          if (!moduleCode || !moduleName) return;

          if (!groupedModules[moduleCode]) {
            groupedModules[moduleCode] = {
              id: moduleCode.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              code: moduleCode,
              name: moduleName,
              description: `All resources for ${moduleName}. Curated for CS students.`,
              resources: []
            };
          }

          const resource: AcademicFile = {
            id: `${moduleCode}-${index}`,
            name: title || 'Resource File',
            type: (type?.toLowerCase().includes('note')) ? 'Notes' : 'Past Paper',
            driveUrl: downloadUrl || viewUrl || '#',
            size: '---' 
          };

          groupedModules[moduleCode].resources.push(resource);
        });

        const modulesArray = Object.values(groupedModules);
        if (modulesArray.length === 0) {
           throw new Error("No active modules found.");
        }
        
        setModules(modulesArray);
        setError(null);
      } catch (err) {
        console.error("GAKA Data Error:", err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        setModules(MODULES_DATA);
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
        } else if (modules.length > 0) {
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

  const navigateTo = (path: string) => {
    window.location.hash = path;
  };

  const filteredModules = useMemo(() => {
    return modules.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [modules, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!selectedModule) return [];
    return selectedModule.resources.filter(r => 
      filterType === 'All' || r.type === filterType
    );
  }, [selectedModule, filterType]);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert('Link copied to clipboard!');
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch (err) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) alert('Link copied to clipboard!');
      } catch (fallbackErr) {
        window.prompt("Copy link to clipboard: Ctrl+C, Enter", text);
      }
    }
  };

  const handleShare = (resourceName: string) => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `GAKA: ${resourceName}`,
        text: `Shared academic resource from GAKA Portal`,
        url: url,
      }).catch((err) => {
        if (err.name !== 'AbortError') copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const Breadcrumbs = () => (
    <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <button onClick={() => navigateTo('#/home')} className="hover:text-emerald-600 transition-colors">Home</button>
      <ChevronRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
      {currentView === 'modules' && <span className="text-slate-900">Modules</span>}
      {currentView === 'about' && <span className="text-slate-900">About</span>}
      {currentView === 'detail' && (
        <>
          <button onClick={() => navigateTo('#/modules')} className="hover:text-emerald-600 transition-colors">Modules</button>
          <ChevronRightIcon className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <span className="text-slate-900">{selectedModule?.code}</span>
        </>
      )}
    </nav>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative">
          <div className="w-20 h-20 border-[6px] border-slate-50 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-lg">G</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe]">
      <Navbar onLogoClick={() => navigateTo('#/home')} />

      <main className="flex-grow container mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {currentView !== 'home' && <Breadcrumbs />}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold flex items-center justify-between animate-fade-in">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-3 animate-ping"></span>
              Live Update Failed: Showing cached module data.
            </span>
            <button onClick={() => window.location.reload()} className="bg-white px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95">Retry Update</button>
          </div>
        )}

        {currentView === 'home' && (
          <div className="animate-fade-in flex flex-col items-center text-center py-16 lg:py-32">
            <h2 className="text-5xl sm:text-8xl font-black text-slate-900 mb-8 max-w-5xl leading-[1.05] tracking-tight">
              Access Your Academic Modules <span className="gradient-text italic">Anytime, Freely.</span>
            </h2>
            <p className="text-lg sm:text-2xl text-slate-500 max-w-3xl mb-12 font-medium leading-relaxed">
              Experience seamless learning with instant access to comprehensive module resources. Designed to simplify your academic life and provide unrestricted support for your studies.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <button 
                onClick={() => navigateTo('#/modules')}
                className="group flex items-center justify-center px-12 py-5 bg-emerald-600 text-white rounded-[2rem] font-bold shadow-2xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.02] transition-all duration-300"
              >
                Explore Modules
                <SearchIcon className="ml-3 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
              <button 
                onClick={() => navigateTo('#/about')}
                className="px-12 py-5 bg-white text-slate-700 border border-slate-200 rounded-[2rem] font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm"
              >
                About the Portal
              </button>
            </div>
            
            {/* Why GAKA? Section */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <span className="text-2xl font-black">1</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Zero Registration</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">We value your time. No mandatory accounts, signups, or authentication required. Simply browse and access your learning materials instantly.</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <span className="text-2xl font-black">2</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">24/7 Availability</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">Your education doesn't sleep. Every module is accessible around the clock, allowing you to study at your own pace whenever inspiration strikes.</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <span className="text-2xl font-black">3</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Community Verified</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">Trust in quality. All lecture notes and past papers are verified and curated by the Computer Science academic community. Legit only.</p>
              </div>
            </div>

            <div className="mt-28 grid grid-cols-2 md:grid-cols-4 gap-12 w-full max-w-5xl border-t border-slate-100 pt-16">
              {[
                { label: 'Active Modules', value: modules.length.toString() },
                { label: 'Portal Status', value: error ? 'Cached' : 'Live' },
                { label: 'Current Session', value: '2024/25' },
                { label: 'Access Level', value: 'Public' }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'about' && (
          <div className="animate-fade-in max-w-4xl mx-auto py-12">
            <button 
              onClick={() => navigateTo('#/home')}
              className="flex items-center text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-10 hover:text-emerald-600 transition-all group"
            >
              <BackIcon className="mr-3 w-5 h-5 group-hover:-translate-x-2 transition-transform duration-300" />
              Back to Home
            </button>

            <div className="bg-white rounded-[3rem] p-10 sm:p-20 shadow-sm border border-slate-100">
              <h2 className="text-4xl sm:text-6xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                About <span className="gradient-text">GAKA Portal</span>
              </h2>
              
              <div className="space-y-12 text-slate-600 leading-relaxed text-lg font-medium">
                <section>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Our Mission</h3>
                  <p>
                    GAKA Portal was conceived with a single, clear objective: to democratize academic resources for Computer Science students. We believe that access to lecture materials, past examination papers, and reference guides should be frictionless, transparent, and free from the barriers of registration.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Philosophy</h3>
                  <p>
                    In an age of digital complexity, we chose simplicity. By removing mandatory accounts, we ensure that students can focus entirely on learning. Your attention belongs to your studies, not account management.
                  </p>
                </section>

                <section className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
                  <h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest mb-4">Engineering & Development</h3>
                  <p className="text-emerald-800">
                    GAKA is powered by <span className="font-bold">Softlink Africa</span>. Our team of developers is dedicated to crafting high-performance digital tools that serve the academic community.
                  </p>
                  <div className="mt-6 pt-6 border-t border-emerald-200/50 flex flex-col sm:flex-row sm:items-center gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Developer</p>
                      <p className="text-slate-900 font-bold">Cleven Samwel</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-4">Contact Information</h3>
                  <p>
                    For resource contributions, technical feedback, or partnership inquiries, please reach out to our development team.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <a 
                      href="mailto:clevensamwel@gmail.com"
                      className="flex items-center justify-center px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                      Email Developer
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {currentView === 'modules' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Module Directory</h2>
                <div className="flex items-center space-x-3 text-slate-500 font-bold text-sm">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] uppercase">UQF8</span>
                  <span>Semester I</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-emerald-600">{modules.length} Modules Online</span>
                </div>
              </div>
              
              <div className="relative w-full md:w-[400px] group">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Find your module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] focus:ring-8 focus:ring-emerald-50 focus:border-emerald-400 outline-none transition-all shadow-sm group-hover:shadow-md text-lg font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredModules.map((module) => (
                <ModuleCard 
                  key={module.id} 
                  module={module} 
                  onClick={() => navigateTo(`#/module/${module.id}`)} 
                />
              ))}
              {filteredModules.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
                    <SearchIcon className="text-slate-200 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Search Disconnected</h3>
                  <p className="text-slate-400 font-medium mt-2">No modules matched your current query.</p>
                  <button onClick={() => setSearchQuery('')} className="mt-6 text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline">Clear Search</button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'detail' && selectedModule && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <button 
              onClick={() => navigateTo('#/modules')}
              className="flex items-center text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-10 hover:text-emerald-600 transition-all group"
            >
              <BackIcon className="mr-3 w-5 h-5 group-hover:-translate-x-2 transition-transform duration-300" />
              Back to Directory
            </button>

            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 sm:p-20 rounded-[3rem] text-white shadow-2xl shadow-emerald-100 mb-12 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-8">
                  <span className="bg-white/20 backdrop-blur-xl px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/10">
                    {selectedModule.code}
                  </span>
                  <span className="bg-emerald-500/30 backdrop-blur-xl px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/10">
                    {selectedModule.resources.length} Items
                  </span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black mb-8 leading-[1.05] tracking-tight max-w-3xl">{selectedModule.name}</h2>
                <p className="text-emerald-50/70 text-xl max-w-2xl font-medium leading-relaxed">
                  {selectedModule.description}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 sm:p-14 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-14">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Available Assets</h3>
                  <p className="text-slate-400 font-medium text-sm">Download or preview shared documents</p>
                </div>
                <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  {['All', 'Notes', 'Past Paper'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type as any)}
                      className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                        filterType === type 
                        ? 'bg-white text-emerald-600 shadow-sm scale-[1.05] border border-slate-100' 
                        : 'text-slate-400 hover:text-slate-800'
                      }`}
                    >
                      {type === 'Past Paper' ? 'GAKA' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {filteredResources.map((file) => (
                  <div key={file.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-[#fcfdfe] hover:bg-white border border-slate-100 hover:border-emerald-100 rounded-[2.2rem] transition-all duration-500 hover:shadow-xl hover:shadow-emerald-50/50">
                    <div className="flex items-center space-x-6 mb-6 sm:mb-0">
                      <div className={`p-5 rounded-2xl flex-shrink-0 transition-all duration-700 group-hover:scale-110 group-hover:rotate-[5deg] ${
                        file.type === 'Notes' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-teal-50 text-teal-600'
                      }`}>
                        <FileIcon className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-xl leading-snug truncate pr-6 group-hover:text-emerald-900 transition-colors">
                          {file.name}
                        </h4>
                        <div className="flex items-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                          <span className={`${file.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>
                            {file.type === 'Notes' ? 'Lecture Material' : 'Official GAKA'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleShare(file.name)}
                        className="p-5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-2xl transition-all shadow-sm hover:shadow active:scale-90 border border-transparent hover:border-emerald-50"
                        title="Share link"
                      >
                        <ShareIcon className="w-6 h-6" />
                      </button>
                      <a 
                        href={file.driveUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-grow sm:flex-grow-0 flex items-center justify-center space-x-3 px-10 py-5 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] border border-emerald-500 rounded-2xl hover:bg-emerald-700 hover:scale-[1.03] transition-all shadow-lg shadow-emerald-100 active:scale-95"
                      >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg">G</div>
                <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Gaka Portal</span>
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                &copy; {new Date().getFullYear()} Computer Science Association
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Developed By</h4>
              <p className="text-slate-600 font-bold text-sm tracking-tight">Softlink Africa</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Contact Us</h4>
              <div className="space-y-2">
                <a href="mailto:clevensamwel@gmail.com" className="flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
                  <span className="mr-2 opacity-70">✉️</span> clevensamwel@gmail.com
                </a>
                <a href="tel:0685208576" className="flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
                  <span className="mr-2 opacity-70">📞</span> 0685208576
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
