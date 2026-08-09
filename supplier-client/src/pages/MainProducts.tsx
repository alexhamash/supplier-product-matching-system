import React, { useState, type ChangeEvent } from "react";
import { Search, Plus, Package, Table2, Trash2, X } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import type { MainProduct } from "../types";
import SupplierMatrixModal from "../components/SupplierMatrixModal";

interface FormData {
  name: string;
  SKU: string;
  brand: string;
  category: string;
}

const MainProducts: React.FC = () => {
  const { products, updateProduct, addProduct, deleteProduct } = useProducts();

  const [searchTerm, setSearchTerm] = useState<string>("");

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

  // Deduplicate products by unique ID before filtering to avoid duplicate keys.
  const uniqueProducts = Array.from(
    new Map(products.map((p) => [p.id, p])).values(),
  );

  const filteredProducts = uniqueProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.SKU.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <div className="w-full">
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight mb-1">
            Main Products
          </h1>
          <p className="text-[#64748B] text-[15px]">
            Manage your central store catalog.
          </p>
        </div>
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

      {/* Форма додавання товару */}
      {isFormVisible && (
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-6 mb-6">
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center shadow-sm">
        <div className="relative flex-1 w-full max-w-[50%]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            placeholder="Search by name or SKU..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-8">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
          <div className="col-span-4">Main Product Name & SKU</div>
          <div className="col-span-2">Brand</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-3">Linked Supplier Products</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id ? `${product.id}-${index}` : index}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center"
            >
              <div className="col-span-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-500">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    SKU: {product.SKU}
                  </p>
                </div>
              </div>
              <div className="col-span-2 text-sm text-slate-700">
                {product.brand || "—"}
              </div>
              <div className="col-span-2 text-sm text-slate-600">
                {product.category || "—"}
              </div>
              <div className="col-span-3">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    (product.linkedCount || 0) > 0
                      ? "text-blue-600 bg-blue-50 border-blue-200"
                      : "text-slate-500 bg-slate-100 border-slate-200"
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
      </div>

      {/* Supplier Matrix modal */}
      {matrixProduct && (
        <SupplierMatrixModal
          mainProductId={matrixProduct.id}
          mainProductName={matrixProduct.name}
          onClose={() => setMatrixProduct(null)}
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
