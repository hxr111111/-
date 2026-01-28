import React from 'react';
import { VideoStatus, VideoCategory } from '../types';

interface BadgeProps {
  type: 'status' | 'category' | 'tag';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  let styles = "px-2.5 py-0.5 rounded-full text-xs font-medium border ";

  if (type === 'status') {
    switch (value) {
      case VideoStatus.UNWATCHED:
        styles += "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case VideoStatus.WATCHING:
        styles += "bg-yellow-50 text-yellow-700 border-yellow-200";
        break;
      case VideoStatus.COMPLETED:
        styles += "bg-green-50 text-green-700 border-green-200";
        break;
      case VideoStatus.ARCHIVED:
        styles += "bg-purple-50 text-purple-700 border-purple-200";
        break;
      case VideoStatus.TRASH:
        styles += "bg-red-50 text-red-700 border-red-200";
        break;
      default:
        styles += "bg-gray-50 text-gray-700 border-gray-200";
    }
  } else if (type === 'category') {
    styles += "bg-indigo-50 text-indigo-700 border-indigo-200";
  } else {
    // Tags
    styles += "bg-slate-100 text-slate-600 border-slate-200";
  }

  return (
    <span className={`${styles} ${className}`}>
      {value}
    </span>
  );
};