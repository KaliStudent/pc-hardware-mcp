# Printer MCP REST API Integration Guide

This guide shows how to integrate the Printer MCP Server with your OpenAI chatbot via the REST API wrapper.

## Quick Start

### 1. Start the REST API Server

```bash
npm run api
```

The server will start on `http://localhost:3000`

### 2. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Search for printers
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"manufacturer": "HP", "color": true, "maxPrice": 1000}'

# Query PDF manuals
curl -X POST http://localhost:3000/api/manual-query \
  -H "Content-Type: application/json" \
  -d '{"query": "how to setup wireless", "manufacturer": "Canon", "model": "MF421dw"}'
```

## API Endpoints

### General Endpoints

- **GET /health** - Health check
- **GET /** - API documentation

### Printer Information Endpoints

| Endpoint | Method | Description | Body Parameters |
|----------|--------|-------------|-----------------|
| `/api/search` | POST | Search for printers | `manufacturer`, `formFactor`, `type`, `color`, `minSpeed`, `maxSpeed`, `minPrice`, `maxPrice` |
| `/api/compare` | POST | Compare multiple printers | `printerIds: string[]` |
| `/api/specs` | POST | Get printer specifications | `printerId: string` |
| `/api/costs` | POST | Get cost information | `printerId: string` |
| `/api/recommend` | POST | Get recommendations | `requirements: object`, `budget?: number` |
| `/api/calculate-tco` | POST | Calculate TCO | `printerId: string`, `monthlyVolume: number`, `years: number` |

### Service Endpoints

| Endpoint | Method | Description | Body Parameters |
|----------|--------|-------------|-----------------|
| `/api/troubleshoot` | POST | Get troubleshooting info | `printerId: string`, `issueType: string`, `description?: string` |
| `/api/setup` | POST | Get setup instructions | `printerId: string`, `setupType: string`, `networkType?: string`, `os?: string` |
| `/api/config` | POST | Get config page info | `printerId: string`, `pageType?: string` |
| `/api/manual-query` | POST | Query PDF manuals | `query: string`, `manufacturer?: string`, `model?: string`, `searchType?: string` |

## Integration with OpenAI Chatbot

### Option A: Direct API Calls from Backend

If your OpenAI chatbot runs on a backend server, you can call the REST API directly:

```javascript
// backend/chatbot.js
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PRINTER_API = 'http://localhost:3000';

async function handleChatMessage(userMessage, conversationHistory) {
  // Add user message to history
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  // Call OpenAI with function definitions
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    functions: [
      {
        name: 'search_printers',
        description: 'Search for enterprise printers based on requirements',
        parameters: {
          type: 'object',
          properties: {
            manufacturer: { type: 'string', description: 'Printer manufacturer (HP, Canon, etc.)' },
            color: { type: 'boolean', description: 'Whether printer supports color' },
            maxPrice: { type: 'number', description: 'Maximum price in USD' }
          }
        }
      },
      {
        name: 'query_manual',
        description: 'Search PDF user manuals for detailed technical information',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Question or keywords to search for' },
            manufacturer: { type: 'string', description: 'Filter by manufacturer' },
            model: { type: 'string', description: 'Filter by model number' }
          },
          required: ['query']
        }
      }
    ],
    function_call: 'auto'
  });

  const message = response.choices[0].message;

  // If OpenAI wants to call a function
  if (message.function_call) {
    const functionName = message.function_call.name;
    const functionArgs = JSON.parse(message.function_call.arguments);

    // Call your REST API
    let functionResult;
    if (functionName === 'search_printers') {
      const { data } = await axios.post(`${PRINTER_API}/api/search`, functionArgs);
      functionResult = data;
    } else if (functionName === 'query_manual') {
      const { data } = await axios.post(`${PRINTER_API}/api/manual-query`, functionArgs);
      functionResult = data;
    }

    // Send function result back to OpenAI
    messages.push(message);
    messages.push({
      role: 'function',
      name: functionName,
      content: JSON.stringify(functionResult)
    });

    const secondResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages
    });

    return secondResponse.choices[0].message.content;
  }

  return message.content;
}

