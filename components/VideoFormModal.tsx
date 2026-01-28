import React, { useState, useEffect } from 'react';
import { Video, VideoCategory, VideoStatus, VideoFormData } from '../types';
import { generateSuggestions, extractVideoMetadata } from '../services/geminiService';
import { X, Wand2, Loader2, Link2, Sparkles } from 'lucide-react';

interface VideoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VideoFormData) => void;
  initialData?: Video;
}

const DEFAULT_FORM: VideoFormData = {
  title: '',
  url: '',
  tags: [],
  category: VideoCategory.OTHER,
  status: VideoStatus.UNWATCHED,
  notes: ''
};

export const VideoFormModal: React.FC<VideoFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<VideoFormData>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        url: initialData.url,
        tags: initialData.tags,
        category: initialData.category,
        status: initialData.status,
        notes: initialData.notes
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setTagInput('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleAISuggest = async () => {
    if (!formData.title) return;
    setIsSuggesting(true);
    try {
      const suggestions = await generateSuggestions(formData.title);
      setFormData(prev => ({
        ...prev,
        tags: Array.from(new Set([...prev.tags, ...suggestions.tags])),
        category: suggestions.category as VideoCategory || prev.category
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleUrlAnalyze = async () => {
    if (!formData.url) return;
    setIsAnalyzingUrl(true);
    try {
      const metadata = await extractVideoMetadata(formData.url);
      setFormData(prev => ({
        ...prev,
        title: metadata.title,
        category: metadata.category,
        tags: metadata.tags,
        notes: metadata.notes
      }));
    } catch (e) {
      alert("无法自动提取信息，请确保 URL 正确或手动填写。");
      console.error(e);
    } finally {
      setIsAnalyzingUrl(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? '编辑视频' : '添加新视频'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
           {/* URL Input First for easy paste & analyze */}
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">🔗 视频链接</label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.bilibili.com/video/..."
              />
              <button
                type="button"
                onClick={handleUrlAnalyze}
                disabled={!formData.url || isAnalyzingUrl}
                className="px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all font-medium flex items-center gap-2 shadow-sm"
                title="AI 智能分析链接并填入信息"
              >
                {isAnalyzingUrl ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>智能识别</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">粘贴链接并点击“智能识别”，AI 将自动为您填好下方信息。</p>
          </div>

          <div className="h-px bg-slate-100 my-2"></div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">视频标题</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：Python 30天入门教程"
              />
               <button
                type="button"
                onClick={handleAISuggest}
                disabled={!formData.title || isSuggesting}
                className="px-3 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                title="仅根据标题推测标签"
              >
                {isSuggesting ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">📚 核心主题</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as VideoCategory })}
              >
                {Object.values(VideoCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">✅ 状态</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as VideoStatus })}
              >
                {Object.values(VideoStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">🏷️ 标签 (回车添加)</label>
            <div className="p-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs flex items-center gap-1 group border border-slate-200">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="w-full text-sm outline-none"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={formData.tags.length === 0 ? "输入标签后按回车..." : ""}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">📝 简要笔记</label>
            <textarea
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="记录关键想法..."
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              {initialData ? '保存修改' : '立即添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};