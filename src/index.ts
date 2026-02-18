#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { UnmarkdownClient } from "./api-client.js";
import { registerTools } from "./tools.js";

const apiKey = process.env.UNMARKDOWN_API_KEY;
if (!apiKey) {
  process.stderr.write(
    "Error: UNMARKDOWN_API_KEY environment variable is required.\n" +
      "Get your API key at https://unmarkdown.com/account/api\n",
  );
  process.exit(1);
}

const baseUrl = process.env.UNMARKDOWN_API_URL;
const client = new UnmarkdownClient(apiKey, baseUrl);

const server = new McpServer({
  name: "unmarkdown",
  version: "1.0.0",
});

registerTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("Unmarkdown MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