// Express endpoint for your chatbot
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  const response = await handleChatMessage(message, history || []);
  res.json({ response });
});
```

### Option B: Function Calling with All Tools

Complete example with all 10 MCP tools:

```javascript
// chatbot-functions.js
export const printerFunctions = [
  {
    name: 'search_printers',
    description: 'Search for enterprise printers based on specific requirements like manufacturer, price, color capability, speed, and form factor',
    parameters: {
      type: 'object',
      properties: {
        manufacturer: {
          type: 'string',
          description: 'Printer manufacturer (HP, Canon, Kyocera, Ricoh, Sharp, Lexmark, Konica Minolta, Brother, Epson)'
        },
        formFactor: {
          type: 'string',
          enum: ['desktop', 'workgroup', 'departmental', 'production', 'wide-format', 'portable'],
          description: 'Size category of the printer'
        },
        type: {
          type: 'string',
          enum: ['laser', 'inkjet', 'led', 'solid-ink', 'thermal'],
          description: 'Printing technology'
        },
        color: { type: 'boolean', description: 'Whether printer supports color printing' },
        minSpeed: { type: 'number', description: 'Minimum pages per minute' },
        maxSpeed: { type: 'number', description: 'Maximum pages per minute' },
        minPrice: { type: 'number', description: 'Minimum price in USD' },
        maxPrice: { type: 'number', description: 'Maximum price in USD' }
      }
    }
  },
  {
    name: 'compare_printers',
    description: 'Compare specifications, costs, and features of multiple printers side-by-side',
    parameters: {
      type: 'object',
      properties: {
        printerIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of printer IDs to compare (2-4 printers)'
        }
      },
      required: ['printerIds']
    }
  },
  {
    name: 'get_specifications',
    description: 'Get detailed technical specifications for a specific printer including speed, resolution, paper handling, memory, and connectivity',
    parameters: {
      type: 'object',
      properties: {
        printerId: { type: 'string', description: 'Unique printer identifier' }
      },
      required: ['printerId']
    }
  },
  {
    name: 'get_costs',
    description: 'Get detailed cost information including consumables (toner, drums, etc.), cost per page, and pricing details',
    parameters: {
      type: 'object',
      properties: {
        printerId: { type: 'string', description: 'Unique printer identifier' }
      },
      required: ['printerId']
    }
  },
  {
    name: 'calculate_tco',
    description: 'Calculate total cost of ownership over time including hardware, consumables, maintenance, and power costs',
    parameters: {
      type: 'object',
      properties: {
        printerId: { type: 'string', description: 'Unique printer identifier' },
        monthlyVolume: { type: 'number', description: 'Expected monthly page volume' },
        years: { type: 'number', description: 'Number of years to calculate (default 3)', default: 3 }
      },
      required: ['printerId', 'monthlyVolume']
    }
  },
  {
    name: 'get_recommendations',
    description: 'Get personalized printer recommendations based on specific business requirements and use cases',
    parameters: {
      type: 'object',
      properties: {
        requirements: {
          type: 'string',
          description: 'Natural language description of needs (e.g., "small office needing color scanning")'
        },
        budget: { type: 'number', description: 'Optional budget constraint in USD' }
      },
      required: ['requirements']
    }
  },
  {
    name: 'troubleshoot',
    description: 'Get troubleshooting information for common printer issues including error codes, paper jams, and quality problems',
    parameters: {
      type: 'object',
      properties: {
        printerId: { type: 'string', description: 'Unique printer identifier' },
        issueType: {
          type: 'string',
          enum: ['error', 'jam', 'quality', 'network', 'all'],
          description: 'Type of issue to troubleshoot'
        },
        description: { type: 'string', description: 'Optional detailed description of the issue' }
      },
      required: ['printerId', 'issueType']
    }
  },
  {
    name: 'get_setup_instructions',
    description: 'Get step-by-step setup instructions for unboxing, network configuration, or driver installation',
    parameters: {
      type: 'object',
      properties: {
        printerId: { type: 'string', description: 'Unique printer identifier' },
        setupType: {
          type: 'string',
          enum: ['unboxing', 'network', 'driver', 'all'],
          description: 'Type of setup instructions needed'
        },
        networkType: {
          type: 'string',
          enum: ['ethernet', 'wifi', 'usb'],
          description: 'Required if setupType is network'
        },
        os: {
          type: 'string',
          enum: ['windows', 'windows10', 'windows11', 'mac', 'linux'],
          description: 'Required if setupType is driver'
        }
      },
      required: ['printerId', 'setupType']
    }
  },
  {
    name: 'get_config_pages',
    description: 'Get information about accessing configuration pages, meter readings, and web interface',
    parameters: {
      type: 'object',
      properties: {
        printerId: { type: 'string', description: 'Unique printer identifier' },
        pageType: {
          type: 'string',
          enum: ['meter', 'config', 'network', 'all'],
          description: 'Type of configuration page information needed'
        }
      },
      required: ['printerId']
    }
  },
  {
    name: 'query_manual',
    description: 'Search PDF user manuals for detailed technical information, setup procedures, or troubleshooting. Use this when database info is insufficient.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language question or keywords to search for in manuals'
        },
        manufacturer: {
          type: 'string',
          description: 'Filter results to specific manufacturer (HP, Canon, etc.)'
        },
        model: {
          type: 'string',
          description: 'Filter results to specific model number'
        },
        searchType: {
          type: 'string',
          enum: ['query', 'keywords', 'full_manual', 'list_manuals'],
          description: 'Type of search to perform',
          default: 'query'
        }
      },
      required: ['query']
    }
  }
];

