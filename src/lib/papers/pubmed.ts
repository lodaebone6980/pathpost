import type { Paper } from "@/types/paper";

const BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const DEFAULT_PAGE_SIZE = 10;

function getApiKeyParam(): string {
  const key = process.env.NCBI_API_KEY;
  return key ? `&api_key=${key}` : "";
}

export async function searchPapers(
  query: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ pmids: string[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const url = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${pageSize}&retstart=${offset}&retmode=json${getApiKeyParam()}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`PubMed search failed: ${response.status}`);

  const data = await response.json();
  const result = data.esearchresult;

  return {
    pmids: result.idlist || [],
    total: parseInt(result.count, 10) || 0,
  };
}

export async function fetchPaperSummaries(pmids: string[]): Promise<Paper[]> {
  if (pmids.length === 0) return [];

  const url = `${BASE_URL}/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json${getApiKeyParam()}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`PubMed fetch failed: ${response.status}`);

  const data = await response.json();
  const result = data.result;

  return pmids.map((pmid) => {
    const paper = result[pmid];
    if (!paper) return null;

    return {
      pmid,
      title: paper.title || "",
      authors: (paper.authors || []).map((a: { name: string }) => a.name),
      journal: paper.fulljournalname || paper.source || "",
      year: parseInt(paper.pubdate?.split(" ")[0], 10) || 0,
      doi: paper.elocationid?.replace("doi: ", "") || null,
    };
  }).filter(Boolean) as Paper[];
}

export async function searchAndFetchPapers(
  query: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ papers: Paper[]; total: number; page: number }> {
  const { pmids, total } = await searchPapers(query, page, pageSize);
  const papers = await fetchPaperSummaries(pmids);

  return { papers, total, page };
}
