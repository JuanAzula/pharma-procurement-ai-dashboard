# Quick Start Guide

Get the TED API Dashboard running in 3 simple steps!

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Your Browser
Navigate to the URL shown in your terminal (typically `http://localhost:5173`)

That's it! The dashboard is now running and fetching real data from the TED API.

## 📱 What You'll See

When the dashboard loads, you'll immediately see:

1. **Filter Panel** (left sidebar)
   - Pre-configured with sensible defaults
   - 2-year date range
   - All 4 target countries selected
   - Pharmaceutical CPV codes ready to filter

2. **Key Metrics** (top cards)
   - Total number of contracts
   - Total contract value
   - Average contract value
   - Active countries

3. **Visualizations** (middle section)
   - Three interactive charts in tabs
   - Timeline showing procurement trends
   - Country comparison analysis
   - Value distribution scatter plot

4. **Data Table** (bottom section)
   - List of all matching procurement notices
   - Click any row to see details
   - Pagination for large result sets

## 🎯 Try These Features

### 1. Filter by Country
- Click country buttons in the filter panel
- Dashboard updates automatically
- Charts reflect the filtered data

### 2. Adjust Date Range
- Use the date pickers to narrow your search
- Great for analyzing specific time periods

### 3. Search by Supplier
- Type a supplier name in the search box
- Find all contracts awarded to specific companies

### 4. View Notice Details
- Click any row in the table
- See complete information about the contract
- Link to view on TED website

### 5. Explore Visualizations
- Switch between the three chart tabs
- Hover over data points for details
- Watch how charts update as you filter

## 🛠️ Build for Production

When you're ready to deploy:

```bash
npm run build
```

The production files will be in the `dist/` directory.

## 💡 Tips

- **No API Key Needed**: The TED API is publicly accessible
- **Filters Persist**: Your filter selections affect all visualizations
- **Clear Filters**: Click "Clear All Filters" to reset
- **Loading States**: Skeleton screens show while data loads
- **Error Handling**: Friendly error messages if something goes wrong

## 📚 Need More Info?

Check out the full [README.md](./README.md) for:
- Detailed feature documentation
- Architecture overview
- Troubleshooting guide
- Future enhancement ideas

---

**Ready to explore European pharmaceutical procurement data? Start the server and dive in!** 🎉

