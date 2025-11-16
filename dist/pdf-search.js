import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOCS_DIR = join(process.cwd(), 'docs');
// Dynamic import for pdf-parse wrapper to handle CommonJS/ESM interop
let pdfParse;
async function getPdfParse() {
    if (!pdfParse) {
        const wrapperPath = join(__dirname, 'pdf-wrapper.cjs');
        const wrapperUrl = pathToFileURL(wrapperPath).href;
        const module = await import(wrapperUrl);
        pdfParse = module.default;
    }
    return pdfParse;
}
/**
 * Extract manufacturer and model from filename
 */
function parseFilename(filename) {
    const name = filename.replace('.pdf', '');
    const parts = name.split('_');
    if (parts.length >= 2) {
        const manufacturer = parts[0];
        const model = parts[1];
        const type = parts.slice(2).join(' ');
        return { manufacturer, model, type };
    }
    return {};
}
/**
 * Get all PDF manuals in docs directory
 */
export function getAllManuals() {
    try {
        const files = readdirSync(DOCS_DIR).filter(f => f.endsWith('.pdf'));
        return files.map(filename => {
            const { manufacturer, model, type } = parseFilename(filename);
            return {
                filename,
                path: join(DOCS_DIR, filename),
                manufacturer,
                model,
                type
            };
        });
    }
    catch (error) {
        console.error('Error reading docs directory:', error);
        return [];
    }
}
/**
 * Search for specific manual by manufacturer and model
 */
export function findManual(manufacturer, model) {
    const manuals = getAllManuals();
    if (!manufacturer && !model) {
        return null;
    }
    const searchTerm = (manufacturer || '').toLowerCase();
    const modelTerm = (model || '').toLowerCase();
    // Try exact match first
    const exactMatch = manuals.find(m => {
        const mfgMatch = !manufacturer || (m.manufacturer?.toLowerCase() === searchTerm);
        const modelMatch = !model || (m.model?.toLowerCase().includes(modelTerm));
        return mfgMatch && modelMatch;
    });
    if (exactMatch)
        return exactMatch;
    // Try partial match
    const partialMatch = manuals.find(m => {
        const mfgMatch = !manufacturer || (m.manufacturer?.toLowerCase().includes(searchTerm));
        const modelMatch = !model || (m.model?.toLowerCase().includes(modelTerm));
        return mfgMatch && modelMatch;
    });
    return partialMatch || null;
}
/**
 * Extract text from PDF
 */
async function extractPDFText(pdfPath) {
    try {
        const module = await getPdfParse();
        const PDFParse = module.PDFParse || module;
        const dataBuffer = readFileSync(pdfPath);
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        return { text: result.text, numpages: result.numPages || 0 };
    }
    catch (error) {
        console.error(`Error parsing PDF ${pdfPath}:`, error);
        return { text: '', numpages: 0 };
    }
}
/**
 * Search for keywords in PDF and return relevant sections
 */
async function searchPDFContent(pdfPath, keywords, contextLines = 5) {
    const { text } = await extractPDFText(pdfPath);
    const lines = text.split('\n');
    const results = [];
    // Estimate page breaks (rough approximation)
    const linesPerPage = Math.ceil(lines.length / 50); // Assume ~50 pages average
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        let relevance = 0;
        // Check if line contains any keywords
        for (const keyword of keywords) {
            if (line.includes(keyword.toLowerCase())) {
                relevance++;
            }
        }
        if (relevance > 0) {
            // Extract context around the match
            const start = Math.max(0, i - contextLines);
            const end = Math.min(lines.length, i + contextLines + 1);
            const content = lines.slice(start, end).join('\n');
            // Estimate page number
            const pageNumber = Math.floor(i / linesPerPage) + 1;
            results.push({
                pageNumber,
                content: content.trim(),
                relevance
            });
        }
    }
    // Sort by relevance and remove duplicates
    const uniqueResults = results
        .sort((a, b) => b.relevance - a.relevance)
        .filter((result, index, self) => index === self.findIndex(r => r.pageNumber === result.pageNumber))
        .slice(0, 10); // Return top 10 most relevant sections
    return uniqueResults;
}
/**
 * Search all PDFs for keywords and return results
 */
export async function searchManuals(keywords, manufacturer, model, maxResults = 5) {
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    const manuals = getAllManuals();
    // Filter by manufacturer/model if specified
    const filteredManuals = manuals.filter(m => {
        if (manufacturer && !m.manufacturer?.toLowerCase().includes(manufacturer.toLowerCase())) {
            return false;
        }
        if (model && !m.model?.toLowerCase().includes(model.toLowerCase())) {
            return false;
        }
        return true;
    });
    const results = [];
    for (const manual of filteredManuals.slice(0, maxResults)) {
        const relevantPages = await searchPDFContent(manual.path, keywordArray);
        if (relevantPages.length > 0) {
            results.push({
                filename: manual.filename,
                manufacturer: manual.manufacturer,
                model: manual.model,
                relevantPages,
                summary: `Found ${relevantPages.length} relevant sections in ${manual.filename}`
            });
        }
    }
    return results.sort((a, b) => {
        const aTotal = a.relevantPages.reduce((sum, p) => sum + p.relevance, 0);
        const bTotal = b.relevantPages.reduce((sum, p) => sum + p.relevance, 0);
        return bTotal - aTotal;
    });
}
/**
 * Get full manual content for a specific manufacturer/model
 */
export async function getManualContent(manufacturer, model) {
    const manual = findManual(manufacturer, model);
    if (!manual) {
        return null;
    }
    const { text, numpages } = await extractPDFText(manual.path);
    return {
        filename: manual.filename,
        content: text,
        pageCount: numpages
    };
}
/**
 * Query manual with natural language question
 */
export async function queryManual(question, manufacturer, model) {
    // Extract keywords from question
    const commonWords = ['how', 'what', 'where', 'when', 'why', 'is', 'are', 'the', 'a', 'an', 'to', 'do', 'does', 'can', 'i'];
    const keywords = question
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
    return searchManuals(keywords, manufacturer, model);
}
//# sourceMappingURL=pdf-search.js.map