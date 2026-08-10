import React, { useState, useEffect, useCallback, type ChangeEvent } from "react";
import {
  Search,
  Plus,
  Sparkles,
  Database,
  CheckCircle2,
  Layers,
  XCircle,
  SearchCode,
  RefreshCw,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  runMatching,
  linkMatch,
  unlinkMatch,
  getProductMatches,
  getSupplierSuggestions,
} from "../services/matchingService";
import { getAllSupplierProducts } from "../services/supplierService";
import { useProducts } from "../context/ProductContext";
import type { MainProduct, SupplierProduct } from "../types";

const ProductMatching: React.FC = () => {
  const {
    products,
    supplier,
    setProducts,
    refresh,
    loading,
  } = useProducts();

  const [activeItem, setActiveItem] = useState<number>(0);
  const [showLinked, setShowLinked] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [runningAuto, setRunningAuto] = useState<boolean>(false);
  // Index of the currently focused suggestion row for keyboard navigation.
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  // Id of the supplier product currently playing the "matched" slide-out animation.
  const [justMatchedId, setJustMatchedId] = useState<string | null>(null);
  // Whether the bulk "Match All High Confidence" action is currently running.
  const [bulkMatching, setBulkMatching] = useState<boolean>(false);

  // Map of supplierProductId -> mainProductId representing confirmed links,
  // derived from APPROVED ProductMatch records returned by the backend. This
  // complements `matchedMainProductId` on the supplier product so that legacy
  // APPROVED matches (created before the field existed) are still recognised.
  const [approvedMatches, setApprovedMatches] = useState<Record<string, string>>({});

  // Load supplier products from the backend for all suppliers.
  const loadSupplierProducts = useCallback(async (): Promise<void> => {
    setProductsLoading(true);
    try {
      const all = await getAllSupplierProducts(supplier);
      // Deduplicate supplier products by unique ID before setting state.
      const uniqueAll = Array.from(
        new Map(all.map((p) => [p.id, p])).values(),
      );
      setSupplierProducts(uniqueAll);
    } catch (err) {
      console.error("Failed to load supplier products:", err);
      toast.error("Не вдалося завантажити товари постачальників");
    } finally {
      setProductsLoading(false);
    }
  }, [supplier]);

  // Load APPROVED matches from the backend so the linked state is restored
  // after a page reload / query refetch, even for legacy matches that do not
  // carry `matchedMainProductId` on the supplier product.
  const loadApprovedMatches = useCallback(async (): Promise<void> => {
    try {
      const matches = await getProductMatches({ status: "APPROVED" });
      const map: Record<string, string> = {};
      for (const m of matches) {
        map[m.supplierProduct.id] = m.mainProduct.id;
      }
      setApprovedMatches(map);
    } catch (err) {
      console.error("Failed to load approved matches:", err);
    }
  }, []);

  useEffect(() => {
    if (supplier.length > 0) {
      void loadSupplierProducts();
      void loadApprovedMatches();
    }
  }, [supplier, loadSupplierProducts, loadApprovedMatches]);

  useEffect(() => {
    if (supplier.length > 0) {
      void loadSupplierProducts();
    }
  }, [supplier, loadSupplierProducts]);

  const selectedProduct = products[activeItem] || null;

  // A supplier product is "matched" if it has a confirmed link persisted on the
  // backend. This is derived from BOTH the `matchedMainProductId` field on the
  // supplier product AND the APPROVED ProductMatch records, so the linked state
  // survives page reloads / query refetches (including legacy matches).
  const linkedMainProductId = (p: SupplierProduct): string | undefined =>
    p.matchedMainProductId ?? approvedMatches[String(p.id)] ?? undefined;

  const isMatched = (p: SupplierProduct): boolean =>
    Boolean(linkedMainProductId(p));

  const unmatchedProducts = supplierProducts.filter((p) => !isMatched(p));

  // AI suggestions are filtered to a minimum 50% confidence threshold so that
  // low-confidence noise is not shown to the user.
  const finalItems = !showLinked
    ? selectedProduct
      ? getSupplierSuggestions(selectedProduct, unmatchedProducts).filter(
          (s) => s.confidence >= 50,
        )
      : []
    : supplierProducts.filter(
        (p) =>
          isMatched(p) && linkedMainProductId(p) === selectedProduct?.id,
      );

  const uniqueSuppliersCount = new Set(
    supplierProducts
      .filter(
        (p) =>
          isMatched(p) && linkedMainProductId(p) === selectedProduct?.id,
      )
      .map((p) => p.supplierId),
  ).size;

  // Resolve a supplier product's owning supplier name from the supplier list.
  const supplierName = (p: SupplierProduct): string => {
    const found = supplier.find((s) => String(s.id) === String(p.supplierId));
    return found?.name || "—";
  };

  /**
   * Verify that a main product has a real, non-empty database ID before it is
   * sent to the backend. A client-generated timestamp or empty string would not
   * correspond to a real `MainProduct` row and would cause a 404 on linking.
   */
  const hasValidMainProductId = (product: MainProduct | null): boolean =>
    Boolean(product && product.id && product.id.trim() !== "");

  /**
   * Link a specific supplier product to a main product via the backend
   * `POST /api/matching/link` endpoint. Defaults to the currently selected main
   * product, but can be overridden (e.g. by the Quick Match button on a main
   * product card).
   */
  const handleLink = async (
    supplierProduct: SupplierProduct,
    targetProduct: MainProduct | null = selectedProduct,
  ): Promise<void> => {
    if (!targetProduct) {
      toast.error("Оберіть основний товар для зв'язування");
      return;
    }

    if (!hasValidMainProductId(targetProduct)) {
      console.error(
        "Cannot link: selected main product has no valid database ID.",
        targetProduct,
      );
      toast.error("Основний товар не має дійсного ID у базі даних");
      return;
    }

    setLinkingId(String(supplierProduct.id));
    try {
      await linkMatch({
        supplierProductId: String(supplierProduct.id),
        mainProductId: String(targetProduct.id),
      });

      // Trigger the slide-out animation on the matched row so the user sees
      // smooth feedback before the item is removed from the suggestions list.
      setJustMatchedId(String(supplierProduct.id));
      await new Promise((resolve) => setTimeout(resolve, 450));

      // Optimistically reflect the link in the local list so the UI updates
      // immediately, then refetch from the backend to keep state in sync.
      setSupplierProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(supplierProduct.id)
            ? { ...p, matchedMainProductId: String(targetProduct.id) }
            : p,
        ),
      );
      setApprovedMatches((prev) => ({
        ...prev,
        [String(supplierProduct.id)]: String(targetProduct.id),
      }));

      setProducts(
        products.map((p) =>
          p.id === targetProduct.id
            ? { ...p, linkedCount: (p.linkedCount || 0) + 1 }
            : p,
        ),
      );

      // Invalidate / refetch the supplier products list so the linked state is
      // re-synced from the backend (survives reloads).
      await loadSupplierProducts();
      await loadApprovedMatches();

      // Refetch the main products so the authoritative `linkedCount` (computed
      // by the backend from APPROVED matches) is reflected in the Main Products
      // table badge in real-time, without a manual page refresh.
      await refresh();

      toast.success(`Зв'язано: ${supplierProduct.name}`, {
        duration: 4000,
        className: "match-toast",
        style: {
          border: "1px solid #10B981",
          padding: "16px",
          color: "#064E3B",
          background: "#ECFDF5",
          fontWeight: "600",
          borderRadius: "12px",
        },
        iconTheme: {
          primary: "#10B981",
          secondary: "#FFFAEE",
        },
      });
    } catch (err) {
      console.error("Failed to link supplier product:", err);
      toast.error("Не вдалося зв'язати товар");
    } finally {
      setLinkingId(null);
      setJustMatchedId(null);
    }
  };

  // Reset keyboard focus to the top suggestion whenever the selected main
  // product changes or the suggestions list is refreshed.
  useEffect(() => {
    setFocusedIndex(0);
  }, [activeItem, finalItems.length]);

  // Global keyboard shortcuts for the matching workspace:
  //   ArrowDown / ArrowUp  -> navigate between unmatched suggestion rows
  //   Enter / Space        -> Quick Match the currently focused suggestion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      // Keyboard shortcuts only apply to the AI suggestions view.
      if (showLinked || finalItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, finalItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const item = finalItems[focusedIndex] ?? finalItems[0];
        if (item && !linkingId) {
          void handleLink(item);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finalItems, focusedIndex, showLinked, linkingId, handleLink]);

  /**
   * Unlink a supplier product from the selected main product.
   */
  const handleUnlink = async (supplierProduct: SupplierProduct): Promise<void> => {
    if (!selectedProduct) {
      toast.error("Оберіть основний товар для розірвання зв'язку");
      return;
    }

    setLinkingId(String(supplierProduct.id));
    try {
      await unlinkMatch({
        supplierProductId: String(supplierProduct.id),
        mainProductId: String(selectedProduct.id),
      });

      // Optimistically clear the link locally, then refetch from the backend.
      setSupplierProducts((prev) =>
        prev.map((p) =>
          String(p.id) === String(supplierProduct.id)
            ? { ...p, matchedMainProductId: null }
            : p,
        ),
      );
      setApprovedMatches((prev) => {
        const next = { ...prev };
        delete next[String(supplierProduct.id)];
        return next;
      });

      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, linkedCount: Math.max(0, (p.linkedCount || 0) - 1) }
            : p,
        ),
      );

      // Invalidate / refetch so the unlinked state is re-synced from the backend.
      await loadSupplierProducts();
      await loadApprovedMatches();

      // Refetch the main products so the authoritative `linkedCount` is updated
      // in the Main Products table badge in real-time.
      await refresh();

      toast.success("Product unlinked successfully");
    } catch (err) {
      console.error("Failed to unlink supplier product:", err);
      toast.error("Не вдалося розірвати зв'язок");
    } finally {
      setLinkingId(null);
    }
  };

  /**
   * Run the auto-matching engine for all suppliers, then reload the list.
   */
  const handleAutoLinkAll = async (): Promise<void> => {
    setRunningAuto(true);
    try {
      const result = await runMatching({});
      const created =
        "totals" in result ? result.totals.matchesCreated : result.matchesCreated;
      toast.success(`Авто-співставлення завершено: створено ${created} збігів`, {
        duration: 4000,
      });
      await loadSupplierProducts();
    } catch (err) {
      console.error("Failed to run auto-matching:", err);
      toast.error("Не вдалося запустити авто-співставлення");
    } finally {
      setRunningAuto(false);
    }
  };

  /**
   * Bulk-link the top AI suggestion for every main product whose best match
   * confidence is >= 90%. Each supplier product is linked at most once, and a
   * summary toast reports how many items were linked.
   */
  const handleBulkMatchAll = async (): Promise<void> => {
    setBulkMatching(true);
    let linkedCount = 0;
    const linkedSupplierIds = new Set<string>();
    try {
      for (const mainProduct of products) {
        const suggestions = getSupplierSuggestions(mainProduct, unmatchedProducts);
        const top = suggestions[0];
        if (!top || top.confidence < 90) continue;
        if (linkedSupplierIds.has(String(top.id))) continue;
        linkedSupplierIds.add(String(top.id));
        try {
          await linkMatch({
            supplierProductId: String(top.id),
            mainProductId: String(mainProduct.id),
          });
          linkedCount += 1;
        } catch (err) {
          console.error("Bulk match failed for supplier product:", top.id, err);
        }
      }

      // Re-sync the linked state from the backend after bulk linking.
      await loadSupplierProducts();
      await loadApprovedMatches();
      await refresh();

      toast.success(
        `Зв'язано ${linkedCount} товарів з високою впевненістю (90%+)`,
        {
          duration: 4000,
          className: "match-toast",
          style: {
            border: "1px solid #10B981",
            padding: "16px",
            color: "#064E3B",
            background: "#ECFDF5",
            fontWeight: "600",
            borderRadius: "12px",
          },
          iconTheme: {
            primary: "#10B981",
            secondary: "#FFFAEE",
          },
        },
      );
    } catch (err) {
      console.error("Failed to run bulk matching:", err);
      toast.error("Не вдалося виконати масове співставлення");
    } finally {
      setBulkMatching(false);
    }
  };

  const filteredMainProducts = products.filter((product): boolean => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.SKU.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "linked"
          ? product.linkedCount > 0
          : (product.linkedCount || 0) === 0;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div>Завантаження...</div>;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header section */}
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div>
          <h1 className="text-[20px] font-bold text-[#0F172A] tracking-tight">
            Product Linking
          </h1>
          <p className="text-[#64748B] text-[13px]">
            Select a main catalog item to review and link incoming supplier
            products to it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadSupplierProducts()}
            disabled={productsLoading}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${productsLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            New Main Product
          </button>
          <button
            onClick={() => void handleAutoLinkAll()}
            disabled={runningAuto}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className={`w-3.5 h-3.5 ${runningAuto ? "animate-pulse" : ""}`} />
            {runningAuto ? "Running..." : "Auto-Link All (AI)"}
          </button>
          <button
            onClick={() => void handleBulkMatchAll()}
            disabled={bulkMatching}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${bulkMatching ? "animate-pulse" : ""}`} />
            {bulkMatching
              ? "Matching..."
              : "⚡ Match All High Confidence (90%+)"}
          </button>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
        {/* Left Side: Main Products Catalog */}
        <div className="w-full lg:w-[35%] flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[calc(100vh-120px)]">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Main Catalog</h2>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-md">
              {products.length} Items
            </span>
          </div>

          <div className="p-2.5 border-b border-slate-100 shrink-0 bg-white space-y-2">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search main products..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(["all", "unlinked", "linked"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 text-[10px] uppercase tracking-wider font-bold py-1 rounded-md transition-all ${
                    filterStatus === status
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status === "unlinked"
                      ? "Unlinked"
                      : "Linked"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {filteredMainProducts.map((item, index) => (
                <div
                  key={item.id ? `${item.id}-${index}` : index}
                  onClick={() => setActiveItem(index)}
                  className={`cursor-pointer px-4 py-3 transition-colors ${
                    activeItem === index ? "bg-indigo-50/70" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-1 pr-1">
                      {item.name}
                    </p>
                    <span
                      className={`shrink-0 font-medium px-1.5 py-0.5 rounded-full text-[11px] ${
                        item.linkedCount > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {item.linkedCount || 0} Linked
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5">
                    <span className="truncate">{item.SKU}</span>
                    <span className="text-slate-600 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      {item.brand || "—"}
                    </span>
                  </div>
                </div>
              ))}
              {filteredMainProducts.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  No main products found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Linking Workspace */}
        <div className="w-full lg:w-[65%] flex flex-col h-[calc(100vh-120px)]">
          {/* Top Panel: Selected Main Product Details */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-2 shrink-0">
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">
                1
              </span>
              <h3 className="font-semibold text-slate-800 text-[13px]">
                Target Main Product
              </h3>
            </div>

            <div className="px-4 py-2.5 bg-white">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                  {selectedProduct?.name || "Оберіть товар"}
                </h2>
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {uniqueSuppliersCount} Suppliers
                </span>
              </div>

              {/* Compact horizontal summary bar */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-slate-50 rounded-md px-2 py-1 border border-slate-100 text-[11px]">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">SKU</span>
                  <span className="font-mono font-medium text-slate-800">{selectedProduct?.SKU}</span>
                </span>
                {selectedProduct?.brand && selectedProduct.brand.trim() !== "" && selectedProduct.brand !== "—" && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 rounded-md px-2 py-1 border border-slate-100 text-[11px]">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider">Brand</span>
                    <span className="font-medium text-slate-800">{selectedProduct.brand}</span>
                  </span>
                )}
                {selectedProduct?.category && selectedProduct.category.trim() !== "" && selectedProduct.category !== "—" && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 rounded-md px-2 py-1 border border-slate-100 text-[11px]">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider">Category</span>
                    <span className="font-medium text-slate-800">{selectedProduct.category}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Panel: Find Supplier Products to Link */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold">
                  2
                </span>
                <h3 className="font-semibold text-slate-800 text-[13px]">
                  Find Supplier Products to Link
                </h3>
              </div>

              <button
                onClick={() => setShowLinked(!showLinked)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  showLinked
                    ? "bg-amber-100 text-amber-800 border-amber-300 shadow-inner"
                    : "bg-white text-indigo-600 border-slate-200 hover:bg-slate-50 hover:border-indigo-300 shadow-sm"
                }`}
              >
                <Layers
                  className={`w-3.5 h-3.5 ${showLinked ? "text-amber-500" : "text-indigo-500"}`}
                />
                {showLinked ? "View Suggestions" : "View Currently Linked"}
              </button>
            </div>

            {/* Manual Search Bar */}
            <div className="p-2.5 border-b border-slate-100 bg-white shrink-0">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchCode className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Manually search unmatched supplier products by SKU or Name..."
                  className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                />
              </div>
            </div>

            {/* AI Suggestions List */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-2.5">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {showLinked ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Currently Linked Supplier Products
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI Suggested Supplier Products
                  </>
                )}
              </h4>

              {productsLoading ? (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  Loading supplier products...
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                  {finalItems.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {finalItems.map((item, index) => {
                        const confidence = (item as { confidence?: number }).confidence ?? 0;
                        const isLinking = linkingId === String(item.id);
                        const isFocused = focusedIndex === index;
                        const isMatched = justMatchedId === String(item.id);
                        return (
                          <div
                            key={item.id ? `${item.id}-${index}` : index}
                            className={`px-4 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                              isFocused
                                ? "bg-indigo-50/70 ring-1 ring-inset ring-indigo-200"
                                : "hover:bg-slate-50/70"
                            } ${isMatched ? "matched-slide-out" : ""}`}
                          >
                            {/* Left: title + supplier name badge */}
                            <div className="flex-1 min-w-0 flex items-center">
                              <h5 className="text-sm font-semibold text-slate-800 truncate">
                                {item.name}
                              </h5>
                              {supplierName(item) !== "—" ? (
                                <span className="bg-slate-100/90 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-slate-200/80 inline-flex items-center ml-2 shrink-0">
                                  {supplierName(item)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 ml-2 shrink-0">—</span>
                              )}
                            </div>

                            {/* Right: match badge, price, action button */}
                            <div className="shrink-0 flex items-center gap-3">
                              {!showLinked && (
                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                  {confidence}% Match
                                </span>
                              )}
                              <span className="text-sm font-bold text-slate-900">
                                ${item.price}
                              </span>
                              {showLinked ? (
                                <button
                                  onClick={() => handleUnlink(item)}
                                  disabled={isLinking}
                                  className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-medium text-xs px-3 py-1.5 rounded-lg border border-rose-100 transition-all shadow-sm disabled:opacity-60"
                                >
                                  {isLinking ? "..." : "Unlink"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleLink(item)}
                                  disabled={isLinking}
                                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-medium text-xs px-3 py-1.5 rounded-lg border border-indigo-100 transition-all shadow-sm disabled:opacity-60"
                                >
                                  {isLinking ? "Linking..." : "Link"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic text-sm">
                      {!showLinked
                        ? "No high-confidence AI matches found"
                        : "No products linked to this item yet"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles for match feedback */}
      <style>{`
        @keyframes matchSlideOut {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(48px); }
        }
        .matched-slide-out {
          animation: matchSlideOut 0.45s ease-in forwards;
        }
        @keyframes toastSlideIn {
          0% { opacity: 0; transform: translateY(-12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .match-toast {
          animation: toastSlideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProductMatching;
