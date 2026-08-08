// ============================================================================
// Domain Models (Frontend-facing)
// ============================================================================

export interface MainProduct {
  id: string;
  name: string;
  SKU: string;
  brand: string;
  linkedCount: number;
  category?: string;
}

export interface SupplierProduct {
  id: number | string;
  name: string;
  price: number;
  status: 'matched' | 'unmatched';
  confidence?: number;
  mainProductId?: string | null;
  supplierId?: number;
  supplierSku?: string;
}

export interface Supplier {
  id: string;
  name: string;
  sheetUrl: string;
  productsCount: number;
  status: string;
  lastSync: string | null;
  /** Feed type: 'CSV' | 'GOOGLE_SHEETS'. */
  feedType?: 'CSV' | 'GOOGLE_SHEETS';
  /** Whether automated (cron) ingestion is enabled for this supplier. */
  autoSync?: boolean;
  /** Timestamp of the last successful feed import. */
  lastSyncedAt?: string | null;
}

export interface MatchResult {
  mainProductId: number;
  supplierProductId: number | string;
  supplierId: number;
  confidence: number;
  matchedAt: string;
}

export interface SupplierImportPayload {
  supplierId: number;
  products: Omit<SupplierProduct, 'status' | 'mainProductId'>[];
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ImportResponse {
  count: number;
  products: SupplierProduct[];
}

// ============================================================================
// Backend API DTOs (mirrors Prisma schema)
// ============================================================================

/** Main product as returned by the backend REST API. */
export interface ApiMainProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
  updatedAt: string;
}

/** Supplier as returned by the backend REST API. */
export interface ApiSupplier {
  id: string;
  name: string;
  contactInfo: string | null;
  productsCount: number;
  createdAt: string;
  updatedAt: string;
  feedUrl?: string | null;
  feedType?: 'CSV' | 'GOOGLE_SHEETS';
  autoSync?: boolean;
  lastSyncedAt?: string | null;
}

/** Supplier product as returned by the backend REST API. */
export interface ApiSupplierProduct {
  id: string;
  supplierId: string;
  rawSku: string;
  rawName: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

/** Match status enum values used by the backend. */
export type ApiMatchStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Product match as returned by the backend REST API. */
export interface ApiProductMatch {
  id: string;
  mainProductId: string;
  supplierProductId: string;
  status: ApiMatchStatus;
  confidenceScore: number | null;
  createdAt: string;
  updatedAt: string;
  mainProduct?: Pick<ApiMainProduct, 'id' | 'sku' | 'name' | 'price'>;
  supplierProduct?: Pick<
    ApiSupplierProduct,
    'id' | 'rawSku' | 'rawName' | 'price' | 'supplierId'
  > & {
    supplier?: Pick<ApiSupplier, 'id' | 'name'>;
  };
}

/** Payload for creating a main product via the API. */
export interface CreateMainProductPayload {
  sku: string;
  name: string;
  description?: string;
  price: number;
}

/** Payload for updating a main product via the API. */
export interface UpdateMainProductPayload {
  sku?: string;
  name?: string;
  description?: string | null;
  price?: number;
}

/** Payload for creating a supplier via the API. */
export interface CreateSupplierPayload {
  name: string;
  contactInfo?: string;
  feedUrl?: string;
  feedType?: 'CSV' | 'GOOGLE_SHEETS';
  autoSync?: boolean;
}

/** Payload for updating a supplier's feed configuration via the API. */
export interface UpdateFeedConfigPayload {
  feedUrl?: string;
  feedType?: 'CSV' | 'GOOGLE_SHEETS';
  autoSync?: boolean;
}

/** Response from the supplier feed sync endpoint. */
export interface SyncSupplierResponse {
  supplierId: string;
  supplierName: string;
  feedUrl: string;
  feedType: string;
  totalRows: number;
  skippedRows: number;
  created: number;
  updated: number;
  markedOutOfStock: number;
  unchanged: number;
  syncedAt: string;
}

/** Payload for importing supplier products via the API. */
export interface ImportSupplierProductsPayload {
  products: {
    rawSku: string;
    rawName: string;
    price: number;
  }[];
}

/** Response from the supplier products import endpoint. */
export interface ImportSupplierProductsResponse {
  supplierId: string;
  requestedCount: number;
  importedCount: number;
  skippedCount: number;
}

/** Payload for running the matching engine. */
export interface RunMatchingPayload {
  /** Optional supplier UUID. When omitted, matching runs for ALL suppliers. */
  supplierId?: string;
  confidenceThreshold?: number;
}

/** Payload for updating a match status. */
export interface UpdateMatchStatusPayload {
  status: 'APPROVED' | 'REJECTED';
}

/** Payload for directly linking a supplier product to a main product. */
export interface LinkMatchPayload {
  supplierProductId: string;
  mainProductId: string;
}

/**
 * A product match suggestion enriched with the supplier and main product
 * details needed to render the matching table (names, SKUs, prices).
 */
export interface ProductMatch {
  id: string;
  status: ApiMatchStatus;
  confidenceScore: number | null;
  createdAt: string;
  updatedAt: string;
  /** The main (catalog) product side of the match. */
  mainProduct: {
    id: string;
    sku: string;
    name: string;
    price: number;
  };
  /** The supplier product side of the match. */
  supplierProduct: {
    id: string;
    rawSku: string;
    rawName: string;
    price: number;
    supplierId: string;
    supplier?: {
      id: string;
      name: string;
    };
  };
}

/** Response from running the matching engine for a single supplier. */
export interface RunMatchingResult {
  supplierId: string;
  totalSupplierProducts: number;
  matchesCreated: number;
  matchesSkipped: number;
}

/** Response from running the matching engine across all suppliers. */
export interface RunMatchingAllResult {
  suppliersProcessed: number;
  results: RunMatchingResult[];
  totals: {
    totalSupplierProducts: number;
    matchesCreated: number;
    matchesSkipped: number;
  };
}

// ============================================================================
// Context State Structures
// ============================================================================

export interface ProductContextState {
  products: MainProduct[];
  supplier: Supplier[];
  activeSupplier: Supplier | null;
  supplierProducts: SupplierProduct[];

