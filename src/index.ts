#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { UnmarkdownClient } from "./api-client.js";
import { registerTools } from "./tools.js";

function createServerInstance(apiKey: string, baseUrl?: string) {
  const client = new UnmarkdownClient(apiKey, baseUrl);
  const server = new McpServer({
    name: "unmarkdown",
    version: "1.0.1",
  });
  registerTools(server, client);
  return server;
}

// Smithery sandbox: allows scanning tools without real credentials
export function createSandboxServer() {
  return createServerInstance("um_sandbox").server;
}

// CLI entry point
const isMainModule =
  process.argv[1]?.endsWith("index.js") ||
  process.argv[1]?.endsWith("index.cjs");

if (isMainModule) {
  const apiKey = process.env.UNMARKDOWN_API_KEY;
  if (!apiKey) {
    process.stderr.write(
      "Error: UNMARKDOWN_API_KEY environment variable is required.\n" +
        "Get your API key at https://unmarkdown.com/account/api\n",
    );
    process.exit(1);
  }

  const server = createServerInstance(apiKey, process.env.UNMARKDOWN_API_URL);

  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    process.stderr.write("Unmarkdown MCP server running on stdio\n");
  }).catch((err) => {
    process.stderr.write(`Fatal: ${err}\n`);
    process.exit(1);
  });
}
