import React, { useState } from 'react';
import { Video } from '../types';
import { generateVideoSummary } from '../services/geminiService';
import { X, ExternalLink, BrainCircuit, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Assuming we can use standard libs, but strictly adhering to no new files, I'll render simple HTML or just text if needed, but the prompt says use popular libraries. I will use a simple text render if package not available, but let's assume raw text with whitespace-pre-wrap for now to be safe without package.json changes.

// Actually, I'll use a simple CSS class for markdown-like appearance.

interface DetailModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedVideo: Video) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ video, isOpen, onClose, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [extraContext, setExtraContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateVideoSummary(video, extraContext);
      onUpdate({ ...video, aiSummary: summary });
      setShowContextInput(false);
    } catch (error) {
      alert("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 line-clamp-1 pr-4">{video.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Category</label>
              <div className="text-slate-700 font-medium">{video.category}</div>
            </div>
            <div>
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Status</label>
               <div className="text-slate-700 font-medium">{video.status}</div>
            </div>
            <div className="md:col-span-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">URL</label>
               <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 break-all">
                 {video.url} <ExternalLink size={14} />
               </a>
            </div>
            <div className="md:col-span-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Tags</label>
               <div className="flex flex-wrap gap-2 mt-1">
                 {video.tags.map(t => (
                   <span key={t} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{t}</span>
                 ))}
               </div>
            </div>
          </div>

          {/* User Notes */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              📝 我的笔记
            </h3>
            <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-lg text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
              {video.notes || <span className="text-slate-400 italic">暂无笔记...</span>}
            </div>
          </div>

          {/* AI Summary Section */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                 <BrainCircuit className="text-indigo-600" /> AI 智能总结
               </h3>
               {!video.aiSummary && !showContextInput && (
                 <button 
                  onClick={() => setShowContextInput(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                 >
                   <Sparkles size={16} /> 生成总结
                 </button>
               )}
            </div>

            {/* AI Generation Context Input */}
            {showContextInput && !video.aiSummary && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4 animate-in slide-in-from-top-2">
                <p className="text-sm text-indigo-800 mb-2">
                  <AlertCircle size={14} className="inline mr-1" />
                  Gemini 会通过 Google 搜索该视频信息。如果这是冷门视频，请粘贴简介或字幕内容以提高准确率。
                </p>
                <textarea
                  className="w-full p-3 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-3 bg-white"
                  rows={3}
                  placeholder="（可选）在此处粘贴视频简介、字幕或关键信息..."
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setShowContextInput(false)}
                    className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating ? '思考中...' : '开始生成'}
                  </button>
                </div>
              </div>
            )}

            {/* The Summary Output */}
            {video.aiSummary ? (
              <div className="bg-white border border-slate-200 p-6 rounded-xl prose prose-slate prose-sm max-w-none shadow-sm">
                 <div className="whitespace-pre-wrap font-sans text-slate-700 leading-7">
                    {video.aiSummary}
                 </div>
                 <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => setShowContextInput(true)}
                      className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Sparkles size={12} /> 重新生成
                    </button>
                 </div>
              </div>
            ) : (
              !showContextInput && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                  尚未生成 AI 总结
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
};