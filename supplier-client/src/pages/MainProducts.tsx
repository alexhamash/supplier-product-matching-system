import React, { useEffect, useState, type ChangeEvent } from "react";
import { Search, Plus, Columns, Table2, Trash2, X, Upload } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import type { MainProduct } from "../types";
import SupplierMatrixModal from "../components/SupplierMatrixModal";
import ImportMainProductsModal from "../components/ImportMainProductsModal";

interface FormData {
  name: string;
  SKU: string;
  brand: string;
  category: string;
}

const MainProducts: React.FC = () => {
  const { products, updateProduct, addProduct, deleteProduct, refresh } = useProducts();

  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination state. `itemsPerPage` is restored from localStorage.
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem("main_products_items_per_page");
    return saved !== null ? JSON.parse(saved) : 20;
  });

  // Column visibility toggles, restored from localStorage.
  const [showBrand, setShowBrand] = useState<boolean>(() => {
    const saved = localStorage.getItem("main_products_show_brand");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [showCategory, setShowCategory] = useState<boolean>(() => {
    const saved = localStorage.getItem("main_products_show_category");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState<boolean>(false);

  // Persist column visibility and items-per-page selections.
  useEffect(() => {
    localStorage.setItem("main_products_show_brand", JSON.stringify(showBrand));
  }, [showBrand]);

  useEffect(() => {
    localStorage.setItem(
      "main_products_show_category",
      JSON.stringify(showCategory),
    );
  }, [showCategory]);

  useEffect(() => {
    localStorage.setItem(
      "main_products_items_per_page",
      JSON.stringify(itemsPerPage),
    );
  }, [itemsPerPage]);

  // The main product awaiting deletion confirmation (null = modal closed).
  const [productToDelete, setProductToDelete] = useState<MainProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    SKU: "",
    brand: "",
    category: "",
  });

  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // The main product currently being inspected in the Supplier Matrix modal.
  const [matrixProduct, setMatrixProduct] = useState<MainProduct | null>(null);

  // Whether the "Import Catalog" modal is open.
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Deduplicate products by unique ID before filtering to avoid duplicate keys.
  const uniqueProducts = Array.from(
    new Map(products.map((p) => [p.id, p])).values(),
  );

  const filteredProducts = uniqueProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.SKU.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Dynamic column span for the name column so the grid always totals 12
  // columns regardless of which optional columns are hidden.
  const nameColSpan = 4 + (showBrand ? 0 : 2) + (showCategory ? 0 : 2);

  // ─── Pagination ────────────────────────────────────────────────────────────
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Clamp the current page so it never exceeds the last page (e.g. after the
  // items-per-page selection shrinks the result set).
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * itemsPerPage;
  const pageEnd = Math.min(pageStart + itemsPerPage, totalItems);
  const paginatedProducts = filteredProducts.slice(pageStart, pageEnd);

  // Reset to the first page whenever the search query changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  /**
   * Compute the visible page numbers to render, always including page 1,
   * the current page (plus/minus one neighbor), and the last page. Gaps
   * between non-adjacent numbers are represented by the string "...".
   */
  const getVisiblePages = (): Array<number | "..."> => {
    const pages = new Set<number>([1, totalPages, safePage, safePage - 1, safePage + 1]);

    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);

    const result: Array<number | "..."> = [];
    let prev: number | null = null;

    for (const page of sorted) {
      if (prev !== null && page - prev > 1) {
        result.push("...");
      }
      result.push(page);
      prev = page;
    }

    return result;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Reset the form back to its pristine "Add New Product" state.
   * Clears the editing target and all input fields.
   */
  const resetForm = (): void => {
    setEditingProductId(null);
    setFormData({ name: "", SKU: "", brand: "", category: "" });
  };

  /**
   * Open the form in "Add New Product" mode, discarding any stale
   * state left over from a previous edit.
   */
  const handleOpenAddForm = (): void => {
    resetForm();
    setIsFormVisible(true);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name.trim() || !formData.SKU.trim()) {
      alert("Заповність поля");
      return;
    }

    try {
      if (editingProductId) {
        const updatedProduct: MainProduct = {
          id: editingProductId,
          name: formData.name,
          SKU: formData.SKU,
          brand: formData.brand,
          category: formData.category || undefined,
          linkedCount: 0,
        };
        await updateProduct(updatedProduct);
      } else {
        const newProduct: MainProduct = {
          ...formData,
          // The backend assigns the real UUID on creation; this placeholder is
          // only used locally and is never sent to the API.
          id: "",
          linkedCount: 0,
        };
        await addProduct(newProduct);
      }

      setIsFormVisible(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save product:", err);
      alert("Failed to save product. Please check the console for details.");
    }
  };

  const handleEdit = (product: MainProduct): void => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      SKU: product.SKU,
      brand: product.brand,
      category: product.category ?? "",
    });
    setIsFormVisible(true);
  };

  /**
   * Confirm and delete the selected main product.
   * The backend unlinks any associated supplier-product matches before
   * removing the record, so linked supplier products become available again.
   */
  const handleConfirmDelete = async (): Promise<void> => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      alert("Main product deleted successfully. Associated matches were unlinked.");
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product. Please check the console for details.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Main Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your central store catalog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Catalog
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
            className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isFormVisible ? "Cancel" : "Add Product"}
          </button>
        </div>
      </div>

      {/* Форма додавання товару */}
      {isFormVisible && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-slate-900">
            {editingProductId ? "Edit Product" : "Add New Product"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm"
              placeholder="Product Name"
            />
            <input
              name="SKU"
              value={formData.SKU}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm font-mono"
              placeholder="SKU"
            />
            <input
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm font-mono"
              placeholder="Brand"
            />
            <input
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="p-2 border border-slate-200 rounded-lg text-sm font-mono"
              placeholder="Category"
            />
            <button
              onClick={handleSubmit}
              className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-colors"
            >
              {editingProductId ? "Save Product" : "Add Product"}
            </button>
          </div>
        </div>
      )}

      {/* Filter section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-[50%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search by name or SKU..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Column visibility toggles */}
        <div className="relative ml-auto">
          <button
            onClick={() => setIsColumnsMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Columns className="w-4 h-4 text-slate-400" />
            Columns
          </button>

          {isColumnsMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsColumnsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-30 w-48 bg-white border border-slate-200 rounded-lg shadow-lg p-2">
                <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showBrand}
                    onChange={(e) => setShowBrand(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Brand
                </label>
                <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showCategory}
                    onChange={(e) => setShowCategory(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Category
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
          <div className={`${nameColSpan === 4 ? "col-span-4" : nameColSpan === 6 ? "col-span-6" : "col-span-8"} text-left`}>
            Main Product Name & SKU
          </div>
          {showBrand && <div className="col-span-2 text-left">Brand</div>}
          {showCategory && <div className="col-span-2 text-left">Category</div>}
          <div className="col-span-3 text-left">Linked Supplier Products</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100">
          {paginatedProducts.map((product, index) => (
            <div
              key={product.id ? `${product.id}-${index}` : index}
              className="grid grid-cols-12 gap-4 px-4 py-2.5 text-sm align-middle hover:bg-slate-50/60 transition-colors border-b border-slate-100"
            >
              <div className={`${nameColSpan === 4 ? "col-span-4" : nameColSpan === 6 ? "col-span-6" : "col-span-8"} min-w-0`}>
                <span className="font-semibold text-slate-900 text-sm leading-snug block">
                  {product.name}
                </span>
                <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                  SKU: {product.SKU || "—"}
                </span>
              </div>
              {showBrand && (
                <div className="col-span-2">
                  {product.brand ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {product.brand}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">—</span>
                  )}
                </div>
              )}
              {showCategory && (
                <div className="col-span-2">
                  {product.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {product.category}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">—</span>
                  )}
                </div>
              )}
              <div className="col-span-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    (product.linkedCount || 0) > 0
                      ? "text-blue-600 bg-blue-50 border-blue-200"
                      : "text-slate-600 bg-slate-100 border-slate-200"
                  }`}
                >
                  {product.linkedCount || 0} Linked
                </span>
              </div>
              <div className="col-span-1 text-right flex items-center justify-end gap-2">
                <button
                  onClick={() => setMatrixProduct(product)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  title="View supplier matrix"
                >
                  <Table2 className="w-4 h-4" />
                  Matrix
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setProductToDelete(product)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                  title="Delete main product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 min-h-[56px] text-sm text-slate-600">
            {/* Range + total count */}
            <div className="whitespace-nowrap flex items-center gap-1">
              <span>Showing</span>
              <b className="font-semibold text-slate-900">
                {pageStart + 1}
              </b>
              <span>to</span>
              <b className="font-semibold text-slate-900">{pageEnd}</b>
              <span>of</span>
              <b className="font-semibold text-slate-900">{totalItems}</b>
              <span>items</span>
            </div>

            {/* Page controls */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
              >
                Previous
              </button>

              {/* Page numbers with ellipsis */}
              {getVisiblePages().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="w-8 h-8 flex items-center justify-center text-sm text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                      page === safePage
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
              >
                Next
              </button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span>Rows per page</span>
              <select
                value={itemsPerPage}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="pl-2 pr-7 py-1.5 border border-slate-200 rounded-lg text-sm appearance-none bg-white cursor-pointer text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Matrix modal */}
      {matrixProduct && (
        <SupplierMatrixModal
          mainProductId={matrixProduct.id}
          mainProductName={matrixProduct.name}
          onClose={() => setMatrixProduct(null)}
        />
      )}

      {/* Import Catalog modal */}
      {isImportModalOpen && (
        <ImportMainProductsModal
          onClose={() => setIsImportModalOpen(false)}
          onImported={() => void refresh()}
        />
      )}

      {/* Delete confirmation modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Delete Main Product
              </h3>
              <button
                onClick={() => setProductToDelete(null)}
                className="text-slate-400 hover:text-slate-600"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {productToDelete.name}
              </span>
              ?
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Associated matches will be unlinked and the linked supplier
              products will become available for matching again.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainProducts;
