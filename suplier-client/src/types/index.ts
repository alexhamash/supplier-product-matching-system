export interface MainProduct {
  id: number;
  name: string;
  SKU: string;
  brand: string;
  linkedCount: number;
  category?: string;
}

export interface SupplierProduct {
  id: number;
  name: string;
  price: number;
  status: 'matched' | 'unmatched';
  confidence?: number;
  mainProductId?: number | null;
  supplierId?: number;
}

export interface MainProduct {

}