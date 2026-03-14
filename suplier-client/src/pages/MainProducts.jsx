import React from "react";
import { useState, useEffect } from "react";
import { getMainProducts } from "../services/mainProductService";

const MainProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Отримуємо дані з твого сервісу при завантаженні сторінки
    const data = getMainProducts();
    setProducts(data);
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div>
        <input type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />

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
