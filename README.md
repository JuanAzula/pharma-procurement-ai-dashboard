# TED API Dashboard 🚀

> **AI-Powered Pharmaceutical Procurement Analytics Platform**

An intelligent dashboard for tracking and forecasting pharmaceutical procurement activities across Europe using the TED (Tenders Electronic Daily) API, enhanced with TensorFlow-based predictions and automated insights.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=flat&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [✨ Key Features](#-key-features)
- [🤖 AI Capabilities](#-ai-capabilities)
- [🚀 Quick Start](#-quick-start)
- [💻 Technology Stack](#-technology-stack)
- [📊 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [📖 Usage Guide](#-usage-guide)
- [🐳 Docker Deployment](#-docker-deployment)
- [🛠️ Development](#️-development)
- [📈 Future Roadmap](#-future-roadmap)

---

## Overview

This dashboard provides comprehensive insights into public procurement of **pharmaceutical products** (Abiraterone, Eplerenone, Pomalidomide, and Immunosuppressants) across **Germany, Hungary, Italy, and Poland**. 

It leverages the EU's official **TED API** to fetch real-time contract award data and presents it through an intuitive, filterable interface with rich visualizations and **AI-powered forecasting and insights**.

### Business Value

- 📊 **Track procurement trends** over time and across countries
- 💰 **Analyze contract values** and award patterns
- 🔮 **Forecast future activity** using machine learning
- 🎯 **Identify anomalies** and market opportunities
- 📈 **Compare markets** with EU-wide benchmarking

---

## ✨ Key Features

### 🔍 Live Data Integration
- **Real-time data fetching** from TED API v3 (no API key required)
- Focus on **contract award notices** (realized purchases, not just calls for tender)
- Automatic data transformation and normalization
- Smart pagination and caching

### 🎛️ Advanced Filtering
- **Date Range**: Filter by award date with custom start/end dates
- **Countries**: Multi-select (DE, HU, IT, PL)
- **CPV Codes**: Pharmaceutical-specific product categories
- **Supplier Search**: Find contracts by winning supplier name
- **Value Range**: Min/max contract value filters
- **Clear All**: One-click filter reset

### 📊 Interactive Visualizations
1. **Timeline Chart** - Track procurement trends over time by country
2. **Country Comparison** - Compare contract counts and average values
3. **Value Distribution** - Scatter plot of contract values over time with country segmentation
4. **AI Forecast** ⭐ - TensorFlow-based predictions (see [AI Capabilities](#-ai-capabilities))
5. **AI Insights** ⭐ - Automated intelligence and anomaly detection

### 📋 Data Management
- **Comprehensive table view** with sortable columns
- **Pagination** for large datasets
- **Detailed modal view** - Click any row for full notice information
- **Direct links** to original TED notices
- **Responsive design** - Works on desktop, tablet, and mobile

### 🌍 Multi-Language Support
- English, Spanish, and Dutch interface translations
- Automatic language detection
- Cached translations for performance

---

## 🤖 AI Capabilities

### 📈 **AI-Powered Forecasting**

Built with **TensorFlow.js**, the forecast engine provides intelligent predictions of future procurement activity.

**Features:**
- ✅ **Neural network training** on historical procurement data
- ✅ **Configurable forecast horizon** (1-24 months)
- ✅ **Automatic gap filling** - Intelligently fills missing months
- ✅ **Staleness detection** - Warns when data is >6 months old
- ✅ **Dual-timeline view** - Overlays historical actuals with forecast predictions
- ✅ **Confidence indicators** - Visual freshness warnings

**How it works:**
1. Aggregates historical contract awards by month
2. Trains a lightweight sequential neural network
3. Generates predictions for future months
4. Provides metadata (training samples, data freshness, gaps)

**Access:** Navigate to the **Forecast** tab in visualizations

```bash
# Test the forecaster from CLI
cd backend
npm run sample
```

### 🎯 **AI Insight Spotlight**

Automated intelligence that detects patterns, anomalies, and provides macro-economic context.

**Features:**
- ✅ **Spike detection** - Identifies sudden increases (>50%) in spending
- ✅ **Trend analysis** - Detects contractions and growth patterns
- ✅ **Country surprises** - Highlights unexpected market dominance
- ✅ **Macro alignment** - Contextualizes with **live EU-wide procurement data**
- ✅ **Narrative insights** - Human-readable highlights and cards
- ✅ **Multi-language** - Insights translated to user's language

**How it works:**
1. Analyzes historical patterns for anomalies
2. Aggregates by country to find surprises
3. Fetches **live macro data** from TED API (all EU pharma procurement)
4. Generates contextual insight cards
5. Translates insights for accessibility

**Access:** Navigate to the **AI Insights** tab in visualizations

### 🧠 **Backend AI Architecture**

**Tech Stack:**
- **TensorFlow.js Node** (`@tensorflow/tfjs-node`) - Neural network training
- **Express** - REST API
- **TypeScript** - Type-safe implementation
- **Redis** - Translation caching

**API Endpoints:**
- `POST /forecast` - Generate predictions
- `POST /insights` - Generate automated insights
- `POST /translate` - Translation with caching
- `GET /health` - Health check

---

## 🚀 Quick Start

Choose your deployment method:

### Option 1: Local Development (Recommended for Getting Started) 💻

The simplest way to run the application on your machine - no Docker required!

#### Prerequisites

- **Node.js** 16+ (recommended: 18 or 20)
- **npm** or yarn
- **Modern browser** (Chrome, Firefox, Safari, Edge)

> **Note:** Redis is optional for local development. The app will work without it; translations just won't be cached.

#### Installation Steps

**1️⃣ Install Dependencies**

```bash
# Backend (AI services)
cd backend
npm install

# Frontend (dashboard)
cd ../front
npm install
```

**2️⃣ Start Backend (in first terminal)**

```bash
cd backend
npm run dev
```
✅ Backend starts on **http://localhost:4000**

**3️⃣ Start Frontend (in second terminal)**

```bash
cd front
npm run dev
```
✅ Frontend starts on **http://localhost:5173**

**4️⃣ Open Dashboard**

Navigate to **http://localhost:5173** in your browser.

🎉 **That's it!** The dashboard will automatically fetch real data from the TED API and connect to your local backend for AI features.

---

### Option 2: Docker Deployment 🐳

For production-like deployment with all services containerized.

```bash
# Build and start all services (frontend, backend, Redis)
docker compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:4000
```

See **[DOCKER.md](../DOCKER.md)** for detailed Docker deployment instructions.

---

## 💻 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching
- **Shadcn UI** - Beautiful, accessible components (Radix UI + Tailwind)
- **Recharts** - Data visualizations
- **React Router v6** - Navigation
- **Vite** - Build tool
- **i18next** - Internationalization
- **Tailwind CSS** - Styling

### Backend
- **Express** - REST API framework
- **TypeScript** - Type safety
- **TensorFlow.js Node** - Machine learning
- **Axios** - HTTP client
- **Redis** - Caching layer
- **Zod** - Runtime validation
- **google-translate-api-x** - Translation service

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Playwright** - E2E testing
- **Jest** - Unit testing

---

## 📊 Project Structure

```
ted-api/
├── backend/                      # AI & API Services
│   ├── src/
│   │   ├── routes/
│   │   │   ├── forecast.ts       # Forecast endpoint
│   │   │   ├── insights.ts       # Insights endpoint
│   │   │   └── translation.ts    # Translation endpoint
│   │   ├── services/
│   │   │   ├── forecastService.ts        # TensorFlow forecasting
│   │   │   ├── insightService.ts         # Anomaly detection
│   │   │   ├── procurementMacroService.ts # EU-wide data
│   │   │   └── translationService.ts     # i18n with caching
│   │   └── server.ts             # Express app
│   ├── Dockerfile
│   └── package.json
│
├── front/                        # React Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Visualizations/
│   │   │   │   ├── TimelineChart.tsx
│   │   │   │   ├── CountryComparison.tsx
│   │   │   │   ├── ValueDistribution.tsx
│   │   │   │   ├── Forecast.tsx          # AI forecast UI
│   │   │   │   └── InsightSpotlight.tsx  # AI insights UI
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── NoticesTable.tsx
│   │   │   └── NoticeDetailDialog.tsx
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   ├── tedApi.ts         # TED API client
│   │   │   ├── forecastApi.ts    # Forecast client
│   │   │   └── insightApi.ts     # Insights client
│   │   ├── store/
│   │   │   ├── filterSlice.ts    # Redux filters
│   │   │   └── index.ts          # Store config
│   │   └── types/
│   │       └── ted.ts            # TypeScript types
│   ├── e2e/                      # Playwright tests
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml            # Full stack deployment
└── DOCKER.md                     # Docker documentation
```

---

## 🔧 Configuration

### Environment Variables

#### Frontend (`front/.env`)

```env
# Backend API URLs (optional)
VITE_FORECAST_API_URL=http://localhost:4000
VITE_INSIGHTS_API_URL=http://localhost:4000
```

#### Backend (`backend/.env`)

```env
# Server
PORT=4000

# Redis (for translation caching)
REDIS_URL=redis://localhost:6379

# Optional: Translation API
# (Uses google-translate-api-x by default)
```

### TED API Configuration

Located in `front/src/config/ted.ts`:

```typescript
// CPV Codes for pharmaceutical products
export const PHARMACEUTICAL_CPV_CODES = [
  '33600000',  // Pharmaceutical products
  '33651600',  // Antineoplastic agents
  '33631600',  // Cardiovascular drugs
  '33651700',  // Immunosuppressants
  '33651000',  // Pharmaceutical preparations
];

// Target countries
export const DEFAULT_TARGET_COUNTRIES = ['DE', 'HU', 'IT', 'PL'];
```

---

## 📖 Usage Guide

### Initial Dashboard View

When you load the dashboard:
- ✅ Automatically fetches **contract awards from the past 2 years**
- ✅ Shows data for **all 4 target countries**
- ✅ Displays **key metrics** at the top (total contracts, total value, etc.)
- ✅ Renders **interactive visualizations**
- ✅ Lists **notices in a sortable table**

### Applying Filters

1. **Date Range** - Click date buttons to open calendar picker
2. **Countries** - Click country badges (DE, IT, PL, HU) to toggle
3. **Supplier** - Type supplier name in search box
4. **Value Range** - Enter min/max contract values
5. **Clear All** - Reset to default view

All visualizations and the table update **automatically** when filters change.

### Viewing Notice Details

- Click any row in the table
- Modal dialog opens with complete information:
  - Award date, publication date
  - Buyer details and country
  - CPV codes (with tooltips)
  - Contract value
  - Winning supplier
  - Direct link to original TED notice

### Using AI Forecast

1. Navigate to **Forecast** tab
2. Adjust settings:
   - **Horizon** - How many months to predict (1-24)
   - **Fill Missing Months** - Auto-fill gaps in historical data
   - **Anchor to Today** - Extend timeline to current month
3. View:
   - Blue line = Historical actuals
   - Orange/shaded area = Forecast predictions
   - Freshness warnings if data is stale (>6 months old)

### Exploring AI Insights

1. Navigate to **AI Insights** tab
2. View:
   - **Highlights** - Key findings (spikes, trends, surprises)
   - **Macro Alignment Cards** - EU-wide context
   - **Sentiment indicators** - Positive/negative/neutral
3. Insights update automatically with filters

### Changing Language

1. Click language selector (top right)
2. Choose: English, Español, or Nederlands
3. UI and insights translate automatically
4. Translations are cached for performance

---

## 🐳 Docker Deployment

Full containerized deployment with Docker Compose.

### Quick Deploy

```bash
# Build and start all services
docker compose up --build

# Access:
# - Frontend: http://localhost
# - Backend: http://localhost:4000
# - Redis: localhost:6379
```

### Services

- **frontend** - React app (Nginx, port 80)
- **backend** - Express API (Node, port 4000)
- **redis** - Cache (port 6379)

See **[DOCKER.md](./DOCKER.md)** for detailed deployment instructions.

---

## 🛠️ Development

### Available Scripts

#### Frontend

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run test:e2e   # Run Playwright E2E tests
```

#### Backend

```bash
npm run dev        # Start with hot reload
npm run build      # Compile TypeScript
npm run start      # Run compiled JS
npm test           # Run Jest tests
npm run sample     # Test forecaster CLI
```

### Building for Production

```bash
# Frontend
cd front
npm run build
# Output: front/dist/

# Backend
cd backend
npm run build
# Output: backend/dist/
```

### Testing

```bash
# E2E tests (Playwright)
cd front
npm run test:e2e

# Unit tests (Jest) - Backend
cd backend
npm test
```

---

## 📈 Future Roadmap

### Planned Features

#### Data Management
- [ ] **CSV/Excel export** of filtered data
- [ ] **Saved filter presets** with sharing
- [ ] **Bulk data downloads** for offline analysis
- [ ] **Scheduled reports** via email

#### Advanced AI
- [ ] **Enhanced forecasting** with ARIMA/Prophet models
- [ ] **Price prediction** for specific products
- [ ] **Supplier win-rate analytics**
- [ ] **Market sentiment analysis**
- [ ] **Automated alerts** for anomalies

#### User Experience
- [ ] **Email notifications** for new matching contracts
- [ ] **Custom dashboard layouts**
- [ ] **Dark mode** theme
- [ ] **Mobile-optimized views**
- [ ] **Accessibility (WCAG 2.1 AA)**

#### Technical
- [ ] **GraphQL API** option
- [ ] **Real-time updates** via WebSockets
- [ ] **Offline mode** with service workers
- [ ] **Advanced search** with fuzzy matching

---

## 📚 Additional Documentation

- **[DOCKER.md](./DOCKER.md)** - Docker deployment guide
- **[API Documentation](./backend/README.md)** - Backend API reference *(coming soon)*

---

## 🤝 Contributing

For questions or suggestions, feel free to reach out!

---

## 📄 License

This project is created for educational and demonstration purposes.

---

## 🙏 Acknowledgments

- **Data Source**: [Tenders Electronic Daily (TED)](https://ted.europa.eu) - European Union public procurement data
- **UI Framework**: [Shadcn UI](https://ui.shadcn.com/) - Beautiful, accessible React components
- **Visualizations**: [Recharts](https://recharts.org/) - Composable charting library
- **AI Framework**: [TensorFlow.js](https://www.tensorflow.org/js) - Machine learning in JavaScript

*Transforming procurement data into actionable intelligence* 🚀
