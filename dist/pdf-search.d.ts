export interface PDFManual {
    filename: string;
    path: string;
    manufacturer?: string;
    model?: string;
    type?: string;
    pageCount?: number;
}
export interface PDFSearchResult {
    filename: string;
    manufacturer?: string;
    model?: string;
    relevantPages: {
        pageNumber: number;
        content: string;
        relevance: number;
    }[];
    summary?: string;
}
/**
 * Get all PDF manuals in docs directory
 */
export declare function getAllManuals(): PDFManual[];
/**
 * Search for specific manual by manufacturer and model
 */
export declare function findManual(manufacturer?: string, model?: string): PDFManual | null;
/**
 * Search all PDFs for keywords and return results
 */
export declare function searchManuals(keywords: string | string[], manufacturer?: string, model?: string, maxResults?: number): Promise<PDFSearchResult[]>;
/**
 * Get full manual content for a specific manufacturer/model
 */
export declare function getManualContent(manufacturer: string, model?: string): Promise<{
    filename: string;
    content: string;
    pageCount: number;
} | null>;
/**
 * Query manual with natural language question
 */
export declare function queryManual(question: string, manufacturer?: string, model?: string): Promise<PDFSearchResult[]>;
//# sourceMappingURL=pdf-search.d.ts.map