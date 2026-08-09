import React, { useState, useEffect, type ChangeEvent } from "react";
import { Search,Plus,RefreshCw,FileSpreadsheet, CheckCircle2, Sparkles, Zap, Clock } from "lucide-react";

import { getSuppliers, createSupplier, importSupplierProducts, deleteSupplier, syncSupplier } from "../services/supplierService";
import { useProducts } from "../context/ProductContext";

const Suppliers: React.FC = () => {
  const { supplier, updateSupplier, refresh } = useProducts()
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [formData, setFormData] = useState<{
    name: string;
    sheetUrl: string;
    feedType: "CSV" | "GOOGLE_SHEETS";
    autoSync: boolean;
    sheetGid: string;
    startRow: string;
    useCustomMapping: boolean;
    skuCol: string;
    titleCol: string;
    priceCol: string;
    stopWords: string;
  }>({
    name: "",
    sheetUrl: "",
    feedType: "GOOGLE_SHEETS",
    autoSync: false,
    sheetGid: "",
    startRow: "1",
    useCustomMapping: false,
    skuCol: "A",
    titleCol: "B",
    priceCol: "C",
    stopWords: "",
  });

  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [demoLoading, setDemoLoading] = useState<boolean>(false);

  /** True while the "Add Supplier" request (create + initial sync) is in flight. */
  const [creating, setCreating] = useState<boolean>(false);

  /**
   * Holds the result of a successful supplier creation so the form can render
   * the success screen (imported product count) before the modal closes.
   * Null when no creation has completed yet.
   */
  const [createdResult, setCreatedResult] = useState<{
    supplierName: string;
    importedCount: number;
  } | null>(null);

  /** Set of supplier ids currently running a manual sync (for per-row spinner). */
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  /** Toast notification state: { type, message } or null when hidden. */
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  /**
   * Show a toast notification and auto-dismiss it after a short delay.
   * Re-triggering resets the timer so rapid consecutive syncs don't stack.
   */
  const showToast = (type: "success" | "error", message: string): void => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  /**
   * Trigger the backend ingestion pipeline for a single supplier:
   * POST /api/suppliers/:id/sync → fetches the feed, upserts products,
   * handles out-of-stock transitions, recalculates matches, updates lastSyncedAt.
   */
  const handleSync = async (supplierId: string): Promise<void> => {
    setSyncingIds((prev) => new Set(prev).add(supplierId));
    try {
      const result = await syncSupplier(supplierId);
      const count = result.created + result.updated + result.unchanged;
      showToast(
        "success",
        `Successfully synced ${count} products for ${result.supplierName}!`,
      );
      await refresh();
    } catch (err) {
      console.error("Sync failed for supplier:", supplierId, err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sync supplier. Please check the console for details.";
      showToast("error", message);
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(supplierId);
        return next;
      });
    }
  };

  /**
   * Generate a demo supplier with a unique name and batch-import 5 sample products.
   * Refreshes the supplier list from the backend after completion.
   */
  const handleGenerateDemo = async (): Promise<void> => {
    setDemoLoading(true);
    try {
      // 1. Build the demo products payload
      const demoProducts = [
        { rawSku: "TSC-001", rawName: "Wireless Bluetooth Headphones", price: 49.99 },
        { rawSku: "TSC-002", rawName: "USB-C Charging Cable 2m", price: 12.99 },
        { rawSku: "TSC-003", rawName: "Laptop Stand Adjustable", price: 34.50 },
        { rawSku: "TSC-004", rawName: "Mechanical Keyboard RGB", price: 89.99 },
        { rawSku: "TSC-005", rawName: "Ergonomic Mouse Wireless", price: 29.99 },
      ];

      // 2. Use a unique name so creating demo data never triggers a 409 Conflict
      //    (the backend enforces a unique constraint on supplier name).
      const uniqueName = `Demo Tech Supplier ${Date.now()}`;

      let targetSupplierId: string;

      try {
        const createdSupplier = await createSupplier({
          name: uniqueName,
          contactInfo: "https://demo-catalog.example.com/sheet",
        });
        targetSupplierId = createdSupplier.supplier.id;
      } catch (createErr) {
        // 3. Fallback: if creation failed (e.g. 409 Conflict), reuse the first
        //    existing supplier instead of throwing an unhandled error.
        console.warn("Demo supplier creation failed, falling back to existing supplier:", createErr);
        const existingSuppliers = await getSuppliers();
        const fallbackSupplier = existingSuppliers[0];
        if (!fallbackSupplier) {
          throw new Error("No existing supplier available to attach demo products to.");
        }
        targetSupplierId = fallbackSupplier.id;
      }

      // 4. Batch-import the 5 sample products for the resolved supplier
      await importSupplierProducts(targetSupplierId, {
        products: demoProducts,
      });

      // 5. Refresh the full supplier list from the backend
      await refresh();
    } catch (err) {
      console.error("Failed to generate demo data:", err);
      alert("Failed to generate demo supplier. Please check the console for details.");
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [refresh]); // Виконується 1 раз

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  /**
   * Reset the form back to its pristine "Add New Supplier" state.
   * Clears the editing target, all input fields, and any prior success result.
   */
  const resetForm = (): void => {
    setEditingId(null);
    setCreatedResult(null);
    setFormData({
      name: "",
      sheetUrl: "",
      feedType: "GOOGLE_SHEETS",
      autoSync: false,
      sheetGid: "",
      startRow: "1",
      useCustomMapping: false,
      skuCol: "A",
      titleCol: "B",
      priceCol: "C",
      stopWords: "",
    });
  };

  /**
   * Open the form in "Add New Supplier" mode, discarding any stale
   * state left over from a previous edit.
   */
  const handleOpenAddForm = (): void => {
    resetForm();
    setIsFormVisible(true);
  };

  // const handleSubmit = () => {
  //   if (!formData.name.trim()) {
  //     alert("Назва постачальника обов'язкова!");
  //     return;
  //   }

  //   if (editingId) {
  //     const updatedSuppliers = supplier.map((s) => {
  //       s.id === editingId ? { ...s, ...formData } : s;
  //     });
  //     setSupplier(updateSupplier);
  //     setEditingId(null);
  //   } else {
  //     const newSupplier = {
  //       ...formData,
  //       id: Date.now(),
  //       productsCount: 0,
  //     };

  //     setSupplier([...supplier, newSupplier]);
  //   }

  //   setIsFormVisible(false);
  //   setFormData({ name: "", sheetUrl: "" });
  // };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name.trim()) {
      alert("Назва постачальника обовязкова");
      return;
    }

    try {
      if (editingId) {
        const startRowNum = parseInt(formData.startRow, 10);
        await updateSupplier({
          id: editingId,
          name: formData.name,
          sheetUrl: formData.sheetUrl,
          feedType: formData.feedType,
          autoSync: formData.autoSync,
          productsCount: 0,
          status: 'Active',
          lastSync: null,
          sheetGid: formData.sheetGid.trim() || null,
          startRow: Number.isNaN(startRowNum) || startRowNum < 1 ? 1 : startRowNum,
          customMapping: formData.useCustomMapping
            ? {
                skuCol: formData.skuCol.trim() || undefined,
                titleCol: formData.titleCol.trim() || undefined,
                priceCol: formData.priceCol.trim() || undefined,
              }
            : null,
          stopWords: formData.stopWords.trim() || null,
        });

        setIsFormVisible(false);
        resetForm();
      } else {
        // Creating a new supplier: keep the modal open while the backend
        // creates the supplier AND runs the initial feed sync synchronously.
        setCreating(true);
        setCreatedResult(null);
        try {
          const startRowNum = parseInt(formData.startRow, 10);
          const result = await createSupplier({
            name: formData.name,
            contactInfo: formData.sheetUrl,
            feedUrl: formData.sheetUrl,
            feedType: formData.feedType,
            autoSync: formData.autoSync,
            sheetGid: formData.sheetGid.trim() || undefined,
            startRow: Number.isNaN(startRowNum) || startRowNum < 1 ? 1 : startRowNum,
            customMapping: formData.useCustomMapping
              ? {
                  skuCol: formData.skuCol.trim() || undefined,
                  titleCol: formData.titleCol.trim() || undefined,
                  priceCol: formData.priceCol.trim() || undefined,
                }
              : undefined,
            stopWords: formData.stopWords.trim() || undefined,
          });

          // Switch the form view to the success screen with the imported count.
          setCreatedResult({
            supplierName: result.supplier.name,
            importedCount: result.importedCount,
          });
        } finally {
          setCreating(false);
        }
      }
    } catch (err) {
      console.error("Failed to save supplier:", err);
      alert("Failed to save supplier. Please check the console for details.");
    }
  };

  /**
   * Close the success screen, reset the form, and refetch the supplier list.
   * Called from the "Done" button after a successful supplier creation.
   */
  const handleDone = async (): Promise<void> => {
    setIsFormVisible(false);
    resetForm();
    await refresh();
  };

  // const handleDelete = (id) => {
  //   setSuppliers((prevSuppliers) =>
  //     prevSuppliers.filter((supplier) => supplier.id !== id),
  //   );
  // };

  // const handleEdit = (supplier) => {
  //   setFormData({ name: supplier.name, sheetUrl: supplier.sheetUrl });
  //   setEditingId(supplier.id);
  //   setIsFormVisible(true);
  // };

  // 3. Фільтрація за пошуком
  const filteredSuppliers = supplier.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-start gap-3 max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-[fadeIn_0.2s_ease-out] ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <span className="w-5 h-5 shrink-0 mt-0.5 text-red-500 font-bold text-center leading-5">!</span>
          )}
          <span className="break-words">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-1 text-slate-400 hover:text-slate-600 shrink-0 font-bold"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header - залишаємо як був */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">
            Suppliers & Catalogs
          </h1>
          <p className="text-[#64748B] text-[15px]">
            Manage your connected suppliers and import catalogs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateDemo}
            disabled={demoLoading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 ${demoLoading ? "animate-spin" : ""}`} />
            {demoLoading ? "Generating..." : "Generate Demo Supplier with Products"}
          </button>
          <button
            onClick={() => {
              if (isFormVisible) {
                // Closing/cancelling the form: reset to a fresh state.
                resetForm();
                setIsFormVisible(false);
              } else {
                handleOpenAddForm();
              }
            }}
            className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isFormVisible ? "Cancel" : "Add Supplier"}
          </button>
        </div>
      </div>

      {/* Success screen shown after a supplier is created and its feed synced */}
      {isFormVisible && createdResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 mb-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900 mb-2">
            Success! Imported {createdResult.importedCount} products from{" "}
            {createdResult.supplierName}
          </h3>
          <p className="text-sm text-emerald-700 mb-6">
            Your supplier has been created and its catalog has been synced.
          </p>
          <button
            onClick={handleDone}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Форма додавання постачальника */}
      {isFormVisible && !createdResult && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-slate-900">
            {editingId ? "Edit Supplier" : "Add New Supplier"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="name" // Додаємо name для handleInputChange
              value={formData.name}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Supplier Name"
            />
            <input
              name="sheetUrl" // Додаємо sheet для handleInputChange
              value={formData.sheetUrl}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Sheet URL or CSV URL"
            />

            {/* Feed type selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Feed Type
              </label>
              <select
                name="feedType"
                value={formData.feedType}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="GOOGLE_SHEETS">Google Sheets</option>
                <option value="CSV">CSV File</option>
              </select>
            </div>

            {/* Auto Sync toggle */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="autoSync"
                  checked={formData.autoSync}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Auto Sync
                </span>
              </label>
            </div>

            {/* Advanced Feed Settings */}
            <div className="col-span-2 mt-2 border-t border-slate-200 pt-4">
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors list-none">
                  <span className="text-blue-600">⚙️</span>
                  Advanced Feed Settings
                  <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Sheet GID / Tab ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Sheet GID / Tab ID
                    </label>
                    <input
                      name="sheetGid"
                      value={formData.sheetGid}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="e.g. 0 or 18492049"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Specific tab of the Google Sheet to import (from the URL's gid= parameter).
                    </p>
                  </div>

                  {/* Start Row */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Start Row
                    </label>
                    <input
                      name="startRow"
                      type="number"
                      min={1}
                      value={formData.startRow}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="1"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Number of header rows to skip before product data begins.
                    </p>
                  </div>

                  {/* Column Mapping toggle */}
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="useCustomMapping"
                        checked={formData.useCustomMapping}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Set columns manually
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Define which spreadsheet columns hold the SKU, title and price. Leave off to
                      auto-detect columns from the header row.
                    </p>
                  </div>

                  {formData.useCustomMapping && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          SKU Column
                        </label>
                        <input
                          name="skuCol"
                          value={formData.skuCol}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm uppercase"
                          placeholder="A"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Title Column
                        </label>
                        <input
                          name="titleCol"
                          value={formData.titleCol}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm uppercase"
                          placeholder="B"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Price Column
                        </label>
                        <input
                          name="priceCol"
                          value={formData.priceCol}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm uppercase"
                          placeholder="C"
                        />
                      </div>
                    </>
                  )}

                  {/* Stop Words */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Negative Keywords (Stop Words)
                    </label>
                    <input
                      name="stopWords"
                      value={formData.stopWords}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="чохол, скло, уцінка, б/в"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Comma-separated keywords. Rows whose title contains any of them are skipped.
                    </p>
                  </div>
                </div>
              </details>
            </div>

            <button
              onClick={handleSubmit} // Кнопка додати
              disabled={creating}
              className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
              {creating ? "Creating & Syncing..." : "Add Supplier"}
            </button>
          </div>
        </div>
      )}

      {/* Пошук - підключаємо searchTerm */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50"
          />
        </div>
      </div>

      {/* Таблиця */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase">
          <div className="col-span-3">Supplier Name</div>
          <div className="col-span-4">Catalog Source</div>
          <div className="col-span-2">Products</div>
          <div className="col-span-2">Auto Sync</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* 4. МАГІЯ: Замість статичних рядків робимо .map() */}
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors group"
            >
              <div className="col-span-3 flex items-center gap-3">
                {/* Аватарка з першою літерою */}
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center border border-blue-100">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-500">ID: {s.id}</p>
                </div>
              </div>

              <div className="col-span-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Source Link
                  </span>
                </div>
                <a
                  href={s.sheetUrl}
                  className="text-xs text-blue-600 truncate block pr-4"
                >
                  {s.sheetUrl}
                </a>
              </div>

              <div className="col-span-2 text-sm text-slate-800">
                {s.productsCount || 0} items
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-1.5 mb-1">
                  {s.autoSync ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 text-sm font-medium">
                      <Zap className="w-4 h-4 text-amber-500" /> Auto Sync
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" /> Manual
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {s.lastSyncedAt
                    ? `Last synced ${new Date(s.lastSyncedAt).toLocaleString()}`
                    : "Never synced"}
                </div>
              </div>

              <div className="col-span-1 flex justify-end gap-2 items-center">
                {/* Кнопка синхронізації: викликає POST /api/suppliers/:id/sync */}
                <button
                  onClick={() => handleSync(s.id)}
                  disabled={syncingIds.has(s.id)}
                  title="Sync / Import from feed"
                  className={`p-2 rounded-lg transition-colors ${
                    syncingIds.has(s.id)
                      ? "text-blue-500 bg-blue-50 cursor-wait"
                      : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncingIds.has(s.id) ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  onClick={async () => {
                    if (!window.confirm("Видалити цього постачальника?")) return;
                    try {
                      // Call the real DELETE /api/suppliers/:id endpoint
                      await deleteSupplier(s.id);
                      // Only update local state after a successful backend deletion
                      await refresh();
                    } catch (err) {
                      console.error("Failed to delete supplier:", err);
                      alert("Failed to delete supplier. Please check the console for details.");
                    }
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Del
                </button>
                <button
                  onClick={() => {
                    setFormData({
                      name: s.name,
                      sheetUrl: s.sheetUrl,
                      feedType: s.feedType ?? "GOOGLE_SHEETS",
                      autoSync: s.autoSync ?? false,
                      sheetGid: s.sheetGid ?? "",
                      startRow: String(s.startRow ?? 1),
                      useCustomMapping: Boolean(
                        s.customMapping &&
                          (s.customMapping.skuCol ||
                            s.customMapping.titleCol ||
                            s.customMapping.priceCol),
                      ),
                      skuCol: s.customMapping?.skuCol ?? "A",
                      titleCol: s.customMapping?.titleCol ?? "B",
                      priceCol: s.customMapping?.priceCol ?? "C",
                      stopWords: s.stopWords ?? "",
                    });
                    setEditingId(s.id);
                    setIsFormVisible(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
