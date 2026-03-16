import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, Package, ChevronDown } from "lucide-react";
import { getMainProducts } from "../services/mainProductService";

const MainProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    SKU: "",
    brand: "",
    category: "",
  });
  const [isFormVisible, setIsFormVisible] = useState(false);

  // 1. ПЕРШИЙ: Ініціалізація (тільки при завантаженні сторінки)
  useEffect(() => {
    // Прибираємо пробіл у назві ключа!
    const savedProducts = localStorage.getItem("main_products");

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Якщо в localStorage порожньо, беремо початкові дані з сервісу
      const data = getMainProducts();
      setProducts(data);
    }
  }, []); // Виконується 1 раз

  // 2. ДРУГИЙ: Синхронізація (кожного разу, коли міняється products)
  useEffect(() => {
    localStorage.setItem("main_products", JSON.stringify(products));
  }, [products]); // Виконується при кожній зміні списку

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.SKU.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Функція для оновлення полів форми
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Назва товару обов'язкова!");
      return;
    }

    if (formData.SKU.trim()) {
      const isDuplicate = products.some((p) => p.SKU === formData.SKU.trim());
      if (isDuplicate) {
        alert("Товар з таким SKU вже існує!");
        return;
      }
    }

    const newProduct = {
      ...formData,
      id: products.length + 1,
      linkedCount: 0, // Використовуємо linkedCount, бо так прописано у верстці нижче
    };

    setProducts([...products, newProduct]);
    setIsFormVisible(false);
    setFormData({ name: "", SKU: "", brand: "", category: "" });
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
          onClick={() => setIsFormVisible(!isFormVisible)} // ВИПРАВЛЕНО: було !is
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
            Add New Product
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="name" // Додаємо name для handleInputChange
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
            <button
              onClick={handleSubmit} // ВИПРАВЛЕНО: було handleSave
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
            value={searchTerm} // ВИПРАВЛЕНО: додаємо прив'язку
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or SKU..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {/* ... тут твої селектори ... */}
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
          {filteredProducts.map((product) => (
            <div
              key={product.id}
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
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {product.linkedCount || 0} Linked
                </span>
              </div>
              <div className="col-span-1 text-right">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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
