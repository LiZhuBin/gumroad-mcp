#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Gumroad API Types
interface GumroadProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  url: string;
  published: boolean;
  sales_count: number;
  sales_usd_cents: number;
}

interface GumroadSale {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  currency: string;
  email: string;
  full_name: string;
  created_at: string;
  refunded: boolean;
  chargebacked: boolean;
}

// Gumroad API Client
class GumroadClient {
  private accessToken: string;
  private baseUrl = 'https://api.gumroad.com/v2';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('access_token', this.accessToken);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Gumroad API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data as T;
  }

  async getProducts(): Promise<GumroadProduct[]> {
    const data = await this.request<{ products: GumroadProduct[] }>('/products');
    return data.products || [];
  }

  async getSales(): Promise<GumroadSale[]> {
    const data = await this.request<{ sales: GumroadSale[] }>('/sales');
    return data.sales || [];
  }

  async getProduct(productId: string): Promise<GumroadProduct | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === productId) || null;
  }

  async getSalesSummary(): Promise<{
    totalSales: number;
    totalRevenue: number;
    totalRefunds: number;
  }> {
    const sales = await this.getSales();
    const totalSales = sales.filter(s => !s.refunded && !s.chargebacked).length;
    const totalRevenue = sales
      .filter(s => !s.refunded && !s.chargebacked)
      .reduce((sum, s) => sum + s.price, 0);
    const totalRefunds = sales.filter(s => s.refunded || s.chargebacked).length;

    return {
      totalSales,
      totalRevenue,
      totalRefunds,
    };
  }
}

// MCP Tools definition
const TOOLS: Tool[] = [
  {
    name: 'get_products',
    description: 'Get all products from your Gumroad store',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_product',
    description: 'Get a specific product by ID or name',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Product ID or name to search for',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'get_sales',
    description: 'Get recent sales from your Gumroad store',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_sales_summary',
    description: 'Get a summary of your Gumroad sales including total sales, revenue, and refunds',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool handlers
async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  client: GumroadClient
): Promise<{ content: { type: string; text: string }[] }> {
  try {
    let result: unknown;

    switch (name) {
      case 'get_products':
        result = await client.getProducts();
        break;
      case 'get_product':
        const identifier = args.identifier as string;
        result = await client.getProduct(identifier);
        break;
      case 'get_sales':
        result = await client.getSales();
        break;
      case 'get_sales_summary':
        result = await client.getSalesSummary();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

// Main
async function main() {
  const accessToken = process.env.GUMROAD_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('GUMROAD_ACCESS_TOKEN environment variable is required');
    process.exit(1);
  }

  const client = new GumroadClient(accessToken);

  const server = new Server(
    {
      name: 'gumroad-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args || {}, client);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Gumroad MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
