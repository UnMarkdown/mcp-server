import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiError, type UnmarkdownClient } from "./api-client.js";

function errorResult(err: unknown) {
  if (err instanceof ApiError) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error ${err.status} (${err.code}): ${err.message}`,
        },
      ],
      isError: true,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

function jsonResult(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
  };
}

export function registerTools(server: McpServer, client: UnmarkdownClient) {
  // 1. convert_markdown
  server.tool(
    "convert_markdown",
    "Convert markdown to destination-specific HTML and plain text. Returns JSON with 'html' and 'plain_text' fields. For Slack, present the plain_text to the user. For Google Docs/Word/OneNote, direct users to unmarkdown.com to use the copy button (raw HTML cannot be pasted into these apps). Does not render Chart.js, Mermaid, Graphviz, or KaTeX; use publish_document for documents with diagrams or math.",
    {
      markdown: z.string().describe("Markdown content to convert"),
      destination: z
        .enum([
          "google-docs",
          "word",
          "slack",
          "onenote",
          "email",
          "plain-text",
          "generic",
          "html",
        ])
        .optional()
        .describe('Target format (default: "generic")'),
      template_id: z
        .string()
        .optional()
        .describe('Visual template ID (default: "swiss")'),
      theme_mode: z
        .enum(["light", "dark"])
        .optional()
        .describe('Color theme (default: "light")'),
    },
    {
      title: "Convert Markdown",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async ({ markdown, destination, template_id, theme_mode }) => {
      try {
        const body: Record<string, unknown> = { markdown };
        if (destination) body.destination = destination;
        if (template_id) body.template_id = template_id;
        if (theme_mode) body.theme_mode = theme_mode;
        const result = await client.request("POST", "/v1/convert", body);
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // 2. create_document
  server.tool(
    "create_document",
    "Create a new markdown document in Unmarkdown",
    {
      title: z.string().optional().describe("Document title"),
      content: z
        .string()
        .optional()
        .describe("Markdown content (default: empty)"),
      folder: z
        .string()
        .optional()
        .describe("Folder name (case-insensitive) or folder ID to place the document in"),
      template_id: z
        .string()
        .optional()
        .describe('Visual template ID (default: "swiss")'),
      theme_mode: z
        .enum(["light", "dark"])
        .optional()
        .describe('Color theme (default: "light")'),
    },
    {
      title: "Create Document",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async ({ title, content, folder, template_id, theme_mode }) => {
      try {
        const body: Record<string, unknown> = {};
        if (title) body.title = title;
        if (content) body.content = content;
        if (folder) body.folder = folder;
        if (template_id) body.template_id = template_id;
        if (theme_mode) body.theme_mode = theme_mode;
        const result = await client.request("POST", "/v1/documents", body);
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // 3. list_documents
  server.tool(
    "list_documents",
    "List your saved documents with pagination. Optionally filter by folder name or ID.",
    {
      folder: z
        .string()
        .optional()
        .describe("Optional. Filter by folder name (case-insensitive) or folder ID."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max results per page (default: 20, max: 100)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from a previous response"),
    },
    {
      title: "List Documents",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async ({ folder, limit, cursor }) => {
      try {
        const query: Record<string, string> = {};
        if (folder) query.folder = folder;
        if (limit) query.limit = String(limit);
        if (cursor) query.cursor = cursor;
        const result = await client.request(
          "GET",
          "/v1/documents",
          undefined,
          query,
        );
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // 4. get_document
  server.tool(
    "get_document",
    "Get a document by ID, including its full markdown content",
    {
      id: z.string().describe("Document UUID"),
    },
    {
      title: "Get Document",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async ({ id }) => {
      try {
        const result = await client.request(
          "GET",
          `/v1/documents/${encodeURIComponent(id)}`,
        );
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // 5. update_document
  server.tool(
    "update_document",
    "Update a document's content or metadata",
    {
      id: z.string().describe("Document UUID"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New markdown content"),
      folder: z
        .string()
        .nullable()
        .optional()
        .describe("Move to folder by name (case-insensitive) or folder ID. Set to null to move to Unfiled."),
      template_id: z.string().optional().describe("New template ID"),
      theme_mode: z
        .enum(["light", "dark"])
        .optional()
        .describe("New color theme"),
      description: z
        .string()
        .nullable()
        .optional()
        .describe("Document description (null to clear)"),
      page_width: z
        .enum(["full", "wide", "standard"])
        .optional()
        .describe("Page width for published view"),
    },
    {
      title: "Update Document",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async ({ id, title, content, folder, template_id, theme_mode, description, page_width }) => {
      try {
        const body: Record<string, unknown> = {};
        if (title !== undefined) body.title = title;
        if (content !== undefined) body.content = content;
        if (folder !== undefined) body.folder = folder;
        if (template_id !== undefined) body.template_id = template_id;
        if (theme_mode !== undefined) body.theme_mode = theme_mode;
        if (description !== undefined) body.description = description;
        if (page_width !== undefined) body.page_width = page_width;
        const result = await client.request(
          "PATCH",
          `/v1/documents/${encodeURIComponent(id)}`,
          body,
        );
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // 6. publish_document
  server.tool(
    "publish_document",
    "Publish a document to a shareable web page. Default visibility is 'link' (unlisted). Published pages render all content including Chart.js charts, Mermaid diagrams, Graphviz graphs, and KaTeX math. Email-based sharing is not available here; direct users to unmarkdown.com for that.",
    {
      id: z.string().describe("Document UUID"),
      slug: z
        .string()
        .optional()
        .describe("Custom URL slug (auto-generated if omitted)"),
      description: z
        .string()
        .optional()
        .describe("SEO description for published page"),
      visibility: z
        .enum(["public", "link"])
        .optional()
        .describe('"public" or "link" (default, unlisted)'),
      page_width: z
        .enum(["full", "wide", "standard"])
        .optional()
        .describe("Page width for published view"),
    },
    {
      title: "Publish Document",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async ({ id, slug, description, visibility, page_width }) => {
      try {
        const body: Record<string, unknown> = {};
        if (slug) body.slug = slug;
        if (description) body.description = description;
        if (visibility) body.visibility = visibility;
        if (page_width) body.page_width = page_width;
        const result = await client.request(
          "POST",
          `/v1/documents/${encodeURIComponent(id)}/publish`,
          body,
        );
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // 7. get_usage
  server.tool(
    "get_usage",
    "Check your API usage quota for the current billing month",
    {},
    {
      title: "Get API Usage",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async () => {
      try {
        const result = await client.request("GET", "/v1/usage");
        return jsonResult(result);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
