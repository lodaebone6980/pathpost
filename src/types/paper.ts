export interface Paper {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string | null;
  abstract?: string;
}

export interface Citation {
  id: string;
  blog_id: string;
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string | null;
  position: number;
}

export interface PaperSearchRequest {
  query: string;
  page?: number;
  pageSize?: number;
}

export interface PaperSearchResponse {
  papers: Paper[];
  total: number;
  page: number;
}
