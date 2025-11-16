# Quick Start Guide

## What You Have

A complete MCP server with **10 intelligent tools** for printer sales and service, covering 4 major manufacturers with comprehensive data.

## Current Database

- **4 Printer Models** with complete specifications
- **HP LaserJet Enterprise MFP M527f** (Enterprise A4 Monochrome)
- **Kyocera ECOSYS M2640idw** (Workgroup A4 Monochrome)
- **Epson EcoTank Pro ET-5850** (SOHO Color Inkjet)
- **Canon imageRUNNER ADVANCE DX 4751i** (Enterprise A3 Monochrome)

Each includes:
- Complete technical specifications
- Pricing and TCO data
- Detailed troubleshooting guides (error codes, paper jams, quality issues)
- Step-by-step setup instructions
- Network configuration procedures
- Consumables with part numbers and yields
- Maintenance schedules

## Setup in 3 Steps

### 1. Build is Complete
The server has already been built successfully:
```bash
✓ TypeScript compiled
✓ Database created with 4 printers
✓ All dependencies installed
```

### 2. Test the Server (Optional)
```bash
cd C:/users/brian/printerMCP
npm start
```

The server will start and listen on stdio. You can test basic functionality but it's designed to work with Claude Desktop.

### 3. Add to Claude Desktop

Edit your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:
```json
{
  "mcpServers": {
    "printer-info": {
      "command": "node",
      "args": [
        "C:/users/brian/printerMCP/dist/index.js"
      ]
    }
  }
}
```

**Restart Claude Desktop** - The printer tools will now be available!

## Using the Tools

### Sales Team Examples

1. **Search for printers:**
   - "Find me workgroup laser printers under $1500"
   - "Show me color printers that can handle 5000 pages per month"

2. **Get details:**
   - "Tell me about the HP LaserJet M527f"
   - "What are the specs for the Kyocera M2640idw?"

3. **Compare models:**
   - "Compare the HP M527f, Kyocera M2640idw, and Epson ET-5850"

4. **Calculate TCO:**
   - "Calculate 3-year TCO for the Kyocera M2640idw printing 2000 pages/month"

5. **Find consumables:**
   - "What toner cartridges does the HP M527f use?"

6. **Get recommendations:**
   - "Recommend a printer for 10 users printing 3000 pages/month, needs color and scan, budget $2000"

### Service Team Examples

1. **Troubleshoot errors:**
   - "HP M527f is showing error 49.XX.XX, how do I fix it?"
   - "Kyocera M2640idw has vertical lines on prints"

2. **Paper jam help:**
   - "How do I clear a paper jam in the Canon DX 4751i duplex unit?"

3. **Setup assistance:**
   - "How do I set up WiFi on the Epson ET-5850?"
   - "Walk me through unboxing the HP M527f"

4. **Get config pages:**
   - "How do I print the network config page on the Kyocera M2640idw?"
   - "How do I access the web interface on the Canon DX 4751i?"

5. **Quality issues:**
   - "My Epson ET-5850 has banding issues, how do I fix it?"

## Available Tools

### Sales Tools (7)
1. `printer_search` - Find printers by criteria
2. `printer_get_details` - Complete model information
3. `printer_compare` - Side-by-side comparisons
4. `printer_calculate_tco` - Total cost of ownership
5. `printer_find_consumables` - Toner/supplies lookup
6. `printer_recommend` - AI-powered recommendations
7. `printer_get_stats` - Database statistics

### Service Tools (3 additional)
8. `printer_troubleshoot` - Error codes & problem solving
9. `printer_setup` - Installation & configuration
10. `printer_get_config` - Config pages & web access

## Expanding the Database

To add more printers:

1. Create a new JSON file in `data/printers/` (use existing files as templates)
2. Follow the schema in `src/types.ts`
3. Run `npm run build` to rebuild database
4. Restart the MCP server

### What to Include

Each printer JSON should have:
- Basic info (manufacturer, model, type)
- Detailed specifications
- Sales information and pricing
- Consumables with part numbers
- Setup instructions for each connection type
- Troubleshooting guides including:
  - Common error codes with solutions
  - Paper jam clearance procedures
  - Print quality issue resolution
  - Network troubleshooting
- Maintenance procedures

## Tips

- **For Sales**: Focus on TCO calculations and comparisons to show value
- **For Service**: Use error code lookup and troubleshooting guides
- **For IT**: Get network setup and configuration instructions
- **For Management**: Get stats and recommendations for fleet decisions

## Example Workflow

**Sales Scenario:**
1. Customer needs printer for 15 users, 5000 pages/month
2. Use `printer_recommend` to get suggestions
3. Use `printer_compare` to show differences
4. Use `printer_calculate_tco` to show 3-year costs
5. Use `printer_get_details` to provide complete specs

**Service Scenario:**
1. Printer shows error code "E007-0000"
2. Use `printer_troubleshoot` with error code
3. Get step-by-step resolution
4. If parts needed, use `printer_find_consumables` for part numbers
5. Order parts and schedule maintenance

## Need Help?

- Check the full README.md for detailed documentation
- Review the sample JSON files in `data/printers/`
- Look at `src/types.ts` for the complete data schema

## Database Stats

Run this to see what's in the database:
```bash
sqlite3 printers.db "SELECT manufacturer, model FROM printers;"
```

Current coverage:
- 4 printers across 4 manufacturers
- Mix of desktop, workgroup, and departmental form factors
- Both monochrome and color options
- Laser and inkjet technologies
- Comprehensive troubleshooting data for each model

---

**You're ready to go!** The MCP server is built and ready to provide enterprise printer intelligence to any AI system that connects to it.
