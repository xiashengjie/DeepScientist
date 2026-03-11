export interface ArxivItemResponse {
  file_id: string;
  arxiv_id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  tags: string[];
  published_at: string;
  display_name: string;
  created_at: string;
  status: string;
  version?: number;
}

export interface ArxivPaper {
  fileId: string;
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  tags: string[];
  publishedAt: string;
  displayName: string;
  createdAt: string;
  status: string;
  version?: number;
}

export interface ArxivListResponse {
  items: ArxivItemResponse[];
}

export interface ArxivImportResponse {
  status: string;
  file_id: string;
  arxiv_id: string;
}

export interface ArxivBatchImportTask {
  arxiv_id: string;
  status: string;
  file_id?: string;
  error?: string;
}

export interface ArxivBatchImportResponse {
  status: string;
  tasks: ArxivBatchImportTask[];
}
