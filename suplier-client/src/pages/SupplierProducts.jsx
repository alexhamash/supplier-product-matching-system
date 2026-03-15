import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMainProducts } from '../services/mainProductService'; 
import { linkProduct, getSupplierProducts } from '../services/supplierService';

const SupplierProducts = () => {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [unmatchedOnly, setUnmatchedOnly] = useState(false);

  // Отримуємо список головних товарів
  const mainProducts = getMainProducts(); 

  useEffect(() => {
    const data = getSupplierProducts(Number(id));
    setProducts(data);
  }, [id]);

  const handleMatch = (supplierProductId, mainProductId) => {
    // Виконуємо зв'язування (US 9)
    const result = linkProduct(supplierProductId, mainProductId ? Number(mainProductId) : null);
    if (result.success) {
        setProducts([...getSupplierProducts(Number(id))]);
    }
  };

  const visibleProducts = unmatchedOnly 
    ? products.filter(p => p.mainProductId === null) 
    : products;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Supplier Inventory</h2>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setUnmatchedOnly(!unmatchedOnly)}
          style={{ 
            padding: '10px', 
            cursor: 'pointer',
            backgroundColor: unmatchedOnly ? '#007bff' : '#f0f0f0',
            color: unmatchedOnly ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        >
          {unmatchedOnly ? "✓ Showing Unmatched Only" : "Filter Unmatched Only"}
        </button>
      </div>
      
      {visibleProducts.length === 0 ? (
        <p style={{ color: 'gray' }}>No products found matching your filter.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th>Original Name</th>
              <th>Original SKU</th>
              <th>Price</th>
              <th>Status</th>
              {/* 1. ДОДАЄМО ЗАГОЛОВОК КОЛОНКИ */}
              <th>Link to Main Product</th> 
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ padding: '10px 0' }}>{product.originalName}</td>
                <td>{product.originalSKU || "—"}</td>
                <td>${product.price}</td>
                <td>
                  <span style={{ 
                    color: product.mainProductId ? "green" : "gray",
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {product.mainProductId ? "● Matched" : "○ Unmatched"}
                  </span>
                </td>
                <td>
                  <select 
                    value={product.mainProductId || ""} 
                    onChange={(e) => handleMatch(product.id, e.target.value)}
                    style={{ padding: '5px', borderRadius: '4px' }}
                  >
                    <option value="">-- Select Product --</option>
                    {mainProducts.map(mp => (
                      <option key={mp.id} value={mp.id}>
                        {mp.name} (SKU: {mp.SKU})
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SupplierProducts;