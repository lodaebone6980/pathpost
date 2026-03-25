export interface CrawlRequest {
  url: string;
}

export interface CrawlMetadata {
  title: string;
  description: string | null;
  author: string | null;
  publishedDate: string | null;
  ogImage: string | null;
  siteName: string | null;
}

export interface CrawlResult {
  url: string;
  content: string;
  metadata: CrawlMetadata;
  wordCount: number;
  images: string[];
  crawledAt: string;
  cached: boolean;
}

export interface CrawlCache {
  id: string;
  url: string;
  content: string;
  metadata: CrawlMetadata;
  crawled_at: string;
  expires_at: string;
}
