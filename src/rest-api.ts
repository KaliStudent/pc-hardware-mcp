import express, { Request, Response } from 'express';
import cors from 'cors';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MCP Server Management
let mcpServer: ChildProcess | null = null;
let messageId = 1;
const pendingRequests = new Map<number, any>();

function startMCPServer() {
  const mcpPath = join(__dirname, 'index.js');
  mcpServer = spawn('node', [mcpPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';

  mcpServer.stdout?.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          if (response.id && pendingRequests.has(response.id)) {
            const { resolve, reject } = pendingRequests.get(response.id)!;
            pendingRequests.delete(response.id);

            if (response.error) {
              reject(new Error(response.error.message || 'MCP Error'));
            } else {
              resolve(response.result);
            }
          }
        } catch (err) {
          console.error('Failed to parse MCP response:', line);
        }
      }
    }
  });

  mcpServer.stderr?.on('data', (data) => {
    console.error('MCP stderr:', data.toString());
  });

  mcpServer.on('close', (code) => {
    console.log('MCP server exited with code', code);
    mcpServer = null;
  });

  // Initialize the server
  return new Promise((resolve, reject) => {
    const initTimeout = setTimeout(() => {
      reject(new Error('MCP server initialization timeout'));
    }, 5000);

    // Send initialize request
    const id = messageId++;
    mcpServer?.stdin?.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'REST API Wrapper',
          version: '1.0.0'
        }
      },
      id
    }) + '\n');

    pendingRequests.set(id, {
      resolve: () => {
        clearTimeout(initTimeout);
        resolve(true);
      },
      reject: (err: Error) => {
        clearTimeout(initTimeout);
        reject(err);
      }
    });
  });
}

async function callMCPTool(toolName: string, args: any): Promise<any> {
  if (!mcpServer) {
    throw new Error('MCP server not initialized');
  }

  return new Promise((resolve, reject) => {
    const id = messageId++;
    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Request timeout'));
    }, 30000);

    pendingRequests.set(id, {
      resolve: (result: any) => {
        clearTimeout(timeout);
        resolve(result);
      },
      reject: (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      }
    });

    mcpServer?.stdin?.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      },
      id
    }) + '\n');
  });
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mcpServerRunning: mcpServer !== null,
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Printer MCP REST API',
    version: '1.0.0',
    description: 'REST API wrapper for Printer MCP Server',
    endpoints: {
      'GET /health': 'Health check',
      'GET /': 'This documentation',
      'POST /api/search': 'Search for printers',
      'POST /api/details': 'Get detailed printer information',
      'POST /api/compare': 'Compare printers',
      'POST /api/calculate-tco': 'Calculate total cost of ownership',
      'POST /api/consumables': 'Find consumables (toner, drums, etc.)',
      'POST /api/recommend': 'Get printer recommendations',
      'POST /api/stats': 'Get database statistics',
      'POST /api/troubleshoot': 'Get troubleshooting information',
      'POST /api/setup': 'Get setup instructions',
      'POST /api/config': 'Get configuration page information',
      'POST /api/manual-query': 'Query PDF user manuals'
    },
    exampleUsage: {
      search: 'POST /api/search with { "manufacturer": "HP", "color": true, "maxPrice": 1000 }',
      manualQuery: 'POST /api/manual-query with { "query": "how to setup wireless", "manufacturer": "Canon" }'
    }
  });
});

// Search printers
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_search', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get printer details
app.post('/api/details', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_get_details', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Details retrieval failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Compare printers
app.post('/api/compare', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_compare', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Comparison failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Calculate TCO
app.post('/api/calculate-tco', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_calculate_tco', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'TCO calculation failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Find consumables
app.post('/api/consumables', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_find_consumables', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Consumables search failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get recommendations
app.post('/api/recommend', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_recommend', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Recommendation failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get stats
app.post('/api/stats', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_get_stats', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Stats retrieval failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get troubleshooting info
app.post('/api/troubleshoot', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_troubleshoot', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Troubleshooting failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get setup instructions
app.post('/api/setup', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_setup', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Setup retrieval failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get config pages
app.post('/api/config', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_get_config', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Config retrieval failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Query PDF manuals
app.post('/api/manual-query', async (req: Request, res: Response) => {
  try {
    const result = await callMCPTool('printer_manual_query', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Manual query failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Start server
async function start() {
  try {
    console.log('Starting MCP server...');
    await startMCPServer();
    console.log('MCP server initialized');

    app.listen(PORT, () => {
      console.log(`\n🚀 Printer MCP REST API running on http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}`);
      console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  if (mcpServer) {
    mcpServer.kill();
  }
  process.exit(0);
});

start();
