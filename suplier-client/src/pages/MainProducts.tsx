import React, { useState, type ChangeEvent } from "react";
import { Search, Plus, Package } from "lucide-react";
import { useProducts } from "../context/ProductContext";
import type { MainProduct } from "../types";

interface FormData {
  name: string;
  SKU: string;
  brand: string;
  category: string;
}

const MainProducts: React.FC = () => {
  const { products, supplierProducts, updateProduct, addProduct } = useProducts();

  const [searchTerm, setSearchTerm] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    SKU: "",
    brand: "",
    category: "",
  });

  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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
      setEditingProductId(null);
      setFormData({ name: "", SKU: "", brand: "", category: "" });
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
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isFormVisible ? "Cancel" : "Create Main Product"}
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
              Save Product
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
                    supplierProducts.filter((m) => m.mainProductId === product.id).length > 0
                      ? "text-blue-600 bg-blue-50 border-blue-200"
                      : "text-slate-500 bg-slate-100 border-slate-200"
                  }`}
                >
                  {
                    supplierProducts.filter((m) => m.mainProductId === product.id).length
                  }{" "}
                  Linked
                </span>
              </div>
              <div className="col-span-1 text-right">
                <button
                  onClick={() => handleEdit(product)}
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

export default MainProducts;