// Function to call the appropriate API endpoint
export async function callPrinterFunction(functionName, args) {
  const API_BASE = 'http://localhost:3000';
  const endpointMap = {
    'search_printers': '/api/search',
    'compare_printers': '/api/compare',
    'get_specifications': '/api/specs',
    'get_costs': '/api/costs',
    'calculate_tco': '/api/calculate-tco',
    'get_recommendations': '/api/recommend',
    'troubleshoot': '/api/troubleshoot',
    'get_setup_instructions': '/api/setup',
    'get_config_pages': '/api/config',
    'query_manual': '/api/manual-query'
  };

  const endpoint = endpointMap[functionName];
  if (!endpoint) {
    throw new Error(`Unknown function: ${functionName}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return await response.json();
}
```

### Option C: Frontend Integration (React Example)

```jsx
// ChatBot.jsx
import { useState } from 'react';
import OpenAI from 'openai';
import { printerFunctions, callPrinterFunction } from './chatbot-functions';

export function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      // Call your backend API that handles OpenAI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages
        })
      });

      const { response: botResponse } = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: botResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Ask about printers..."
        disabled={loading}
      />
    </div>
  );
}
```

## Example Queries Your Chatbot Can Handle

Once integrated, your chatbot can answer questions like:

1. **Search & Compare**
   - "Find me color laser printers under $1000"
   - "Compare the HP M479fdw with Canon C360i"
   - "What's the best workgroup printer for a small office?"

2. **Cost Analysis**
   - "Calculate the 5-year cost for the Ricoh IM C4510 printing 10,000 pages per month"
   - "What's the cost per page for the HP M527f?"
   - "Show me toner prices for the Kyocera TASKalfa"

3. **Technical Support**
   - "How do I fix a paper jam on the Canon MF421dw?"
   - "Error SC appears on my Ricoh printer, what does it mean?"
   - "My prints have horizontal lines, how to fix?"

4. **Setup & Configuration**
   - "How do I connect the HP LaserJet to WiFi?"
   - "Where can I find the network configuration page?"
   - "How to install drivers on Windows 11?"

5. **Manual Queries** (Using PDF search)
   - "How to setup wireless on Canon MF421dw?"
   - "Where is the maintenance kit on HP 9720e?"
   - "What are the toner replacement steps?"

## Deployment

### Local Development
```bash
npm run api
```

### Production
```bash
# Build the project
npm run build

# Start the API server with PM2
pm2 start dist/rest-api.js --name printer-api

# Or with Docker
docker build -t printer-api .
docker run -p 3000:3000 printer-api
```

### Environment Variables
```env
PORT=3000              # API server port
MCP_SERVER_PATH=/path/to/dist/index.js  # Optional: override MCP server path
```

## Security Considerations

1. **Add Authentication**: The API currently has no authentication. Add API keys or JWT tokens for production:

```javascript
// Add to rest-api.ts
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

2. **Rate Limiting**: Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

3. **CORS Configuration**: Update CORS to only allow your website:

```javascript
app.use(cors({
  origin: 'https://yourwebsite.com',
  credentials: true
}));
```

## Need Help?

- Check the health endpoint: `http://localhost:3000/health`
- View API documentation: `http://localhost:3000`
- Check MCP server logs in the console

## Next Steps

1. Start the REST API: `npm run api`
2. Test endpoints with curl or Postman
3. Integrate with your OpenAI chatbot using the examples above
4. Add authentication and rate limiting for production
5. Deploy to your server or cloud platform
