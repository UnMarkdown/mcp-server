# Unmarkdown MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that connects AI assistants to the [Unmarkdown](https://unmarkdown.com) API. Convert markdown to beautifully formatted documents, manage your document library, and publish pages to the web, all from inside Claude, Cursor, VS Code, or any MCP-compatible client.

## Features

- **Convert markdown** to styled HTML for 8 destinations: Google Docs, Word, Slack, OneNote, Email, Plain Text, generic HTML, and raw HTML
- **62 visual templates** with light and dark themes (Swiss, Executive, Terminal, GitHub, and more)
- **Create, read, update** documents in your Unmarkdown library
- **Publish documents** to shareable public URLs at `unmarkdown.com/d/your-slug`
- **Track API usage** and quota for the current billing period

## Installation

### Claude Desktop / Claude for macOS

Add this to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "unmarkdown": {
      "command": "npx",
      "args": ["-y", "@unmarkdown/mcp-server"],
      "env": {
        "UNMARKDOWN_API_KEY": "um_your_api_key_here"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "unmarkdown": {
      "command": "npx",
      "args": ["-y", "@unmarkdown/mcp-server"],
      "env": {
        "UNMARKDOWN_API_KEY": "um_your_api_key_here"
      }
    }
  }
}
```

### VS Code

Add to your VS Code MCP settings (`.vscode/mcp.json`):

```json
{
  "servers": {
    "unmarkdown": {
      "command": "npx",
      "args": ["-y", "@unmarkdown/mcp-server"],
      "env": {
        "UNMARKDOWN_API_KEY": "um_your_api_key_here"
      }
    }
  }
}
```

### Global Installation

If you prefer to install globally instead of using `npx`:

```bash
npm install -g @unmarkdown/mcp-server
```

Then use `unmarkdown-mcp` as the command instead of `npx`:

```json
{
  "mcpServers": {
    "unmarkdown": {
      "command": "unmarkdown-mcp",
      "env": {
        "UNMARKDOWN_API_KEY": "um_your_api_key_here"
      }
    }
  }
}
```

## Configuration

### Required

| Variable | Description |
|----------|-------------|
| `UNMARKDOWN_API_KEY` | Your Unmarkdown API key (starts with `um_`). Get one from [Settings > API](https://unmarkdown.com) in your Unmarkdown account. |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `UNMARKDOWN_API_URL` | Custom API base URL | `https://api.unmarkdown.com` |

## Usage Examples

### Example 1: Convert a meeting notes draft for Google Docs

> "Take this markdown and convert it for Google Docs using the Executive template:
>
> ```markdown
> # Q1 Planning Meeting
>
> ## Attendees
> - Sarah Chen (Product)
> - Mike Torres (Engineering)
> - Lisa Park (Design)
>
> ## Action Items
> - [ ] Finalize roadmap by Friday
> - [ ] Schedule design review for new dashboard
> - [ ] Update stakeholder presentation
> ```"

Claude will use the `convert_markdown` tool with `destination: "google-docs"` and `template_id: "executive"`, returning styled HTML ready to paste into Google Docs with proper headings, fonts, and colors.

### Example 2: Create and publish a document

> "Create a new document called 'API Changelog - February 2026' with this content, then publish it with a clean URL."

Claude will:
1. Call `create_document` with the title and markdown content
2. Call `publish_document` with the returned document ID and a custom slug

You get back a live URL like `https://unmarkdown.com/d/api-changelog-february-2026`.

### Example 3: Update an existing document

> "List my documents and update the most recent one with this new introduction paragraph."

Claude will:
1. Call `list_documents` to fetch your document library
2. Call `get_document` to read the current content
3. Call `update_document` with the modified markdown

### Example 4: Format markdown for Slack

> "Convert this project update to Slack format so it looks good when I paste it in our team channel."

Claude uses `convert_markdown` with `destination: "slack"`, producing output optimized for Slack's rendering (bold, lists, code blocks, emoji support).

### Example 5: Check API usage

> "How many API calls have I used this month?"

Claude calls `get_usage` and returns your current usage count, monthly limit, and billing period.

## Tools Reference

| Tool | Description | Read-only | Idempotent |
|------|-------------|-----------|------------|
| `convert_markdown` | Convert markdown to styled HTML for any of 8 destinations | Yes | Yes |
| `create_document` | Create a new document in your library | No | No |
| `list_documents` | List saved documents with pagination | Yes | Yes |
| `get_document` | Fetch a document by ID with full content | Yes | Yes |
| `update_document` | Modify a document's title, content, template, or metadata | No | Yes |
| `publish_document` | Publish a document to a shareable public URL | No | Yes |
| `get_usage` | Check API quota for the current billing month | Yes | Yes |

### Destinations

The `convert_markdown` tool supports these output formats:

| Destination | Description |
|-------------|-------------|
| `google-docs` | Optimized for pasting into Google Docs |
| `word` | Formatted for Microsoft Word |
| `slack` | Slack-compatible formatting |
| `onenote` | Microsoft OneNote compatible |
| `email` | Email client friendly HTML |
| `plain-text` | Plain text with ASCII formatting |
| `generic` | General-purpose styled HTML |
| `html` | Raw HTML output |

### Templates

Pass any template ID to `convert_markdown`, `create_document`, or `update_document`. Popular templates include:

| Template | Category |
|----------|----------|
| `swiss` | Free (default) |
| `mono` | Free |
| `github` | Free |
| `terminal` | Free |
| `executive` | Business (Pro) |
| `consulting` | Business (Pro) |
| `startup` | Business (Pro) |

Browse all 62 templates at [unmarkdown.com/templates](https://unmarkdown.com/templates).

## API Limits

| Plan | Monthly API Calls | Rate Limit |
|------|-------------------|------------|
| Free | 1,000 | 10 req/sec |
| Pro ($8/mo annual) | 10,000 | 30 req/sec |

Overage: $1.00 per 1,000 additional calls (Pro only). Free plan has a hard limit.

## Privacy

This MCP server sends your markdown content and document data to the Unmarkdown API (`api.unmarkdown.com`) for processing. No data is stored locally by the MCP server itself. All data handling is governed by the [Unmarkdown Privacy Policy](https://unmarkdown.com/privacy).

Specifically:
- **Markdown content** sent via `convert_markdown` is processed and returned immediately. It is not stored on Unmarkdown servers.
- **Documents** created via `create_document` or `update_document` are stored in your Unmarkdown account and can be deleted at any time.
- **API keys** authenticate requests and are never logged or shared.

For the full privacy policy, visit [unmarkdown.com/privacy](https://unmarkdown.com/privacy).

## Support

- **Issues:** [github.com/UnMarkdown/mcp-server/issues](https://github.com/UnMarkdown/mcp-server/issues)
- **Documentation:** [docs.unmarkdown.com](https://docs.unmarkdown.com)
- **API Reference:** [docs.unmarkdown.com/api/overview](https://docs.unmarkdown.com/api/overview)
- **Contact:** [unmarkdown.com/contact](https://unmarkdown.com/contact)

## Development

```bash
# Clone the repo
git clone https://github.com/UnMarkdown/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run locally (requires API key)
UNMARKDOWN_API_KEY=um_your_key node build/index.js
```

## License

MIT. See [LICENSE](LICENSE) for details.
