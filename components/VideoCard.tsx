import React from 'react';
import { Video, VideoStatus } from '../types';
import { Badge } from './Badge';
import { ExternalLink, Calendar, Edit2, Trash2, BookOpen, BrainCircuit } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete, onOpenDetail }) => {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden">
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
          <Badge type="category" value={video.category} />
          <Badge type="status" value={video.status} />
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
             {video.title}
          </a>
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {video.tags.map(tag => (
            <Badge key={tag} type="tag" value={tag} />
          ))}
        </div>

        <div className="mt-auto flex items-center text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDate(video.addedAt)}</span>
          </div>
          {video.aiSummary && (
             <div className="flex items-center gap-1 text-emerald-600 font-medium" title="AI Summary Available">
               <BrainCircuit size={14} />
               <span>已生成摘要</span>
             </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center opacity-90">
        <a 
          href={video.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5"
        >
          <ExternalLink size={16} /> Watch
        </a>

        <div className="flex gap-1">
           <button 
            onClick={() => onOpenDetail(video)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
            title="View Details & Notes"
          >
            <BookOpen size={16} />
          </button>
          <button 
            onClick={() => onEdit(video)}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(video.id)}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};