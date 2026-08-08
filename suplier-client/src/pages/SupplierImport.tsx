import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSuppliers,
  getSupplierProducts,
  syncSupplier,
} from "../services/supplierService";
import { ArrowLeft, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import type { Supplier, SupplierProduct, SyncSupplierResponse } from "../types";

const SupplierImport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { setSupplierProducts } = useProducts();

  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<SyncSupplierResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    getSuppliers().then((allSuppliers) => {
      const found = allSuppliers.find((s) => s.id === id);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentSupplier(found);
      } else {
        navigate("/suppliers");
      }
    });
  }, [id, navigate]);

  const handleStartImport = async (): Promise<void> => {
    if (!id) return;
    setIsImporting(true);
    setImportResult(null);
    setImportError(null);

    try {
      // Trigger the real backend ingestion pipeline:
      // POST /api/suppliers/:id/sync → fetches the feed, upserts products,
      // handles out-of-stock transitions, recalculates matches, updates lastSyncedAt.
      const result = await syncSupplier(id);

      // Refresh the shared context with the freshly-imported products.
      const products = await getSupplierProducts(id);
      setSupplierProducts((prev: SupplierProduct[]) => {
        const combined = [...prev, ...products];
        return combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
      });

      setImportResult(result);
    } catch (error) {
      console.error("Import error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to import supplier products. Please try again.";
      setImportError(message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!currentSupplier) return <div className="p-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Кнопка "Назад" */}
      <button
        onClick={() => navigate("/suppliers")}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800"
      >
        <ArrowLeft size={18} /> Back to Suppliers
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">
          Import Catalog: {currentSupplier.name}
        </h1>
        <p className="text-slate-500 mb-6 font-mono text-sm">
          Source: {currentSupplier.sheetUrl}
        </p>

        {!importResult && !importError ? (
          <button
            onClick={handleStartImport}
            disabled={isImporting}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
              isImporting
                ? "bg-slate-100 text-slate-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <RefreshCw className={isImporting ? "animate-spin" : ""} />
            {isImporting
              ? "Connecting to Google Sheets..."
              : "Start Synchronize"}
          </button>
        ) : importError ? (
          <div className="bg-red-50 border border-red-100 p-6 rounded-xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-red-900 font-bold text-lg">Import Failed</h3>
            <p className="text-red-700 mb-4">{importError}</p>
            <button
              onClick={() => {
                setImportError(null);
                setImportResult(null);
              }}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-emerald-900 font-bold text-lg">Success!</h3>
            <p className="text-emerald-700 mb-4">
              Imported {importResult?.created ?? 0} new products from{" "}
              {currentSupplier.name}.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left mb-4">
              <div className="bg-white border border-emerald-100 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-medium">Total rows</p>
                <p className="text-lg font-bold text-emerald-900">
                  {importResult?.totalRows ?? 0}
                </p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-medium">Created</p>
                <p className="text-lg font-bold text-emerald-900">
                  {importResult?.created ?? 0}
                </p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-medium">Updated</p>
                <p className="text-lg font-bold text-emerald-900">
                  {importResult?.updated ?? 0}
                </p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-medium">Out of stock</p>
                <p className="text-lg font-bold text-emerald-900">
                  {importResult?.markedOutOfStock ?? 0}
                </p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-medium">Skipped</p>
                <p className="text-lg font-bold text-emerald-900">
                  {importResult?.skippedRows ?? 0}
                </p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-lg p-3">
                <p className="text-xs text-emerald-600 font-medium">Unchanged</p>
                <p className="text-lg font-bold text-emerald-900">
                  {importResult?.unchanged ?? 0}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/suppliers")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierImport;
