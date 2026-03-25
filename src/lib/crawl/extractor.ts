import * as cheerio from "cheerio";
import type { CrawlMetadata } from "@/types/crawl";

const REMOVE_SELECTORS = [
  "script", "style", "noscript", "iframe",
  "nav", "footer", "header", "aside",
  ".ad", ".ads", ".advertisement", ".sidebar",
  ".comment", ".comments", ".social-share",
  "[role='navigation']", "[role='banner']", "[role='contentinfo']",
];

export function extractContent(html: string, url: string): {
  content: string;
  metadata: CrawlMetadata;
  images: string[];
} {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  REMOVE_SELECTORS.forEach((selector) => $(selector).remove());

  // Extract metadata
  const metadata: CrawlMetadata = {
    title: $("title").text().trim() || $('meta[property="og:title"]').attr("content") || "",
    description: $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || null,
    author: $('meta[name="author"]').attr("content") || $('[rel="author"]').text().trim() || null,
    publishedDate: $('meta[property="article:published_time"]').attr("content") || $("time").attr("datetime") || null,
    ogImage: $('meta[property="og:image"]').attr("content") || null,
    siteName: $('meta[property="og:site_name"]').attr("content") || null,
  };

  // Find main content area
  let mainContent = $("article").first();
  if (!mainContent.length) mainContent = $("main").first();
  if (!mainContent.length) mainContent = $('[role="main"]').first();

  // Fallback: find the div with most text
  if (!mainContent.length) {
    let maxLength = 0;
    $("div").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > maxLength) {
        maxLength = text.length;
        mainContent = $(el);
      }
    });
  }

  // Extract images with absolute URLs
  const images: string[] = [];
  mainContent.find("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      try {
        const absoluteUrl = new URL(src, url).href;
        images.push(absoluteUrl);
      } catch {
        // Skip invalid URLs
      }
    }
  });

  // Extract text content preserving paragraph structure
  const paragraphs: string[] = [];
  mainContent.find("p, h1, h2, h3, h4, h5, h6, li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) {
      const tagName = $(el).prop("tagName")?.toLowerCase();
      if (tagName?.startsWith("h")) {
        paragraphs.push(`\n## ${text}\n`);
      } else {
        paragraphs.push(text);
      }
    }
  });

  const content = paragraphs.join("\n\n");

  return { content, metadata, images };
}
