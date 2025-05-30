# Colosseum Projects Scraper

A tool to fetch and analyze projects from Colosseum hackathons with optional social media integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration (optional):
```bash
cp env.example .env
```

**Note:** The tool works without any environment configuration. Social media integration is optional and disabled by default.

## Usage

```bash
node quick-projects.js
```

### Options

- `--limit <number>` - Number of projects to show (default: 50)
- `--track <name>` - Filter by track name
- `--country <name>` - Filter by country
- `--search <term>` - Search in project names/descriptions
- `--team-size <size>` - Filter by team size (1-5, 6-10, 11+)
- `--min-likes <number>` - Minimum likes required
- `--export <format>` - Export data (csv, json, markdown)
- `--trending <period>` - Trending period (1h, 24h, 7d, 30d, all)
- `--offline` - Use only cached data
- `--verbose` - Verbose output

### Examples

```bash
# Show top 20 DeFi projects
node quick-projects.js --limit 20 --track "DeFi"

# Export US projects with 5+ likes to CSV
node quick-projects.js --country "United States" --min-likes 5 --export csv

# Search for AI projects and show trending data
node quick-projects.js --search "AI" --trending 7d --verbose
```

## API Requirements

- **Colosseum API**: Public API, no authentication required.
- **Social Media API**: Optional for social media data integration. Disabled by default.

## Features

- Fetches project data from Colosseum API
- Optional social media follower/following data integration
- Tracks project metrics over time
- Supports filtering and searching
- Export capabilities (CSV, JSON, Markdown)
- Trending analysis
- Offline mode with cached data

### Social Media Integration (Optional)

To enable social media data integration:

1. Set `SOCIAL_API_KEY` in your `.env` file
2. Configure other social media API settings as needed

All API endpoints and hosts are configurable via environment variables.

### Rate Limiting

The tool includes built-in rate limiting to avoid hitting API limits:

- **RATE_LIMIT_DELAY**: Delay between individual API requests (default: 2000ms)
- **MAX_RETRIES**: Maximum retry attempts for failed requests (default: 3)
- **RETRY_DELAY_BASE**: Base delay for exponential backoff retries (default: 5000ms)

The tool automatically handles:
- 429 (Rate Limit) errors with exponential backoff
- 401 (Authentication) errors with proper logging
- Network failures with retry logic
