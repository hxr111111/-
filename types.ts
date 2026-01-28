export enum VideoStatus {
  UNWATCHED = '未看',
  WATCHING = '观看中',
  COMPLETED = '已看完',
  ARCHIVED = '已归档',
  TRASH = '待清理'
}

export enum VideoCategory {
  PROGRAMMING = '编程开发',
  FITNESS = '健身运动',
  LANGUAGE = '语言学习',
  DESIGN = '设计艺术',
  BUSINESS = '商业财经',
  SCIENCE = '科普知识',
  ENTERTAINMENT = '娱乐休闲',
  OTHER = '其他'
}

export interface Video {
  id: string;
  title: string;
  url: string;
  tags: string[];
  category: VideoCategory;
  status: VideoStatus;
  addedAt: string; // ISO Date string
  notes: string;
  aiSummary?: string;
}

export interface VideoFormData {
  title: string;
  url: string;
  tags: string[];
  category: VideoCategory;
  status: VideoStatus;
  notes: string;
}