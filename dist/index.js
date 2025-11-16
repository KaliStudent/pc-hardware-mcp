#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { searchManuals, queryManual, getManualContent, getAllManuals } from './pdf-search.js';
const DB_PATH = 'printers.db';
class PrinterMCPServer {
    server;
    db;
    constructor() {
        this.server = new Server({
            name: 'printer-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.db = new Database(DB_PATH, { readonly: true });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                // Sales Tools
                {
                    name: 'printer_search',
                    description: 'Search for printers by specifications, budget, features, or keywords. Returns matching printer models.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            manufacturer: { type: 'string', description: 'Filter by manufacturer (HP, Canon, Kyocera, etc.)' },
                            formFactor: { type: 'string', enum: ['desktop', 'workgroup', 'departmental', 'production'], description: 'Printer form factor/size category' },
                            type: { type: 'string', enum: ['laser', 'inkjet', 'led'], description: 'Printing technology' },
                            color: { type: 'boolean', description: 'Color printing capability' },
                            functions: { type: 'array', items: { type: 'string' }, description: 'Required functions: print, copy, scan, fax' },
                            minSpeed: { type: 'number', description: 'Minimum print speed in PPM' },
                            maxSpeed: { type: 'number', description: 'Maximum print speed in PPM' },
                            minPrice: { type: 'number', description: 'Minimum price' },
                            maxPrice: { type: 'number', description: 'Maximum price' },
                            maxDutyMonthly: { type: 'number', description: 'Maximum monthly duty cycle needed' },
                            keywords: { type: 'string', description: 'Search keywords for full-text search' },
                        },
                    },
                },
                {
                    name: 'printer_get_details',
                    description: 'Get complete detailed information about a specific printer model including specs, pricing, consumables, and capabilities.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            printerId: { type: 'string', description: 'Printer ID (e.g., "hp-m527f")' },
                        },
                        required: ['printerId'],
                    },
                },
                {
                    name: 'printer_compare',
                    description: 'Compare multiple printer models side-by-side with detailed specifications, costs, and features.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            printerIds: { type: 'array', items: { type: 'string' }, description: 'Array of printer IDs to compare' },
                        },
                        required: ['printerIds'],
                    },
                },
                {
                    name: 'printer_calculate_tco',
                    description: 'Calculate Total Cost of Ownership for a printer based on usage patterns over time.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            printerId: { type: 'string', description: 'Printer ID' },
                            monthlyVolume: { type: 'number', description: 'Expected monthly page volume' },
                            years: { type: 'number', description: 'Number of years to calculate TCO for', default: 3 },
                            powerCostPerKwh: { type: 'number', description: 'Cost per kWh for electricity', default: 0.12 },
                        },
                        required: ['printerId', 'monthlyVolume'],
                    },
                },
                {
                    name: 'printer_find_consumables',
                    description: 'Find compatible consumables (toner, ink, drums, maintenance kits) for a specific printer with part numbers and costs.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            printerId: { type: 'string', description: 'Printer ID' },
                        },
                        required: ['printerId'],
                    },
                },
                {
                    name: 'printer_recommend',
                    description: 'Get AI-powered printer recommendations based on specific business needs and requirements.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            userCount: { type: 'number', description: 'Number of users who will use the printer' },
                            monthlyVolume: { type: 'number', description: 'Expected monthly print volume in pages' },
                            colorNeeded: { type: 'boolean', description: 'Whether color printing is required' },
                            budget: { type: 'number', description: 'Budget for printer purchase' },
                            mustHaveFunctions: { type: 'array', items: { type: 'string' }, description: 'Required functions (print, copy, scan, fax)' },
                            environment: { type: 'string', description: 'Usage environment description' },
                        },
                        required: ['userCount', 'monthlyVolume'],
                    },
                },
                {
                    name: 'printer_get_stats',
                    description: 'Get database statistics including total printers, manufacturers, and coverage information.',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                // Service Tools
                {
                    name: 'printer_troubleshoot',
                    description: 'Get troubleshooting assistance for error codes, quality issues, paper jams, or network problems.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            printerId: { type: 'string', description: 'Printer ID' },
                            errorCode: { type: 'string', description: 'Error code displayed on printer' },
                            issueType: { type: 'string', enum: ['error', 'quality', 'jam', 'network'], description: 'Type of issue' },
                            description: { type: 'string', description: 'Description of the problem' },
                        },
                        required: ['printerId', 'issueType'],
                    },
                },
                {
                    name: 'printer_setup',
                    description: 'Get step-by-step setup instructions for unboxing, network configuration, and driver installation.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            printerId: { type: 'string', description: 'Printer ID' },
                            setupType: { type: 'string', enum: ['unboxing', 'network', 'driver', 'all'], description: 'Type of setup instructions needed' },
                            networkType: { type: 'string', enum: ['ethernet', 'wifi', 'usb'], description: 'Network connection type (for network setup)' },
                            os: { type: 'string', enum: ['windows', 'mac', 'linux'], description: 'Operating system (for driver setup)' },
                        },
                        required: ['printerId', 'setupType'],
                    },
                },
                {
                    name: 'printer_get_config',
                    description: 'Get instructions for printing configuration pages (meter, config, network) and accessing the web interface.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            printerId: { type: 'string', description: 'Printer ID' },
                            pageType: { type: 'string', enum: ['meter', 'config', 'network', 'all'], description: 'Type of config page needed' },
                        },
                        required: ['printerId'],
                    },
                },
                // Universal Fallback Tool
                {
                    name: 'printer_manual_query',
                    description: 'Query PDF user manuals for detailed information about specific printers, manufacturers, or technical topics. Use this as a fallback when the database doesn\'t have specific information or when you need more detailed technical documentation, setup procedures, troubleshooting steps, or manufacturer-specific details.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'Natural language question or keywords to search for in manuals' },
                            manufacturer: { type: 'string', description: 'Filter by manufacturer (HP, Canon, etc.)' },
                            model: { type: 'string', description: 'Filter by specific model number' },
                            searchType: {
                                type: 'string',
                                enum: ['query', 'keywords', 'full_manual', 'list_manuals'],
                                description: 'Type of search: query (natural language), keywords (specific terms), full_manual (get entire manual), list_manuals (see available manuals)',
                                default: 'query'
                            },
                        },
                        required: ['query'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'printer_search':
                        return await this.handlePrinterSearch(args);
                    case 'printer_get_details':
                        return await this.handleGetDetails(args);
                    case 'printer_compare':
                        return await this.handleCompare(args);
                    case 'printer_calculate_tco':
                        return await this.handleCalculateTCO(args);
                    case 'printer_find_consumables':
                        return await this.handleFindConsumables(args);
                    case 'printer_recommend':
                        return await this.handleRecommend(args);
                    case 'printer_get_stats':
                        return await this.handleGetStats();
                    case 'printer_troubleshoot':
                        return await this.handleTroubleshoot(args);
                    case 'printer_setup':
                        return await this.handleSetup(args);
                    case 'printer_get_config':
                        return await this.handleGetConfig(args);
                    case 'printer_manual_query':
                        return await this.handleManualQuery(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                    isError: true,
                };
            }
        });
    }
    async handlePrinterSearch(criteria) {
        let query = 'SELECT id, manufacturer, model, series, formFactor, type, color, data FROM printers WHERE 1=1';
        const params = [];
        if (criteria.manufacturer) {
            query += ' AND LOWER(manufacturer) = LOWER(?)';
            params.push(criteria.manufacturer);
        }
        if (criteria.formFactor) {
            query += ' AND formFactor = ?';
            params.push(criteria.formFactor);
        }
        if (criteria.type) {
            query += ' AND type = ?';
            params.push(criteria.type);
        }
        if (criteria.color !== undefined) {
            query += ' AND color = ?';
            params.push(criteria.color ? 1 : 0);
        }
        if (criteria.keywords) {
            query += ' AND id IN (SELECT id FROM printers_fts WHERE printers_fts MATCH ?)';
            params.push(criteria.keywords);
        }
        const rows = this.db.prepare(query).all(...params);
        const printers = rows.map(row => JSON.parse(row.data));
        // Apply additional filters
        let filtered = printers;
        if (criteria.functions && criteria.functions.length > 0) {
            filtered = filtered.filter(p => criteria.functions.every(f => p.functions.includes(f)));
        }
        if (criteria.minSpeed) {
            filtered = filtered.filter(p => p.specifications.printSpeed.mono >= criteria.minSpeed);
        }
        if (criteria.maxSpeed) {
            filtered = filtered.filter(p => p.specifications.printSpeed.mono <= criteria.maxSpeed);
        }
        if (criteria.minPrice) {
            filtered = filtered.filter(p => (p.sales.streetPrice || p.sales.msrp) >= criteria.minPrice);
        }
        if (criteria.maxPrice) {
            filtered = filtered.filter(p => (p.sales.streetPrice || p.sales.msrp) <= criteria.maxPrice);
        }
        if (criteria.maxDutyMonthly) {
            filtered = filtered.filter(p => p.specifications.duty.monthly >= criteria.maxDutyMonthly);
        }
        const results = filtered.map(p => ({
            id: p.id,
            manufacturer: p.manufacturer,
            model: p.model,
            type: p.type,
            color: p.color,
            formFactor: p.formFactor,
            speed: p.specifications.printSpeed.mono,
            price: p.sales.streetPrice || p.sales.msrp,
            functions: p.functions,
        }));
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({ count: results.length, printers: results }, null, 2),
                }],
        };
    }
    async handleGetDetails(args) {
        const row = this.db.prepare('SELECT data FROM printers WHERE id = ?').get(args.printerId);
        if (!row) {
            throw new Error(`Printer not found: ${args.printerId}`);
        }
        const printer = JSON.parse(row.data);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(printer, null, 2),
                }],
        };
    }
    async handleCompare(args) {
        const printers = [];
        for (const id of args.printerIds) {
            const row = this.db.prepare('SELECT data FROM printers WHERE id = ?').get(id);
            if (row) {
                printers.push(JSON.parse(row.data));
            }
        }
        if (printers.length === 0) {
            throw new Error('No printers found for comparison');
        }
        const comparison = {
            printers: printers.map(p => ({
                id: p.id,
                manufacturer: p.manufacturer,
                model: p.model,
                type: p.type,
                color: p.color,
                formFactor: p.formFactor,
                speed: {
                    mono: p.specifications.printSpeed.mono,
                    color: p.specifications.printSpeed.color,
                },
                price: {
                    msrp: p.sales.msrp,
                    street: p.sales.streetPrice,
                },
                dutyycle: p.specifications.duty.monthly,
                paperCapacity: {
                    standard: p.specifications.paperHandling.inputCapacity,
                    max: p.specifications.paperHandling.maxInputCapacity,
                },
                costPerPage: p.costs.costPerPage,
                functions: p.functions,
                connectivity: p.specifications.connectivity,
                keyFeatures: p.sales.sellingPoints,
            })),
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(comparison, null, 2),
                }],
        };
    }
    async handleCalculateTCO(args) {
        const row = this.db.prepare('SELECT data FROM printers WHERE id = ?').get(args.printerId);
        if (!row) {
            throw new Error(`Printer not found: ${args.printerId}`);
        }
        const printer = JSON.parse(row.data);
        const years = args.years || 3;
        const powerCost = args.powerCostPerKwh || 0.12;
        const totalPages = args.monthlyVolume * 12 * years;
        // Calculate consumable costs
        const tonerCost = totalPages * printer.costs.costPerPage.mono;
        // Estimate maintenance costs (rough estimate)
        const maintenanceCost = printer.costs.consumables.maintenanceKit
            ? (totalPages / printer.costs.consumables.maintenanceKit.yield) * printer.costs.consumables.maintenanceKit.cost
            : totalPages * 0.002; // Rough estimate if no maintenance kit data
        // Estimate power costs (very rough)
        const avgPowerWatts = parseInt(printer.specifications.powerConsumption.operating) || 500;
        const hoursPerMonth = args.monthlyVolume / printer.specifications.printSpeed.mono;
        const powerCostTotal = (avgPowerWatts / 1000) * hoursPerMonth * 12 * years * powerCost;
        const hardwareCost = printer.sales.streetPrice || printer.sales.msrp;
        const total = hardwareCost + tonerCost + maintenanceCost + powerCostTotal;
        const tco = {
            printer,
            monthlyVolume: args.monthlyVolume,
            years,
            breakdown: {
                hardwareCost,
                tonerCost,
                maintenanceCost,
                powerCost: powerCostTotal,
                total,
            },
            costPerPage: total / totalPages,
            totalPages,
        };
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(tco, null, 2),
                }],
        };
    }
    async handleFindConsumables(args) {
        const row = this.db.prepare('SELECT data FROM printers WHERE id = ?').get(args.printerId);
        if (!row) {
            throw new Error(`Printer not found: ${args.printerId}`);
        }
        const printer = JSON.parse(row.data);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        printer: `${printer.manufacturer} ${printer.model}`,
                        consumables: printer.costs.consumables,
                        costPerPage: printer.costs.costPerPage,
                    }, null, 2),
                }],
        };
    }
    async handleRecommend(args) {
        const { userCount, monthlyVolume, colorNeeded, budget, mustHaveFunctions } = args;
        // Determine form factor based on users
        let formFactor;
        if (userCount <= 5)
            formFactor = 'desktop';
        else if (userCount <= 20)
            formFactor = 'workgroup';
        else
            formFactor = 'departmental';
        // Build search criteria
        const criteria = {
            formFactor,
            maxDutyMonthly: monthlyVolume * 3, // Want 3x safety margin
            maxPrice: budget,
        };
        if (colorNeeded !== undefined) {
            criteria.color = colorNeeded;
        }
        if (mustHaveFunctions) {
            criteria.functions = mustHaveFunctions;
        }
        const searchResult = await this.handlePrinterSearch(criteria);
        const results = JSON.parse(searchResult.content[0].text);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        recommendations: results.printers.slice(0, 5), // Top 5
                        reasoning: {
                            formFactor: `Selected ${formFactor} based on ${userCount} users`,
                            dutyCycle: `Looking for printers that can handle ${monthlyVolume * 3} pages/month`,
                            budget: budget ? `Within budget of $${budget}` : 'No budget constraint',
                        },
                        totalMatches: results.count,
                    }, null, 2),
                }],
        };
    }
    async handleGetStats() {
        const totalPrinters = this.db.prepare('SELECT COUNT(*) as count FROM printers').get();
        const manufacturers = this.db.prepare('SELECT DISTINCT manufacturer FROM printers ORDER BY manufacturer').all();
        const byType = this.db.prepare('SELECT type, COUNT(*) as count FROM printers GROUP BY type').all();
        const byFormFactor = this.db.prepare('SELECT formFactor, COUNT(*) as count FROM printers GROUP BY formFactor').all();
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        totalPrinters: totalPrinters.count,
                        manufacturers: manufacturers.map(m => m.manufacturer),
                        byType,
                        byFormFactor,
                    }, null, 2),
                }],
        };
    }
    async handleTroubleshoot(args) {
        const row = this.db.prepare('SELECT data FROM printers WHERE id = ?').get(args.printerId);
        if (!row) {
            throw new Error(`Printer not found: ${args.printerId}`);
        }
        const printer = JSON.parse(row.data);
        let result = { printer: `${printer.manufacturer} ${printer.model}` };
        switch (args.issueType) {
            case 'error':
                if (args.errorCode) {
                    const error = printer.troubleshooting.commonErrors.find(e => e.code.toLowerCase().includes(args.errorCode.toLowerCase()));
                    result.error = error || { message: 'Error code not found in database' };
                }
                else {
                    result.commonErrors = printer.troubleshooting.commonErrors;
                }
                break;
            case 'quality':
                result.qualityIssues = printer.troubleshooting.qualityIssues;
                break;
            case 'jam':
                result.paperJamGuides = printer.troubleshooting.paperJams;
                break;
            case 'network':
                result.networkIssues = printer.troubleshooting.networkIssues;
                break;
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                }],
        };
    }
    async handleSetup(args) {
        const row = this.db.prepare('SELECT data FROM printers WHERE id = ?').get(args.printerId);
        if (!row) {
            throw new Error(`Printer not found: ${args.printerId}`);
        }
        const printer = JSON.parse(row.data);
        let result = { printer: `${printer.manufacturer} ${printer.model}` };
        switch (args.setupType) {
            case 'unboxing':
                result.unboxing = printer.setup.unboxing;
                result.initialSetup = printer.setup.initialSetup;
                break;
            case 'network':
                if (args.networkType) {
                    result.networkSetup = printer.setup.networkSetup[args.networkType];
                }
                else {
                    result.networkSetup = printer.setup.networkSetup;
                }
                break;
            case 'driver':
                if (args.os) {
                    // Handle OS-specific driver info
                    const driverInfo = {};
                    if (args.os === 'windows') {
                        // Return both Windows versions if 'windows' is specified
                        driverInfo.windows10 = printer.setup.driverInstallation.windows10;
                        driverInfo.windows11 = printer.setup.driverInstallation.windows11;
                        driverInfo.downloads = printer.setup.driverInstallation.driverDownloads;
                    }
                    else if (args.os === 'windows10') {
                        driverInfo.windows10 = printer.setup.driverInstallation.windows10;
                        driverInfo.downloads = printer.setup.driverInstallation.driverDownloads;
                    }
                    else if (args.os === 'windows11') {
                        driverInfo.windows11 = printer.setup.driverInstallation.windows11;
                        driverInfo.downloads = printer.setup.driverInstallation.driverDownloads;
                    }
                    else if (args.os === 'mac') {
                        driverInfo.mac = printer.setup.driverInstallation.mac;
                        driverInfo.downloads = printer.setup.driverInstallation.driverDownloads;
                    }
                    else if (args.os === 'linux') {
                        driverInfo.linux = printer.setup.driverInstallation.linux;
                        driverInfo.downloads = printer.setup.driverInstallation.driverDownloads;
                    }
                    result.driverInstallation = driverInfo;
                }
                else {
                    result.driverInstallation = printer.setup.driverInstallation;
                }
                break;
            case 'all':
                result.setup = printer.setup;
                break;
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                }],
        };
    }
    async handleGetConfig(args) {
        const row = this.db.prepare('SELECT data FROM printers WHERE id = ?').get(args.printerId);
        if (!row) {
            throw new Error(`Printer not found: ${args.printerId}`);
        }
        const printer = JSON.parse(row.data);
        const pageType = args.pageType || 'all';
        let result = { printer: `${printer.manufacturer} ${printer.model}` };
        if (pageType === 'all') {
            result.configPages = printer.setup.configPages;
        }
        else {
            result.instruction = printer.setup.configPages[pageType === 'meter' ? 'meterPage' :
                pageType === 'config' ? 'configPage' :
                    pageType === 'network' ? 'networkConfigPage' : 'webInterface'];
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                }],
        };
    }
    async handleManualQuery(args) {
        const searchType = args.searchType || 'query';
        try {
            // List all available manuals
            if (searchType === 'list_manuals') {
                const manuals = getAllManuals();
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                totalManuals: manuals.length,
                                manuals: manuals.map(m => ({
                                    filename: m.filename,
                                    manufacturer: m.manufacturer,
                                    model: m.model,
                                    type: m.type
                                }))
                            }, null, 2),
                        }],
                };
            }
            // Get full manual content
            if (searchType === 'full_manual') {
                const manual = await getManualContent(args.manufacturer || '', args.model);
                if (!manual) {
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'Manual not found',
                                    manufacturer: args.manufacturer,
                                    model: args.model,
                                    suggestion: 'Use searchType "list_manuals" to see available manuals'
                                }, null, 2),
                            }],
                    };
                }
                // Truncate content if too large (limit to ~50KB)
                const maxLength = 50000;
                const truncated = manual.content.length > maxLength;
                const content = truncated ? manual.content.substring(0, maxLength) + '\n\n[Content truncated...]' : manual.content;
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                filename: manual.filename,
                                pageCount: manual.pageCount,
                                contentLength: manual.content.length,
                                truncated,
                                content
                            }, null, 2),
                        }],
                };
            }
            // Natural language query
            if (searchType === 'query') {
                const results = await queryManual(args.query, args.manufacturer, args.model);
                if (results.length === 0) {
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    message: 'No relevant information found in manuals',
                                    query: args.query,
                                    manufacturer: args.manufacturer,
                                    model: args.model,
                                    suggestion: 'Try different keywords or use searchType "list_manuals" to see what\'s available'
                                }, null, 2),
                            }],
                    };
                }
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                query: args.query,
                                resultsFound: results.length,
                                results: results.map(r => ({
                                    manual: r.filename,
                                    manufacturer: r.manufacturer,
                                    model: r.model,
                                    relevantSections: r.relevantPages.map(p => ({
                                        pageNumber: p.pageNumber,
                                        relevance: p.relevance,
                                        excerpt: p.content.substring(0, 500) + (p.content.length > 500 ? '...' : '')
                                    }))
                                }))
                            }, null, 2),
                        }],
                };
            }
            // Keyword search
            if (searchType === 'keywords') {
                const keywords = args.query.split(/\s+/).filter(k => k.length > 2);
                const results = await searchManuals(keywords, args.manufacturer, args.model, 5);
                if (results.length === 0) {
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    message: 'No results found for keywords',
                                    keywords,
                                    manufacturer: args.manufacturer,
                                    model: args.model
                                }, null, 2),
                            }],
                    };
                }
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                keywords,
                                resultsFound: results.length,
                                results: results.map(r => ({
                                    manual: r.filename,
                                    manufacturer: r.manufacturer,
                                    model: r.model,
                                    matchCount: r.relevantPages.length,
                                    topMatches: r.relevantPages.slice(0, 3).map(p => ({
                                        pageNumber: p.pageNumber,
                                        excerpt: p.content.substring(0, 300) + '...'
                                    }))
                                }))
                            }, null, 2),
                        }],
                };
            }
            throw new Error(`Invalid searchType: ${searchType}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Manual query failed',
                            message: errorMessage,
                            query: args.query
                        }, null, 2),
                    }],
            };
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Printer MCP Server running on stdio');
    }
}
const server = new PrinterMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map