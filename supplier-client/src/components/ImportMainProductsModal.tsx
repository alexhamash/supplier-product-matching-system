import React, { useState, type ChangeEvent, type DragEvent } from "react";
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { importMainProducts } from "../services/mainProductService";
import type { ImportMainProductsResponse } from "../types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ImportMainProductsModalProps {
  onClose: () => void;
  /** Called after a successful import so the parent can refresh the catalog. */
  onImported?: () => void;
}

interface MappingForm {
  skuCol: string;
  titleCol: string;
  priceCol: string;
  brandCol: string;
  categoryCol: string;
}

const EMPTY_MAPPING: MappingForm = {
  skuCol: "",
  titleCol: "",
  priceCol: "",
  brandCol: "",
  categoryCol: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

const ImportMainProductsModal: React.FC<ImportMainProductsModalProps> = ({
  onClose,
  onImported,
}) => {
  const [feedUrl, setFeedUrl] = useState<string>("");
  const [feedType, setFeedType] = useState<"CSV" | "GOOGLE_SHEETS">("GOOGLE_SHEETS");
  const [mapping, setMapping] = useState<MappingForm>(EMPTY_MAPPING);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportMainProductsResponse | null>(null);

  /**
   * Handle a CSV file being selected (via drag-and-drop or the file picker).
   * The file is read as text and stored so it can be sent to the backend.
   */
  const handleFile = (file: File | undefined | null): void => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>): void => {
    handleFile(e.target.files?.[0]);
  };

  const handleMappingChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setMapping((prev) => ({ ...prev, [name]: value.toUpperCase() }));
  };

  /**
   * Submit the import request to POST /api/main-products/import.
   *
   * When a CSV file was uploaded, its text content is sent as a data URL so the
   * backend can parse it directly without needing a hosted URL. Otherwise the
   * Google Sheet / CSV URL is sent as-is.
   */
  const handleSubmit = async (): Promise<void> => {
    setError(null);
    setResult(null);

    // Resolve the effective source: uploaded file content or the URL.
    const effectiveUrl = fileContent
      ? `data:text/csv;base64,${btoa(unescape(encodeURIComponent(fileContent)))}`
      : feedUrl.trim();

    if (!effectiveUrl) {
      setError("Please provide a Google Sheet URL or upload a CSV file.");
      return;
    }

    setIsImporting(true);
    try {
      const response = await importMainProducts({
        feedUrl: effectiveUrl,
        feedType: fileContent ? "CSV" : feedType,
        customMapping: {
          skuCol: mapping.skuCol || undefined,
          titleCol: mapping.titleCol || undefined,
          priceCol: mapping.priceCol || undefined,
          brandCol: mapping.brandCol || undefined,
          categoryCol: mapping.categoryCol || undefined,
        },
      });
      setResult(response);
      onImported?.();
    } catch (err) {
      console.error("Catalog import failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import catalog. Please check the console for details.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Import Catalog</h3>
            <p className="text-sm text-slate-500">
              Batch-import Main Products from a Google Sheet or CSV file.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Source selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Source
            </label>

            {/* Feed type toggle */}
            <div className="flex gap-2 mb-3">
              {(["GOOGLE_SHEETS", "CSV"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedType(type)}
                  disabled={Boolean(fileContent)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    feedType === type && !fileContent
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {type === "GOOGLE_SHEETS" ? "Google Sheets" : "CSV File"}
                </button>
              ))}
            </div>

            {/* Google Sheet URL input */}
            {!fileContent && (
              <input
                type="text"
                value={feedUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFeedUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
              />
            )}

            {/* Drag-and-drop file upload */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`mt-3 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                fileContent
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-300 bg-slate-50 hover:border-blue-400"
              }`}
            >
              {fileContent ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-sm font-medium">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileContent(null);
                      setFileName(null);
                    }}
                    className="text-slate-400 hover:text-red-500 ml-2"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    Drag & drop a CSV file here, or{" "}
                    <span className="text-blue-600 font-medium">browse</span>
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Field mapping */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Field Mapping <span className="text-slate-400 font-normal">(column letters, e.g. A, B, C)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">SKU column</label>
                <input
                  name="skuCol"
                  value={mapping.skuCol}
                  onChange={handleMappingChange}
                  placeholder="A (optional)"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title column</label>
                <input
                  name="titleCol"
                  value={mapping.titleCol}
                  onChange={handleMappingChange}
                  placeholder="B"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Price column</label>
                <input
                  name="priceCol"
                  value={mapping.priceCol}
                  onChange={handleMappingChange}
                  placeholder="C (optional)"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Brand column</label>
                <input
                  name="brandCol"
                  value={mapping.brandCol}
                  onChange={handleMappingChange}
                  placeholder="D (optional)"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Category column</label>
                <input
                  name="categoryCol"
                  value={mapping.categoryCol}
                  onChange={handleMappingChange}
                  placeholder="E (optional)"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Result summary */}
          {result && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-900">
                  Import completed successfully
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-emerald-100 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-medium">Total rows</p>
                  <p className="text-lg font-bold text-emerald-900">{result.totalRows}</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-medium">Created</p>
                  <p className="text-lg font-bold text-emerald-900">{result.created}</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-medium">Updated</p>
                  <p className="text-lg font-bold text-emerald-900">{result.updated}</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-medium">Skipped</p>
                  <p className="text-lg font-bold text-emerald-900">{result.skippedRows}</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-medium">No SKU</p>
                  <p className="text-lg font-bold text-emerald-900">{result.skippedNoSku}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={isImporting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Catalog"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportMainProductsModal;
