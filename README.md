# Printer MCP Server

[![smithery badge](https://smithery.ai/badge/@KaliStudent/pc-hardware-mcp)](https://smithery.ai/server/@KaliStudent/pc-hardware-mcp)

A comprehensive Model Context Protocol (MCP) server providing enterprise printer information for sales and service teams. Access detailed specifications, pricing, troubleshooting, and setup information for major enterprise printer brands.

## Features

### Supported Manufacturers
- **HP** (Hewlett-Packard)
- **Canon**
- **Kyocera**
- **Konica Minolta**
- **Sharp**
- **Lexmark**
- **Ricoh**
- **Brother**
- **Epson**

### 10 Intelligent Tools

The server provides specialized tools for both sales and service teams:

#### Sales Team Tools

1. **printer_search** - Find printers by specs, budget, features, or keywords
2. **printer_get_details** - Get complete model information including specifications, pricing, and capabilities
3. **printer_compare** - Side-by-side comparison of multiple models
4. **printer_calculate_tco** - Total Cost of Ownership analysis over time
5. **printer_find_consumables** - Compatible toner/supplies with part numbers and costs
6. **printer_recommend** - AI-powered recommendations based on business needs
7. **printer_get_stats** - Database coverage and statistics

#### Service Team Tools

1. **printer_search** - Find printers by specifications
2. **printer_get_details** - Complete model and technical information
3. **printer_troubleshoot** - Error code handling and problem resolution
4. **printer_setup** - Setup instructions by model and manufacturer
5. **printer_find_consumables** - Compatible supplies and part numbers
6. **printer_get_config** - Print config pages and web interface access
7. **printer_get_stats** - Database information

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Setup

1. **Clone or download** this repository to your local machine

2. **Install dependencies:**
```bash
cd printerMCP
npm install
```

3. **Build the project:**
```bash
npm run build
```

This command will:
- Compile TypeScript to JavaScript
- Build the SQLite database from JSON source files
- Prepare the server for use

## Usage

### Running the Server

The MCP server communicates over stdio. It's designed to be used with MCP-compatible clients like Claude Desktop.

#### Standalone Testing
```bash
npm start
```

#### With Claude Desktop

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

Restart Claude Desktop after adding this configuration.

## Tool Reference

### 1. printer_search

Search for printers matching specific criteria.

**Parameters:**
- `manufacturer` (string, optional): Filter by manufacturer (HP, Canon, Kyocera, etc.)
- `formFactor` (string, optional): desktop, workgroup, departmental, production
- `type` (string, optional): laser, inkjet, led
- `color` (boolean, optional): Color printing capability
- `functions` (array, optional): Required functions ["print", "copy", "scan", "fax"]
- `minSpeed` (number, optional): Minimum print speed in PPM
- `maxSpeed` (number, optional): Maximum print speed in PPM
- `minPrice` (number, optional): Minimum price in USD
- `maxPrice` (number, optional): Maximum price in USD
- `maxDutyMonthly` (number, optional): Maximum monthly duty cycle requirement
- `keywords` (string, optional): Full-text search keywords

**Example:**
```json
{
  "manufacturer": "HP",
  "formFactor": "workgroup",
  "color": false,
  "maxPrice": 2000,
  "minSpeed": 40
}
```

### 2. printer_get_details

Get complete information about a specific printer model.

**Parameters:**
- `printerId` (string, required): Printer ID (e.g., "hp-m527f", "kyocera-m2640idw")

**Returns:**
- Complete printer specifications
- Sales information and pricing
- Cost per page and consumables
- Setup instructions
- Troubleshooting guides
- Firmware information
- Warranty details

### 3. printer_compare

Compare multiple printer models side-by-side.

**Parameters:**
- `printerIds` (array of strings, required): Array of printer IDs to compare

**Example:**
```json
{
  "printerIds": ["hp-m527f", "kyocera-m2640idw", "epson-et5850"]
}
```

### 4. printer_calculate_tco

Calculate Total Cost of Ownership for a printer.

**Parameters:**
- `printerId` (string, required): Printer ID
- `monthlyVolume` (number, required): Expected monthly page volume
- `years` (number, optional): Number of years (default: 3)
- `powerCostPerKwh` (number, optional): Electricity cost per kWh (default: 0.12)

**Returns:**
- Hardware cost
- Consumables cost over time
- Maintenance costs
- Power costs
- Total cost and cost-per-page

### 5. printer_find_consumables

Find all compatible consumables for a printer.

**Parameters:**
- `printerId` (string, required): Printer ID

**Returns:**
- Toner/ink cartridges with part numbers and yields
- Drum units
- Maintenance kits
- Waste containers
- Cost per page information

### 6. printer_recommend

Get intelligent printer recommendations based on requirements.

**Parameters:**
- `userCount` (number, required): Number of users
- `monthlyVolume` (number, required): Expected monthly pages
- `colorNeeded` (boolean, optional): Need for color printing
- `budget` (number, optional): Budget constraint
- `mustHaveFunctions` (array, optional): Required functions
- `environment` (string, optional): Usage environment description

**Returns:**
- Top recommended models
- Reasoning for recommendations
- Total matches found

### 7. printer_get_stats

Get database statistics and coverage information.

**Parameters:** None

**Returns:**
- Total number of printers in database
- List of manufacturers
- Breakdown by printer type
- Breakdown by form factor

### 8. printer_troubleshoot

Get troubleshooting assistance for printer issues.

**Parameters:**
- `printerId` (string, required): Printer ID
- `issueType` (string, required): error, quality, jam, network
- `errorCode` (string, optional): Specific error code displayed
- `description` (string, optional): Problem description

**Returns:**
- Relevant troubleshooting guides
- Error code explanations and solutions
- Step-by-step resolution procedures
- Parts needed for repairs

**Example:**
```json
{
  "printerId": "hp-m527f",
  "issueType": "error",
  "errorCode": "49.XX.XX"
}
```

### 9. printer_setup

Get setup and installation instructions.

**Parameters:**
- `printerId` (string, required): Printer ID
- `setupType` (string, required): unboxing, network, driver, all
- `networkType` (string, optional): ethernet, wifi, usb (for network setup)
- `os` (string, optional): windows, mac, linux (for driver setup)

**Returns:**
- Step-by-step setup instructions
- Network configuration guides
- Driver installation procedures
- Common setup issues and solutions

**Example:**
```json
{
  "printerId": "kyocera-m2640idw",
  "setupType": "network",
  "networkType": "wifi"
}
```

### 10. printer_get_config

Get instructions for printing configuration pages and accessing web interface.

**Parameters:**
- `printerId` (string, required): Printer ID
- `pageType` (string, optional): meter, config, network, all (default: all)

**Returns:**
- Instructions for printing meter pages (page counts)
- Configuration page printing
- Network configuration pages
- Web interface access instructions

## Database Structure

The server uses a hybrid approach:
- **Source Data**: Human-readable JSON files in `data/printers/`
- **Runtime Database**: SQLite database compiled from JSON for fast queries
- **Full-Text Search**: Built-in FTS5 search for keyword queries

### Adding New Printers

1. Create a new JSON file in `data/printers/` following the schema in `src/types.ts`
2. Run `npm run build` to rebuild the database
3. Restart the MCP server

## Architecture

```
printerMCP/
├── src/
│   ├── types.ts              # TypeScript interfaces and types
│   ├── build-database.ts      # JSON to SQLite compiler
│   └── index.ts               # MCP server implementation
├── data/
│   └── printers/              # JSON source files
│       ├── hp-laserjet-m527f.json
│       ├── kyocera-ecosys-m2640idw.json
│       └── epson-ecotank-et5850.json
├── dist/                      # Compiled JavaScript (generated)
├── printers.db                # SQLite database (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Data Coverage

Current database includes comprehensive information for:
- Enterprise A3/A4 MFPs
- Workgroup laser and inkjet devices
- SOHO (Small Office/Home Office) printers
- Production digital presses

Each printer entry includes:
- Complete technical specifications
- Pricing information (MSRP and street prices)
- Consumables with part numbers and yields
- Cost-per-page calculations
- Detailed setup instructions
- Comprehensive troubleshooting guides
- Network configuration procedures
- Maintenance schedules

## Development

### Build
```bash
npm run build
```

### Watch Mode (for development)
```bash
npm run watch
```

### Adding More Printers

To expand the database, add JSON files to `data/printers/` following this structure:

```json
{
  "id": "manufacturer-model",
  "manufacturer": "HP",
  "model": "LaserJet Pro MFP M428fdw",
  "series": "LaserJet Pro",
  "formFactor": "workgroup",
  "type": "laser",
  "color": false,
  "functions": ["print", "copy", "scan", "fax"],
  "specifications": { ... },
  "sales": { ... },
  "costs": { ... },
  "setup": { ... },
  "troubleshooting": { ... }
}
```

See `src/types.ts` for the complete schema definition.

## Use Cases

### For Sales Teams
- Quickly find printers matching customer requirements
- Compare competitive models side-by-side
- Calculate and present TCO to customers
- Provide accurate consumable costs and part numbers
- Generate recommendations based on usage patterns

### For Service Teams
- Rapid error code lookup and resolution
- Step-by-step troubleshooting guides
- Network setup and configuration assistance
- Consumable identification and ordering
- Maintenance schedules and procedures

### For IT Departments
- Evaluate printers for fleet deployment
- TCO analysis for budgeting
- Technical specifications for procurement
- Setup and configuration documentation
- Troubleshooting knowledge base

## License

MIT

## Contributing

To contribute additional printer data:
1. Follow the JSON schema in `src/types.ts`
2. Add comprehensive troubleshooting and setup information
3. Include accurate part numbers and specifications
4. Test the data by rebuilding the database

## Support

For issues or questions:
- Check the troubleshooting guides in printer data
- Review the tool reference above
- Verify database was built successfully with `npm run build`

## Version History

### 1.0.0 (2025-01-13)
- Initial release
- 10 intelligent tools for sales and service
- Support for 9 major manufacturers
- Comprehensive printer database
- Full-text search capabilities
- TCO calculation engine
- Troubleshooting knowledge base