  setProducts: React.Dispatch<React.SetStateAction<MainProduct[]>>;
  setSupplier: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setActiveSupplier: React.Dispatch<React.SetStateAction<Supplier | null>>;
  setSupplierProducts: React.Dispatch<React.SetStateAction<SupplierProduct[]>>;

  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  refresh: () => Promise<void>;
  addProduct: (product: MainProduct) => Promise<void>;
  updateProduct: (product: MainProduct) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
}

// ============================================================================
// Utility / Helper Types
// ============================================================================

export type SupplierStatus = 'Active' | 'Pending' | 'Error';

export type ProductMatchStatus = 'matched' | 'unmatched';

// ============================================================================
// Supplier Matrix View (Product Intelligence Modal)
// ============================================================================

/** Match status values returned by the matrix endpoint. */
export type MatrixMatchStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Basic info about the main product shown in the matrix header. */
export interface MatrixMainProduct {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  /** The main product's base / target price. */
  basePrice: number;
  category: string | null;
}

/** A single matched supplier offer within the matrix. */
export interface MatrixOffer {
  matchId: string;
  status: MatrixMatchStatus;
  supplierId: string;
  supplierName: string;
  supplierSku: string;
  supplierTitle: string;
  /** Purchase cost from the supplier. */
  price: number;
  inStock: boolean;
  /** Similarity score (0.0 – 1.0, e.g. 0.95 = 95%). */
  matchScore: number;
  /** Difference between the supplier price and the main product base price. */
  priceDiff: number;
  updatedAt: string;
  lastSyncedAt: string | null;
}

/** Aggregated summary statistics for the matrix header cards. */
export interface MatrixSummary {
  /** Lowest available supplier price (null when there are no offers). */
  lowestPrice: number | null;
  /** Average supplier price (null when there are no offers). */
  averagePrice: number | null;
  /** Total number of matched supplier offers. */
  totalSuppliers: number;
  /** Number of offers currently in stock. */
  inStockCount: number;
}

/** Full payload returned by GET /api/main-products/:id/matrix. */
export interface SupplierMatrix {
  mainProduct: MatrixMainProduct;
  summary: MatrixSummary;
  offers: MatrixOffer[];
}

/** Sort options for the matrix comparison table. */
export type MatrixSortKey = 'lowestPrice' | 'matchScore' | 'inStock';
