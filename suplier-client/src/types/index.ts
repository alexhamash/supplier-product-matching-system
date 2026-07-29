// ============================================================================
// Domain Models
// ============================================================================

export interface MainProduct {
  id: number;
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
  mainProductId?: number | null;
  supplierId?: number;
  supplierSku?: string;
}

export interface Supplier {
  id: number;
  name: string;
  sheetUrl: string;
  productsCount: number;
  status: string;
  lastSync: string | null;
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
// Context State Structures
// ============================================================================

export interface ProductContextState {
  products: MainProduct[];
  supplier: Supplier[];
  activeSupplier: Supplier | null;
  supplierProducts: SupplierProduct[];

  setProducts: React.Dispatch<React.SetStateAction<MainProduct[]>>;
  setSupplier: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setSupplierProducts: React.Dispatch<React.SetStateAction<SupplierProduct[]>>;

  loading: boolean;
  setLoading: (loading: boolean) => void;
  addProduct: (product: MainProduct) => void;
  updateProduct: (product: MainProduct) => void;
  updateSupplier: (supplier: Supplier) => void;
}

// ============================================================================
// Utility / Helper Types
// ============================================================================

export type SupplierStatus = 'Active' | 'Pending' | 'Error';

export type ProductMatchStatus = 'matched' | 'unmatched';
