import type { Citation } from "@/types/paper";

export function formatVancouver(citation: Citation, index: number): string {
  const authors = citation.authors.length > 6
    ? `${citation.authors.slice(0, 6).join(", ")}, et al.`
    : citation.authors.join(", ");

  const doi = citation.doi ? ` doi: ${citation.doi}` : "";

  return `${index}. ${authors}. ${citation.title}. ${citation.journal}. ${citation.year}.${doi}`;
}

export function formatAMA(citation: Citation, index: number): string {
  const authors = citation.authors.length > 6
    ? `${citation.authors.slice(0, 3).join(", ")}, et al.`
    : citation.authors.join(", ");

  const doi = citation.doi ? ` doi:${citation.doi}` : "";

  return `${index}. ${authors}. ${citation.title}. *${citation.journal}*. ${citation.year}.${doi}`;
}
