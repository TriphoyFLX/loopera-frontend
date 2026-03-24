export interface Loop {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  duration?: number;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  user_id: number;
  created_at: string;
  updated_at?: string;
  author?: string;
}

export interface CreateLoopRequest {
  title: string;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
}

export interface LoopUploadResponse {
  message: string;
  loop: Loop;
}

export interface LoopsResponse {
  loops: Loop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ILoop {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  duration?: number;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface LoopResponse {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  duration?: number;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  user_id: number;
  created_at: Date;
  updated_at: Date;
}