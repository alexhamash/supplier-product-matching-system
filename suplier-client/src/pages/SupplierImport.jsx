import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSuppliers, importSupplierData } from "../services/supplierService";
import { ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { useProducts } from "../context/ProductContext";

const SupplierImport = () => {
  const { id } = useParams(); // Отримуємо ID з посилання
  const navigate = useNavigate();

  const { setSupplierProducts } = useProducts()

  const [supplier, setSupplier] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const allSuppliers = getSuppliers();
    const found = allSuppliers.find((s) => s.id === Number(id));
    if (found) {
      setSupplier(found);
    } else {
      navigate("/suppliers");
    }
  }, [id, navigate]);

  const handleStartImport = () => {
    setIsImporting(true); 
    setImportResult(null);

    importSupplierData(id)
      .then((result) => { 
        setSupplierProducts(prev => {
          const combined = [...prev, ...result.products];
          return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        });
        setImportResult(result);
      })
      .catch((error) => {

        console.error("Import error:", error);
      })
      .finally(() => {
        setIsImporting(false); 
      });
  };


  if (!supplier) return <div className="  p-10">Loading...</div>;

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
          Import Catalog: {supplier.name}
        </h1>
        <p className="text-slate-500 mb-6 font-mono text-sm">
          Source: {supplier.sheetUrl}
        </p>

        {!importResult ? (
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
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-emerald-900 font-bold text-lg">Success!</h3>
            <p className="text-emerald-700 mb-4">
              Imported {importResult.count} products from {supplier.name}.
            </p>
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


