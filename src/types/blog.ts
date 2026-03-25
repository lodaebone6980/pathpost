import type { JSONContent } from "@tiptap/react";

export type BlogStatus = "draft" | "published" | "archived";

export interface Blog {
  id: string;
  user_id: string;
  title: string;
  content: JSONContent;
  content_html: string | null;
  status: BlogStatus;
  tags: string[];
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogRequest {
  title: string;
  content: JSONContent;
  tags?: string[];
  status?: BlogStatus;
  thumbnail_url?: string;
}

export interface UpdateBlogRequest {
  title?: string;
  content?: JSONContent;
  content_html?: string;
  status?: BlogStatus;
  tags?: string[];
  thumbnail_url?: string;
}
