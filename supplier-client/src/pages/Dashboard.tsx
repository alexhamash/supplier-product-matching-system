import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  Building2,
  Sparkles,
  RefreshCw,
  Activity,
  Clock,
  Database,
  GitMerge,
  Users,
  ArrowRight,
  AlertTriangle,
  ServerCog,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProducts } from "../context/ProductContext";
import { getAllSupplierProducts } from "../services/supplierService";
import { getProductMatches, runMatching } from "../services/matchingService";
import { apiClient } from "../services/api";
import type { SupplierProduct } from "../types";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default automated sync cadence configured on the backend cron service. */
const DEFAULT_SYNC_SCHEDULE_LABEL = "Every 6 hours";

/** Shape returned by GET /api/health. */
interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

/** A single KPI card definition. */
interface KpiCard {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon chip background / foreground. */
  iconClass: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format an ISO timestamp as a human-friendly relative time (e.g. "3h ago").
 * Falls back to a locale string for anything older than a week, and to
 * "Never" when no timestamp is available.
 */
const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";

  const diffMs = Date.now() - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(iso).toLocaleDateString();
};

/** Format an absolute timestamp for tooltips / secondary text. */
const formatAbsoluteTime = (iso: string | null | undefined): string => {
  if (!iso) return "Never synced";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return date.toLocaleString();
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** A single KPI stat card. */
const KpiCardView: React.FC<{ card: KpiCard }> = ({ card }) => {
  const Icon = card.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {card.label}
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
            {card.value}
          </p>
          <p className="text-xs text-slate-400 mt-1 truncate">{card.hint}</p>
        </div>
        <div
          className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${card.iconClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

/** Skeleton placeholder shown while the dashboard data is loading. */
const KpiSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 animate-pulse">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-3">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-8 w-16 bg-slate-200 rounded" />
        <div className="h-3 w-28 bg-slate-100 rounded" />
      </div>
      <div className="w-11 h-11 rounded-lg bg-slate-100" />
    </div>
  </div>
);

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { products, supplier, loading, refresh } = useProducts();

  // Aggregated supplier products across all suppliers (loaded on mount).
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [supplierProductsLoading, setSupplierProductsLoading] =
    useState<boolean>(false);

  // Number of supplier products linked to a main product (APPROVED matches).
  const [matchedCount, setMatchedCount] = useState<number>(0);

  // Backend health status.
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<boolean>(false);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Whether the auto-match quick action is currently running.
  const [runningMatching, setRunningMatching] = useState<boolean>(false);

  /**
   * Load the aggregated supplier products for every configured supplier.
   * Failures are logged but never block the rest of the dashboard.
   */
  const loadSupplierProducts = useCallback(async (): Promise<void> => {
    if (supplier.length === 0) {
      setSupplierProducts([]);
      return;
    }
    setSupplierProductsLoading(true);
    try {
      const all = await getAllSupplierProducts(supplier);
      // Deduplicate by unique id so aggregate counts stay accurate.
      const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());
      setSupplierProducts(unique);
    } catch (err) {
      console.error("Failed to load supplier products for dashboard:", err);
    } finally {
      setSupplierProductsLoading(false);
    }
  }, [supplier]);

  /**
   * Load the count of APPROVED matches (supplier products linked to a main
   * product). This is the authoritative source for the matching rate.
   */
  const loadMatchedCount = useCallback(async (): Promise<void> => {
    try {
      const matches = await getProductMatches({ status: "APPROVED" });
      setMatchedCount(matches.length);
    } catch (err) {
      console.error("Failed to load approved matches for dashboard:", err);
    }
  }, []);

  /** Poll the backend health endpoint. */
  const loadHealth = useCallback(async (): Promise<void> => {
    setHealthLoading(true);
    try {
      const data = await apiClient.get<HealthResponse>("health");
      setHealth(data);
      setHealthError(false);
    } catch (err) {
      console.error("Failed to reach backend health endpoint:", err);
      setHealth(null);
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Initial load: supplier products + approved matches + health.
  useEffect(() => {
    void loadSupplierProducts();
    void loadMatchedCount();
    void loadHealth();
  }, [loadSupplierProducts, loadMatchedCount, loadHealth]);

  // ─── Derived metrics ───────────────────────────────────────────────────────

  const totalMainProducts = products.length;
  const totalSupplierProducts = supplierProducts.length;
  const activeSuppliersCount = supplier.length;

  /**
   * Matching rate: percentage of supplier products that are linked to a main
   * product. Prefers the authoritative APPROVED-match count, falling back to
   * the `isMatched` / `matchedMainProductId` flags on the supplier products.
   */
  const matchedSupplierProducts = useMemo(() => {
    if (matchedCount > 0) return matchedCount;
    return supplierProducts.filter(
      (p) => p.isMatched || Boolean(p.matchedMainProductId),
    ).length;
  }, [matchedCount, supplierProducts]);

  const matchingRate =
    totalSupplierProducts > 0
      ? Math.round((matchedSupplierProducts / totalSupplierProducts) * 100)
      : 0;

  /** The most recent successful sync timestamp across all suppliers. */
  const lastSyncTimestamp = useMemo(() => {
    const timestamps = supplier
      .map((s) => s.lastSyncedAt ?? s.lastSync)
      .filter((t): t is string => Boolean(t))
      .map((t) => new Date(t).getTime())
      .filter((t) => !Number.isNaN(t));
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps)).toISOString();
  }, [supplier]);

  const kpiCards: KpiCard[] = [
    {
      label: "Main Products",
      value: totalMainProducts.toLocaleString(),
      hint: "Canonical store catalog",
      icon: Package,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Supplier Products",
      value: totalSupplierProducts.toLocaleString(),
      hint: `Across ${activeSuppliersCount} supplier${activeSuppliersCount === 1 ? "" : "s"}`,
      icon: Truck,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Matching Rate",
      value: `${matchingRate}%`,
      hint: `${matchedSupplierProducts.toLocaleString()} matched`,
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Active Suppliers",
      value: activeSuppliersCount.toLocaleString(),
      hint: "Configured feeds",
      icon: Building2,
      iconClass: "bg-amber-50 text-amber-600",
    },
  ];

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Trigger the auto-matching engine across all suppliers, then refresh the
   * dashboard metrics so the matching rate reflects the new state.
   */
  const handleRunAutoMatch = async (): Promise<void> => {
    setRunningMatching(true);
    const toastId = toast.loading("Running auto-match across all suppliers...");
    try {
      const result = await runMatching({});
      const created =
        "totals" in result
          ? result.totals.matchesCreated
          : result.matchesCreated;

      toast.success(
        `Auto-match complete — ${created} new match${created === 1 ? "" : "es"} created`,
        { id: toastId, duration: 4000 },
      );

      // Re-sync all dashboard metrics from the backend.
      await Promise.all([
        refresh(),
        loadSupplierProducts(),
        loadMatchedCount(),
      ]);
    } catch (err) {
      console.error("Failed to run auto-matching:", err);
      toast.error("Failed to run auto-match. Please try again.", { id: toastId });
    } finally {
      setRunningMatching(false);
    }
  };

  /** Refresh every data source powering the dashboard. */
  const handleRefreshAll = async (): Promise<void> => {
    await Promise.all([
      refresh(),
      loadSupplierProducts(),
      loadMatchedCount(),
      loadHealth(),
    ]);
  };

  const isLoading = loading || supplierProductsLoading;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            High-level overview of your catalog, suppliers and matching health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleRefreshAll()}
            disabled={isLoading}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => void handleRunAutoMatch()}
            disabled={runningMatching}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Sparkles
              className={`w-4 h-4 ${runningMatching ? "animate-pulse" : ""}`}
            />
            {runningMatching ? "Matching..." : "Run Auto-Match"}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpiCards.map((card) => <KpiCardView key={card.label} card={card} />)}
      </div>

      {/* System status + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System status */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ServerCog className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">
              System Status
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Backend health */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                Backend
              </div>
              <div className="mt-2">
                {healthLoading ? (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Checking...
                  </span>
                ) : healthError ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Unreachable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {health?.status?.toUpperCase() ?? "OK"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {health
                  ? `Uptime ${Math.floor(health.uptime / 60)}m`
                  : "GET /api/health"}
              </p>
            </div>

            {/* Last sync */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                Last Sync
              </div>
              <p
                className="mt-2 text-sm font-semibold text-slate-800"
                title={formatAbsoluteTime(lastSyncTimestamp)}
              >
                {formatRelativeTime(lastSyncTimestamp)}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                {formatAbsoluteTime(lastSyncTimestamp)}
              </p>
            </div>

            {/* Cron schedule */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <RefreshCw className="w-3.5 h-3.5" />
                Auto Sync
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {DEFAULT_SYNC_SCHEDULE_LABEL}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Cron: 0 */6 * * *
              </p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Quick Links</h2>
          </div>
          <div className="space-y-2">
            <Link
              to="/product-matching"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GitMerge className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                Product Matching
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-indigo-500" />
            </Link>
            <Link
              to="/main-products"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
                Main Products
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-blue-500" />
            </Link>
            <Link
              to="/suppliers"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors group"
            >
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-amber-700">
                Suppliers
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-amber-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Supplier summary */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">
              Supplier Overview
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {activeSuppliersCount} supplier
            {activeSuppliersCount === 1 ? "" : "s"}
          </span>
        </div>

        {supplier.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic text-sm">
            No suppliers configured yet.{" "}
            <Link to="/suppliers" className="text-blue-600 not-italic font-medium">
              Add your first supplier
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {supplier.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100 shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {s.feedType === "GOOGLE_SHEETS"
                        ? "Google Sheets"
                        : "CSV Feed"}
                      {s.autoSync ? " · Auto Sync" : " · Manual"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {(s.productsCount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Products
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p
                      className="text-sm font-medium text-slate-700"
                      title={formatAbsoluteTime(s.lastSyncedAt ?? s.lastSync)}
                    >
                      {formatRelativeTime(s.lastSyncedAt ?? s.lastSync)}
                    </p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                      Last Sync
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
