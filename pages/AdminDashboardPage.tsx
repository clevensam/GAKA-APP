
import React, { useState } from 'react';
import { supabase } from '../App';
import { Module, ResourceType } from '../types';
import { ChevronRightIcon, FileIcon } from '../components/Icons';

interface AdminDashboardPageProps {
  modules: Module[];
  onRefresh: () => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ modules, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'resources'>('modules');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form States
  const [modCode, setModCode] = useState('');
  const [modName, setModName] = useState('');
  const [modDesc, setModDesc] = useState('');

  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<ResourceType>('Notes');
  const [resModuleId, setResModuleId] = useState('');
  const [resViewUrl, setResViewUrl] = useState('');
  const [resDownloadUrl, setResDownloadUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.from('modules').insert([
      { code: modCode, name: modName, description: modDesc }
    ]);
    if (!error) {
      setModCode(''); setModName(''); setModDesc('');
      setIsAdding(false);
      onRefresh();
    }
    setIsLoading(false);
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.from('resources').insert([
      { 
        title: resTitle, 
        type: resType, 
        module_id: resModuleId, 
        view_url: resViewUrl, 
        download_url: resDownloadUrl 
      }
    ]);
    if (!error) {
      setResTitle(''); setResViewUrl(''); setResDownloadUrl('');
      setIsAdding(false);
      onRefresh();
    }
    setIsLoading(false);
  };

  const handleDeleteModule = async (id: string) => {
    if (window.confirm('Delete module and all associated resources?')) {
      await supabase.from('modules').delete().eq('id', id);
      onRefresh();
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white">Registry Management</h2>
          <p className="text-slate-500 dark:text-white/40 mt-1">Authorized database administration portal.</p>
        </div>
        <button onClick={handleSignOut} className="px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-500/20 hover:bg-red-100 transition-colors">Sign Out</button>
      </div>

      <div className="flex bg-white dark:bg-[#1E1E1E] p-1.5 rounded-2xl border border-slate-100 dark:border-white/5 mb-8 shadow-sm max-w-sm">
        <button onClick={() => setActiveTab('modules')} className={`flex-1 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${activeTab === 'modules' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>Modules</button>
        <button onClick={() => setActiveTab('resources')} className={`flex-1 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${activeTab === 'resources' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>Resources</button>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white/90 capitalize">{activeTab} List</h3>
          <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95">
            {isAdding ? 'Cancel' : `+ Add ${activeTab === 'modules' ? 'Module' : 'Resource'}`}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={activeTab === 'modules' ? handleAddModule : handleAddResource} className="mb-12 p-8 bg-slate-50 dark:bg-black rounded-3xl border border-slate-100 dark:border-white/5 animate-fade-in space-y-6">
            <h4 className="font-bold text-lg text-emerald-600">New {activeTab === 'modules' ? 'Module' : 'Resource'} Entry</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTab === 'modules' ? (
                <>
                  <input placeholder="Course Code (e.g. CS 8301)" required value={modCode} onChange={(e)=>setModCode(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white" />
                  <input placeholder="Module Name" required value={modName} onChange={(e)=>setModName(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white" />
                  <textarea placeholder="Description" required value={modDesc} onChange={(e)=>setModDesc(e.target.value)} className="w-full md:col-span-2 px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white" rows={3} />
                </>
              ) : (
                <>
                  <input placeholder="Resource Title" required value={resTitle} onChange={(e)=>setResTitle(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white" />
                  <select value={resType} onChange={(e)=>setResType(e.target.value as ResourceType)} className="w-full px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white">
                    <option value="Notes">Notes</option>
                    <option value="Past Paper">Past Paper (Gaka)</option>
                  </select>
                  <select required value={resModuleId} onChange={(e)=>setResModuleId(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white">
                    <option value="">Select Parent Module...</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                  </select>
                  <input placeholder="View URL (Google Drive)" required value={resViewUrl} onChange={(e)=>setResViewUrl(e.target.value)} className="w-full px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white" />
                  <input placeholder="Download URL (Optional)" value={resDownloadUrl} onChange={(e)=>setResDownloadUrl(e.target.value)} className="w-full md:col-span-2 px-6 py-4 bg-white dark:bg-[#1E1E1E] rounded-xl border dark:border-white/5 outline-none focus:ring-2 focus:ring-emerald-500 text-white" />
                </>
              )}
            </div>
            <button disabled={isLoading} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Commit to Database'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 dark:border-white/5 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="py-4 font-bold">Entry</th>
                <th className="py-4 font-bold">Details</th>
                <th className="py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {activeTab === 'modules' ? modules.map(m => (
                <tr key={m.id} className="group hover:bg-slate-50 dark:hover:bg-black/20 transition-colors">
                  <td className="py-6 font-black text-slate-800 dark:text-white">{m.code}</td>
                  <td className="py-6">
                    <div className="font-bold text-sm text-slate-700 dark:text-white/70">{m.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{m.resources.length} resources linked</div>
                  </td>
                  <td className="py-6 text-right">
                    <button onClick={() => handleDeleteModule(m.id)} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline px-4">Delete</button>
                  </td>
                </tr>
              )) : modules.flatMap(m => m.resources.map(r => (
                <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-black/20 transition-colors">
                  <td className="py-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600"><FileIcon className="w-4 h-4" /></div>
                    <div className="font-bold text-sm text-slate-800 dark:text-white">{r.title}</div>
                  </td>
                  <td className="py-6">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-black text-slate-500 uppercase font-black">{m.code}</span>
                    <span className={`ml-2 text-[10px] font-bold uppercase ${r.type === 'Notes' ? 'text-emerald-500' : 'text-teal-500'}`}>{r.type}</span>
                  </td>
                  <td className="py-6 text-right">
                     <button onClick={async () => { if(window.confirm('Delete?')) { await supabase.from('resources').delete().eq('id', r.id); onRefresh(); } }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline px-4">Delete</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
