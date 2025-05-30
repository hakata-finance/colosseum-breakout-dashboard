# Colosseum Breakout Dashboard

Analytics dashboard for exploring Colosseum hackathon projects with data scraping capabilities.

## Quick Start

```bash
# Clone and install
git clone <your-repo-url>
cd colosseum-breakout-dashboard
npm install

# Run dashboard (http://localhost:3000)
npm run dev

# Or run scraper
npm run script
```

## Architecture

**Dashboard** (`packages/dashboard/`) - Next.js 15 + React 19 + TypeScript
- Modern analytics dashboard with charts, search, and filters
- Virtual scrolling for performance
- Dark mode, mobile responsive

**Scraper** (`packages/script/`) - Node.js data fetching tool
- Fetches project data from Colosseum API
- Optional social media integration
- Export to CSV/JSON/Markdown

## Features

- 🔍 **Smart Search** - Adaptive debouncing, recent searches
- 📊 **Rich Analytics** - Country distribution, track popularity, engagement metrics
- ⚡ **High Performance** - Virtual scrolling, caching, optimized rendering
- 📱 **Mobile First** - Responsive design, dark mode
- 📈 **Data Export** - Multiple formats with filtering
- 🚀 **Modern Stack** - Latest Next.js, React 19, TypeScript

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **Charts**: Recharts  
- **Backend**: Node.js, SQLite
- **Tools**: ESLint, Prettier

## Requirements

- Node.js 18+
- npm 8+

## License

MIT License - see [LICENSE](LICENSE)
