import React from "react";
import { useState, useEffect } from "react";
import { getMainProducts } from "../services/mainProductService";

const MainProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({name: "", SKU: "", brand: "", category: ""})
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Отримуємо дані з твого сервісу при завантаженні сторінки
    const data = getMainProducts();
    setProducts(data);
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.SKU.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Назва товару обов'язкова!");
      return;
    }

    if (formData.SKU.trim()) {
      const isDuplicate = products.some(p => p.SKU === formData.SKU.trim());
        if (isDuplicate) {
        alert("Товар з таким SKU вже існує!");
        return;
        } 
    }

    const newProduct = {
      ...formData,
      id: products.length + 1,
      linkedProducts: 0
    }

    setProducts([...products, newProduct])

    setMessage('Product created successfully!');
    setIsFormVisible(false)

    setFormData({ name: "", SKU: "", brand: "", category: "" });
  }


  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
        <button onClick={() => setIsFormVisible(true)} style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + Add New Product
        </button>
      </div>

      {message && <div style={{ color: 'green', padding: '10px' }}>{message}</div>}

      {isFormVisible && (
        <div style={{ background: '#f9f9f9', padding: '20px', margin: '20px 0', border: '1px solid #ddd' }}>
          <h3>Add Product</h3>
          <input 
            type="text" 
            placeholder="Product Name"
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Product SKU"
            value={formData.SKU} 
            onChange={(e) => setFormData({ ...formData, SKU: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Product Brand"
            value={formData.brand} 
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Product Category"
            value={formData.category} 
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
      
          <button onClick={handleSubmit}>Save Product</button>
          <button onClick={() => setIsFormVisible(false)}>Cancel</button>
        </div>
      )}

        
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px 0' }}>Main Products</th>
            <th>SKU</th>
            <th>Brand</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '15px 0', fontWeight: 'bold' }}>{product.name}</td>
              <td>{product.SKU}</td>
              <td>{product.brand}</td>
              <td>{product.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MainProducts;
