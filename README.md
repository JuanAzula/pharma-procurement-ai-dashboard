# TED API Dashboard

An interactive dashboard for tracking pharmaceutical procurement activities across Europe using the TED (Tenders Electronic Daily) API.

## Overview

This dashboard provides comprehensive insights into public procurement of three pharmaceutical products (Abiraterone, Eplerenone, and Pomalidomide) across Germany, Hungary, Italy, and Poland. It leverages the EU's official TED API to fetch real-time contract award data and presents it through an intuitive, filterable interface with rich visualizations.

## Features

### Live Data Integration
- **On-demand data fetching** from the TED API
- Focus on **contract award notices** (realized purchases)
- Real-time filtering and search capabilities
- Automatic data transformation and normalization

### Advanced Filtering
- **Date Range**: Filter contracts by award date
- **Countries**: Multi-select for Germany, Hungary, Italy, and Poland
- **CPV Codes**: Filter by pharmaceutical product categories
- **Supplier**: Search by winning supplier name
- **Contract Value**: Filter by minimum and maximum contract values

### Interactive Visualizations
1. **Timeline Chart**: Track procurement trends over time by country
2. **Country Comparison**: Compare number of contracts and average values across countries
3. **Value Distribution**: Scatter plot showing contract values over time with country segmentation

### Data Table & Details
- Comprehensive table view with key contract information
- Click any row to view detailed notice information
- Pagination support for large datasets
- Links to original TED notice pages

### Key Metrics Dashboard
- Total number of contracts
- Total contract value
- Average contract value
- Number of active countries

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with RTK Query
- **UI Components**: Shadcn UI (Radix UI primitives + Tailwind CSS)
- **Data Visualization**: Recharts
- **Routing**: React Router v6
- **Date Handling**: date-fns
- **Styling**: Tailwind CSS

## Installation

### Prerequisites

- Node.js 16+ (recommended: 18 or 20)
- npm or yarn package manager

### Setup Instructions

1. **Clone or extract the project**
   ```bash
   cd ted-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

## Usage

### Initial View
When you first load the dashboard, it automatically fetches contract award notices from the past 2 years for all target countries and pharmaceutical products.

### Filtering Data
1. Use the **Filter Panel** on the left sidebar to refine your search
2. Select date ranges, countries, CPV codes, or enter supplier names
3. Set minimum/maximum contract values
4. The dashboard updates automatically as you adjust filters
5. Click "Clear All Filters" to reset to default view

### Viewing Details
- Click any row in the data table to open a detailed view
- The detail dialog shows all available information including CPV codes, buyer details, and links to the original TED notice

### Exploring Visualizations
- Switch between three visualization tabs:
  - **Timeline**: See how procurement activity changes over time
  - **Country Comparison**: Compare procurement patterns across countries
  - **Value Distribution**: Analyze contract values and their distribution

## Project Structure

```
ted-api/
├── src/
│   ├── components/
│   │   ├── ui/                    # Shadcn UI components
│   │   ├── Visualizations/        # Chart components
│   │   ├── ErrorBoundary.tsx      # Error handling component
│   │   ├── FilterPanel.tsx        # Filter controls
│   │   ├── Layout.tsx             # Main layout wrapper
│   │   ├── NoticeDetailDialog.tsx # Detail view modal
│   │   └── NoticesTable.tsx       # Data table component
│   ├── config/
│   │   └── ted.ts                 # TED API configuration & constants
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   ├── pages/
│   │   └── Dashboard.tsx          # Main dashboard page
│   ├── services/
│   │   └── tedApi.ts              # RTK Query API service
│   ├── store/
│   │   ├── filterSlice.ts         # Filter state management
│   │   ├── hooks.ts               # Typed Redux hooks
│   │   └── index.ts               # Store configuration
│   ├── types/
│   │   └── ted.ts                 # TypeScript type definitions
│   ├── App.tsx                    # Root application component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── public/                        # Static assets
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── vite.config.ts                 # Vite build configuration
```

## API Integration

### TED API
This dashboard uses the official TED (Tenders Electronic Daily) API v3:
- **Base URL**: `https://api.ted.europa.eu/v3`
- **No API key required** for read-only access
- **Documentation**: https://docs.ted.europa.eu/api/latest/

