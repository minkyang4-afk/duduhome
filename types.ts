
export interface ProductData {
  id: string;
  productName: string;
  price: string;
  salesVolume: string;
  revenue: number; // Estimated revenue if possible, or just a placeholder
  productLink: string | null;
  shopName: string;
  shopLink: string | null;
  rawContent: string;
  timestamp: string;
  category?: string; // Added optional category
}

export interface ProcessingStats {
  totalProcessed: number;
  totalSales: string;
  avgPrice: string;
  processingTime: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface FilterConfig {
  category: string;
  minPrice: string;
  maxPrice: string;
  minSales: string;
}

export type ViewMode = 'dashboard' | 'extraction' | 'products' | 'settings';
