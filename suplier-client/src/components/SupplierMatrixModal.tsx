import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  ExternalLink,
  Package,
  AlertTriangle,
} from "lucide-react";
import type { SupplierMatrix, MatrixOffer, MatrixSortKey } from "../types";
import { getMainProductMatrix } from "../services/mainProductService";

// ─── Props ───────────────────────────────────────────────────────────────────

interface SupplierMatrixModalProps {
  /** Backend UUID of the main product to inspect. */
  mainProductId: string;
  /** Display name of the main product (used while the payload loads). */
  mainProductName: string;
  /** Callback invoked when the user closes the modal. */
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a number as a currency string (2 decimals). */
const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/** Format a match score (0–1) as a percentage string, e.g. 0.95 → "95%". */
const formatScore = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};

/** Format an ISO timestamp into a short, human-readable date. */
const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** Derive a badge style class from a match score. */
const scoreBadgeClass = (score: number): string => {
  if (score >= 0.9) return "bg-green-50 text-green-700 border-green-200";
  if (score >= 0.7) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

// ─── Component ───────────────────────────────────────────────────────────────

const SupplierMatrixModal: React.FC<SupplierMatrixModalProps> = ({
  mainProductId,
  mainProductName,
  onClose,
}) => {
  const [matrix, setMatrix] = useState<SupplierMatrix | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Controls ──────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<MatrixSortKey>("lowestPrice");
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(false);

  // ─── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMainProductMatrix(mainProductId);
        if (!cancelled) setMatrix(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load supplier matrix.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [mainProductId]);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const offers = useMemo<MatrixOffer[]>(() => {
    if (!matrix) return [];

    let list = [...matrix.offers];

    // Optional filter: hide out-of-stock suppliers.
    if (hideOutOfStock) {
      list = list.filter((o) => o.inStock);
    }

    // Sort by the selected key.
    switch (sortKey) {
      case "lowestPrice":
        list.sort((a, b) => a.price - b.price);
        break;
      case "matchScore":
        list.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case "inStock":
        list.sort(
          (a, b) =>
            Number(b.inStock) - Number(a.inStock) || a.price - b.price,
        );
        break;
    }

    return list;
  }, [matrix, sortKey, hideOutOfStock]);

  // The lowest price across ALL offers (used to flag the "Best Price" badge).
  const lowestPrice = useMemo<number | null>(() => {
    if (!matrix || matrix.offers.length === 0) return null;
    return Math.min(...matrix.offers.map((o) => o.price));
  }, [matrix]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Supplier Matrix"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {matrix?.mainProduct.title ?? mainProductName}
              </h2>
              <p className="text-sm text-slate-500 font-mono mt-0.5">
                SKU: {matrix?.mainProduct.sku ?? "…"}
                {matrix?.mainProduct.category
                  ? ` · ${matrix.mainProduct.category}`
                  : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Loading supplier matrix…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="w-8 h-8 mb-3 text-red-500" />
              <p className="text-sm font-medium text-slate-800">
                Failed to load supplier matrix
              </p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reload
              </button>
            </div>
          )}

          {!loading && !error && matrix && (
            <>
              {/* ── Summary Cards ───────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Lowest Available Price (highlighted green) */}
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Lowest Available Price
                  </p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {formatPrice(matrix.summary.lowestPrice)}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Base price: {formatPrice(matrix.mainProduct.basePrice)}
                  </p>
                </div>

                {/* Average Supplier Price */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Average Supplier Price
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {formatPrice(matrix.summary.averagePrice)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Across {matrix.summary.totalSuppliers} offer(s)
                  </p>
                </div>

                {/* Total Matched Suppliers */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Total Matched Suppliers
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {matrix.summary.totalSuppliers}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {matrix.summary.inStockCount} in stock
                  </p>
                </div>
              </div>

              {/* ── Controls ────────────────────────────────────────────── */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Sort by:
                  </span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as MatrixSortKey)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="lowestPrice">Lowest Price</option>
                    <option value="matchScore">Highest Match Score</option>
                    <option value="inStock">In Stock Status</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hideOutOfStock}
                    onChange={(e) => setHideOutOfStock(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Hide out of stock
                </label>
              </div>

              {/* ── Matrix Table ────────────────────────────────────────── */}
              {offers.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">
                    {matrix.offers.length === 0
                      ? "No supplier offers matched for this product yet."
                      : "No offers match the current filter."}
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <div className="col-span-3">Supplier</div>
                    <div className="col-span-3">Supplier Title & SKU</div>
                    <div className="col-span-2">Match Score</div>
                    <div className="col-span-2">Purchase Price</div>
                    <div className="col-span-2">Stock</div>
                  </div>

                  {/* Table body */}
                  <div className="divide-y divide-slate-100">
                    {offers.map((offer) => {
                      const isBestPrice =
                        lowestPrice !== null && offer.price === lowestPrice;
                      const diff = offer.priceDiff;
                      const diffAbs = Math.abs(diff);
                      const diffPct =
                        matrix.mainProduct.basePrice > 0
                          ? (diff / matrix.mainProduct.basePrice) * 100
                          : 0;

                      return (
                        <div
                          key={offer.matchId}
                          className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50 transition-colors"
                        >
                          {/* Supplier name + link */}
                          <div className="col-span-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {offer.supplierName}
                            </p>
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                              title="Open supplier feed"
                            >
                              View feed
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* Supplier title & SKU */}
                          <div className="col-span-3">
                            <p className="text-sm text-slate-800 line-clamp-2">
                              {offer.supplierTitle}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {offer.supplierSku}
                            </p>
                          </div>

                          {/* Match score badge */}
                          <div className="col-span-2">
                            <span
                              className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${scoreBadgeClass(
                                offer.matchScore,
                              )}`}
                            >
                              {formatScore(offer.matchScore)}
                            </span>
                          </div>

                          {/* Purchase price */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900">
                                {formatPrice(offer.price)}
                              </span>
                              {isBestPrice && (
                                <span className="text-[10px] font-bold uppercase bg-green-600 text-white px-1.5 py-0.5 rounded">
                                  Best Price
                                </span>
                              )}
                            </div>
                            {/* Price trend / diff indicator */}
                            <div className="flex items-center gap-1 mt-0.5">
                              {diff < -0.005 ? (
                                <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
                                  <TrendingDown className="w-3 h-3" />
                                  {formatPrice(diffAbs)} below base
                                </span>
                              ) : diff > 0.005 ? (
                                <span className="inline-flex items-center gap-0.5 text-xs text-red-500">
                                  <TrendingUp className="w-3 h-3" />
                                  {formatPrice(diffAbs)} above base
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                                  <Minus className="w-3 h-3" />
                                  at base
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                ({diffPct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>

                          {/* Stock status */}
                          <div className="col-span-2">
                            {offer.inStock ? (
                              <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                In Stock
                              </span>
                            ) : (
                              <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                                Out of Stock
                              </span>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1">
                              Synced {formatDate(offer.lastSyncedAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierMatrixModal;
