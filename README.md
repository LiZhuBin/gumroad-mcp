# Gumroad MCP Server

A Model Context Protocol (MCP) server that integrates with Gumroad API, allowing Claude to interact with your Gumroad store.

## Features

- **get_products**: List all products in your Gumroad store
- **get_product**: Get details of a specific product by ID or name
- **get_sales**: View recent sales from your store
- **get_sales_summary**: Get a summary of sales, revenue, and refunds

## Installation

### Using npm

```bash
npm install -g gumroad-mcp
```

### From source

```bash
git clone https://github.com/YOUR_USERNAME/gumroad-mcp.git
cd gumroad-mcp
npm install
npm run build
```

## Configuration

### Getting your Gumroad Access Token

1. Go to your [Gumroad account settings](https://gumroad.com/settings)
2. Click on "Advanced" tab
3. Click "Generate new access token"
4. Copy the generated token

### Setting up the environment variable

Create a `.env` file in the project root:

```
GUMROAD_ACCESS_TOKEN=your_token_here
```

Or set it as an environment variable in your system.

## Usage with Claude

Add this to your MCP configuration (e.g., in `claude_desktop_config.json` or your MCP settings):

```json
{
  "mcpServers": {
    "gumroad": {
      "command": "npx",
      "args": ["gumroad-mcp"],
      "env": {
        "GUMROAD_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "gumroad": {
      "command": "gumroad-mcp",
      "env": {
        "GUMROAD_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Available Tools

### get_products

Returns a list of all products in your Gumroad store.

### get_product

Get details of a specific product.

**Arguments:**
- `identifier` (required): Product ID or name to search for

### get_sales

Returns recent sales from your Gumroad store.

### get_sales_summary

Returns a summary including:
- Total number of sales
- Total revenue
- Number of refunds

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

## License

MIT

## Links

- [Gumroad API Documentation](https://gumroad.com/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
