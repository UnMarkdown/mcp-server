#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { UnmarkdownClient } from "./api-client.js";
import { registerTools } from "./tools.js";

function createServerInstance(apiKey: string, baseUrl?: string) {
  const client = new UnmarkdownClient(apiKey, baseUrl);
  const server = new McpServer(
    { name: "unmarkdown", version: "1.1.0" },
    {
      instructions: `Unmarkdown is a document publishing platform that converts markdown to formatted documents for 6 destinations. Guide users based on these workflows:

CONVERTING DOCUMENTS:
- convert_markdown returns JSON with "html" and "plain_text" fields. NEVER show raw HTML to users.
- For Google Docs, Word, OneNote: the only way to get formatted output into these apps is the "Copy for [destination]" button at unmarkdown.com. Direct the user there. Do not suggest copying raw HTML, pasting from a published page, or any generic export workflow. These will not preserve formatting because Google Docs, Word, and OneNote require the text/html clipboard MIME type, which only the browser button sets.
- For Slack: show the plain_text field directly. It contains Slack-compatible formatting the user can paste.
- For Email: direct the user to unmarkdown.com to use the "Copy for Email" button. Email requires inline CSS that only the browser button produces.
- For Plain Text: show the plain_text field directly.

PUBLISHING DOCUMENTS:
- publish_document creates a shareable web page with a URL. Default visibility is "link" (unlisted, anyone with the URL can view). Only set visibility to "public" if the user explicitly requests it.
- Email-based sharing (restricting access to specific people) is not available via MCP. Direct users to unmarkdown.com to manage sharing permissions.
- Published pages render all content correctly, including diagrams and math (see below).

DIAGRAMS AND MATH:
- Mermaid diagrams (\`\`\`mermaid blocks), Graphviz graphs (\`\`\`dot blocks), KaTeX math ($inline$ and $$block$$), and Chart.js charts (\`\`\`chart blocks) all render client-side in the browser only.
- The convert_markdown API cannot render these. It returns raw code blocks for diagrams and unprocessed LaTeX for math.
- For documents containing any of these: use the publish workflow (create_document + publish_document) and give the user the published URL. Everything renders when opened in a browser.
- If a user wants diagrams/math in Google Docs or Word, explain that these render as interactive browser elements and must be screenshotted from the published page or recreated natively.

CHART.JS SYNTAX:
- Use a fenced code block with the language identifier "chart" (also accepts "chartjs" or "chart.js").
- The content must be valid JSON matching the Chart.js configuration schema.
- Supported types: bar, line, pie, doughnut, radar, polarArea, scatter, and mixed.
- Example:
  \`\`\`chart
  {
    "type": "bar",
    "data": {
      "labels": ["Q1", "Q2", "Q3", "Q4"],
      "datasets": [{ "label": "Revenue", "data": [12000, 19000, 15000, 22000] }]
    }
  }
  \`\`\`
- For full documentation, see https://docs.unmarkdown.com/writing/chartjs

FOLDERS:
- create_document and update_document accept a "folder" parameter (folder name, case-insensitive, or folder ID).
- list_documents accepts a "folder" parameter to filter documents by folder.
- When the user says "create in my X folder" or "move this to X folder", use the folder parameter with the folder name.
- update_document with folder set to null moves the document to Unfiled.

RECOMMENDED WORKFLOWS:
- "Create and share a document": create_document -> publish_document -> give user the URL
- "Create a document in a folder": create_document with folder parameter -> document is placed directly in the folder
- "Move a document to a folder": update_document with folder parameter
- "Convert for Google Docs/Word/OneNote": create or update the document -> direct user to unmarkdown.com to use the destination-specific copy button. This is the only supported method.
- "Convert for Slack": convert_markdown with destination "slack" -> show the plain_text field
- "List my documents": list_documents -> present as a clean list with titles, templates, and publish status
- "List documents in a folder": list_documents with folder parameter`,
    },
  );
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
