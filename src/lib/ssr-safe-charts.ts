/**
 * SSR-Safe Recharts Wrapper
 * 
 * This file provides a safer way to import recharts components
 * that prevents SSR errors when rendering charts server-side.
 */

// Define empty component placeholders for SSR
const EmptyComponent = (props: any) => null;

// Create empty stub objects for SSR
const SSRSafeStub = {
  ResponsiveContainer: EmptyComponent,
  LineChart: EmptyComponent,
  BarChart: EmptyComponent,
  PieChart: EmptyComponent,
  RadarChart: EmptyComponent,
  AreaChart: EmptyComponent,
  ScatterChart: EmptyComponent,
  Line: EmptyComponent,
  Bar: EmptyComponent,
  Pie: EmptyComponent,
  XAxis: EmptyComponent,
  YAxis: EmptyComponent,
  CartesianGrid: EmptyComponent,
  Tooltip: EmptyComponent,
  Legend: EmptyComponent,
  Cell: EmptyComponent,
  Area: EmptyComponent,
  LabelList: EmptyComponent,
  Label: EmptyComponent
};

// Use conditional imports to only load recharts on client-side
// This helps avoid SSR issues with recharts trying to access window/document
let Charts: typeof SSRSafeStub;

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  // We're in the browser, so it's safe to use recharts
  try {
    // Dynamic import doesn't work with ESM in many environments
    // so we're using a workaround to conditionally import
    Charts = require('recharts');
  } catch (e) {
    console.error('Failed to load Recharts:', e);
    Charts = SSRSafeStub;
  }
} else {
  // We're in an SSR environment, use the stub
  Charts = SSRSafeStub;
}

export default Charts;