### Data Fetching Strategy
- Uses RTK Query for efficient caching and automatic refetching
- Focuses on contract award notices (notice type 7)
- Filters by CPV codes relevant to pharmaceutical products
- Searches for specific drug keywords (Abiraterone, Eplerenone, Pomalidomide)

### CPV Codes Used
- `33600000` - Pharmaceutical products (general)
- `33651600` - Antineoplastic agents (Abiraterone)
- `33631600` - Cardiovascular system drugs (Eplerenone)
- `33651700` - Immunosuppressants (Pomalidomide)
- `33651000` - Pharmaceutical preparations (general)

## Assumptions & Design Decisions

### 1. Data Assumptions
- **Notice Type**: Focused on contract award notices (type 7) as these represent actual completed procurements with real contract values and winning suppliers
- **Date Range**: Default 2-year lookback period for meaningful trend analysis
- **Data Quality**: Some notices may have missing fields (supplier, value, etc.) - these are handled gracefully with "N/A" displays
- **Currency**: Contract values are assumed to be in EUR for consistency

### 2. Search Strategy
- Combined keyword search (drug names) with CPV code filtering for maximum relevance
- Multi-country filtering allows comparison across markets
- Pagination handles large result sets efficiently

### 3. UI/UX Decisions
- **Responsive Design**: Works on desktop and tablet (mobile view simplified)
- **Loading States**: Skeleton screens prevent layout shifts during data fetching
- **Error Handling**: Graceful degradation with error boundaries and toast notifications
- **Color Coding**: Consistent colors per country across all visualizations

### 4. Performance Optimizations
- RTK Query provides automatic caching and deduplication
- Memoized calculations for metrics and chart data
- Virtualized rendering for large datasets (table pagination)

## Known Limitations & Future Enhancements

### Current Limitations
1. **API Rate Limits**: TED API may have rate limits (not documented) - implemented with retry logic
2. **Data Completeness**: Not all TED notices have complete information (missing values, suppliers, etc.)
3. **Search Accuracy**: Keyword-based search may miss relevant contracts or include false positives
4. **Historical Data**: Limited to data available through TED API (may not include very old contracts)

### Planned Future Extensions

#### Data Management
- **Export Functionality**: CSV/Excel export of filtered data
- **Saved Filter Presets**: Save and load commonly used filter combinations
- **Bulk Data Download**: Option to download larger datasets for offline analysis

#### Analytics & Insights
- **Advanced Forecasting**: Predictive analytics for future procurement trends
- **Price Analysis**: Track price changes over time for specific products
- **Supplier Intelligence**: Analyze supplier market share and win rates
- **Volume Estimation**: Estimate volumes based on contract values and market data

#### User Experience
- **Email Alerts**: Notifications for new contracts matching specific criteria
- **Dashboard Customization**: Personalize widget layout and default filters
- **Multi-language Support**: Interface translation for EU languages
- **Dark Mode**: Theme switching support

#### Technical Improvements
- **Offline Mode**: Service worker for basic functionality without internet
- **Real-time Updates**: WebSocket connection for live data streaming
- **Advanced Search**: Full-text search with fuzzy matching
- **API Caching Strategy**: More sophisticated caching with background refresh

## Troubleshooting

### Common Issues

1. **No data appearing**
   - Check your internet connection
   - Verify the TED API is accessible (try https://api.ted.europa.eu/v3/notices)
   - Try clearing filters or adjusting the date range

2. **Slow loading**
   - TED API can be slow during peak hours
   - Try narrowing your search criteria (shorter date range, fewer countries)

3. **Build errors**
   - Ensure you're using Node.js 16+
   - Delete `node_modules` and `package-lock.json`, then run `npm install` again

4. **Type errors**
   - Run `npm run build` to check for TypeScript errors
   - Ensure all dependencies are properly installed

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory. You can deploy this to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Contributing

This is a take-home assignment project, but suggestions for improvements are welcome!

## License

This project is created for educational and demonstration purposes.

## Acknowledgments

- Data source: [Tenders Electronic Daily (TED)](https://ted.europa.eu)
- UI Components: [Shadcn UI](https://ui.shadcn.com/)
- Visualization: [Recharts](https://recharts.org/)

---

**Built with ❤️ for RGS Healthcare Solutions**
