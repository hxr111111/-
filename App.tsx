import React, { useState, useEffect, useMemo } from 'react';
import { Video, VideoFormData, VideoStatus, VideoCategory } from './types';
import { VideoCard } from './components/VideoCard';
import { VideoFormModal } from './components/VideoFormModal';
import { DetailModal } from './components/DetailModal';
import { Plus, Search, Filter, LayoutGrid, PlaySquare, Sparkles, Loader2, Bot } from 'lucide-react';
import { semanticSearchVideos } from './services/geminiService';

function App() {
  // FIX: Use lazy initialization to strictly prevent overwriting localStorage with default []
  const [videos, setVideos] = useState<Video[]>(() => {
    try {
      const saved = localStorage.getItem('video-vault-data');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load initial data", e);
      return [];
    }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | undefined>(undefined);
  const [detailVideo, setDetailVideo] = useState<Video | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<VideoCategory | 'ALL'>('ALL');

  // AI Search States
  const [isAiSearchMode, setIsAiSearchMode] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[]>([]);
  const [aiSearchPerformed, setAiSearchPerformed] = useState(false);

  // Persistence: Save whenever videos change. 
  // Since we initialize from localStorage, 'videos' starts with the correct data, safe to save.
  useEffect(() => {
    localStorage.setItem('video-vault-data', JSON.stringify(videos));
  }, [videos]);

  // Handlers
  const handleCreate = (data: VideoFormData) => {
    const newVideo: Video = {
      ...data,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    setVideos(prev => [newVideo, ...prev]);
  };

  const handleUpdate = (data: VideoFormData) => {
    if (!editingVideo) return;
    setVideos(prev => prev.map(v => v.id === editingVideo.id ? { ...v, ...data } : v));
    setEditingVideo(undefined);
  };

  const handleDetailUpdate = (updatedVideo: Video) => {
    setVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
    setDetailVideo(updatedVideo); // Update modal view as well
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  };

  const openCreateModal = () => {
    setEditingVideo(undefined);
    setIsFormOpen(true);
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setIsFormOpen(true);
  };

  // AI Search Handler
  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    setAiSearchPerformed(true);
    try {
      const ids = await semanticSearchVideos(searchQuery, videos);
      setAiMatchedIds(ids);
    } catch (error) {
      console.error(error);
      alert("AI Search failed.");
    } finally {
      setIsAiSearching(false);
    }
  };

  // Reset AI search when toggling off
  useEffect(() => {
    if (!isAiSearchMode) {
      setAiMatchedIds([]);
      setAiSearchPerformed(false);
      if(searchQuery) setSearchQuery(''); // Optional: clear query on toggle off
    }
  }, [isAiSearchMode]);

  // Derived State
  const filteredVideos = useMemo(() => {
    // If AI Search Mode is active AND we have performed a search
    if (isAiSearchMode && aiSearchPerformed) {
      // Return videos that match IDs, preserving order of AI result if possible
      const matchedMap = new Map(videos.map(v => [v.id, v]));
      return aiMatchedIds.map(id => matchedMap.get(id)).filter((v): v is Video => !!v);
    }

    // Standard Filtering
    return videos.filter(video => {
      const matchesSearch = isAiSearchMode 
        ? true // If AI mode is on but hasn't searched yet, show all (or could show none)
        : (video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           video.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesStatus = statusFilter === 'ALL' || video.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || video.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [videos, searchQuery, statusFilter, categoryFilter, isAiSearchMode, aiMatchedIds, aiSearchPerformed]);

  // Statistics
  const stats = {
    total: videos.length,
    unwatched: videos.filter(v => v.status === VideoStatus.UNWATCHED).length,
    completed: videos.filter(v => v.status === VideoStatus.COMPLETED).length
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-20">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <PlaySquare size={20} fill="currentColor" className="text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
                VideoVault AI
              </h1>
              <h1 className="text-xl font-bold text-indigo-600 sm:hidden">
                VideoVault
              </h1>
            </div>
            
            <button 
              onClick={openCreateModal}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <Plus size={18} /> Add Video
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics & Filters Container */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start justify-between">
          
          {/* Quick Stats - Hidden on very small screens if needed, but useful */}
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm min-w-[100px]">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-700">{stats.total}</p>
             </div>
             <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm min-w-[100px]">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">To Watch</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.unwatched}</p>
             </div>
             <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm min-w-[100px]">
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Done</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</p>
             </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex-1 w-full md:w-auto flex flex-col gap-3 justify-end items-end">
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
               {/* Search Input Area */}
               <div className="relative group w-full sm:w-auto flex-1">
                 {isAiSearchMode ? (
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 animate-pulse">
                     <Sparkles size={18} />
                   </div>
                 ) : (
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 )}
                 
                 <input 
                    type="text" 
                    placeholder={isAiSearchMode ? "AI 搜索：描述你记得的内容..." : "搜索标题或标签..."}
                    className={`pl-10 pr-20 py-2.5 border rounded-lg focus:ring-2 outline-none w-full sm:w-[320px] transition-all
                      ${isAiSearchMode 
                        ? 'bg-purple-50 border-purple-200 focus:ring-purple-200 focus:border-purple-400 placeholder-purple-300' 
                        : 'bg-white border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'
                      }`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isAiSearchMode) {
                        handleAiSearch();
                      }
                    }}
                  />
                  
                  {isAiSearchMode && (
                    <button 
                      onClick={handleAiSearch}
                      disabled={isAiSearching || !searchQuery.trim()}
                      className="absolute right-1 top-1 bottom-1 px-3 bg-white rounded-md text-purple-600 hover:bg-purple-100 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                       {isAiSearching ? <Loader2 className="animate-spin" size={16} /> : <Bot size={18} />}
                    </button>
                  )}
               </div>

               {/* Toggle AI Mode */}
               <button
                  onClick={() => setIsAiSearchMode(!isAiSearchMode)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm border flex items-center gap-2 transition-all whitespace-nowrap
                    ${isAiSearchMode 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  title={isAiSearchMode ? "Switch to Standard Search" : "Enable AI Semantic Search"}
               >
                 <Sparkles size={16} />
                 <span className="hidden sm:inline">AI 搜索</span>
               </button>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 sm:pb-0 justify-end">
               <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as VideoCategory | 'ALL')}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer hover:bg-slate-50"
              >
                <option value="ALL">所有分类</option>
                {Object.values(VideoCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as VideoStatus | 'ALL')}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-indigo-400 cursor-pointer hover:bg-slate-50"
              >
                <option value="ALL">所有状态</option>
                {Object.values(VideoStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="min-h-[300px]">
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {filteredVideos.map(video => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onOpenDetail={setDetailVideo}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              {isAiSearching ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-purple-500" size={40} />
                  <p>AI 正在分析您的视频库...</p>
                </div>
              ) : (
                <>
                  <LayoutGrid size={48} strokeWidth={1} className="mb-4 opacity-50" />
                  <p>No videos found. Click "Add Video" to get started.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <VideoFormModal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={editingVideo ? handleUpdate : handleCreate}
          initialData={editingVideo}
        />

        {detailVideo && (
          <DetailModal 
            video={detailVideo}
            isOpen={!!detailVideo}
            onClose={() => setDetailVideo(null)}
            onUpdate={handleDetailUpdate}
          />
        )}
      </main>
    </div>
  );
}

export default App;