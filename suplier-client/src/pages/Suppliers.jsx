import React, { useState, useEffect } from "react";
import { getSuppliers } from "../services/supplierService";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    // Отримуємо дані з твого сервісу при завантаженні сторінки
    const data = getSuppliers();
    setSuppliers(data);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Suppliers List</h2>
        {/* Кнопка для додавання нового постачальника */}
        <button style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + Add New Supplier
        </button>
      </div>

      <p style={{ color: 'gray' }}>Total suppliers: {suppliers.length}</p>

      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '10px 0' }}>Supplier Name</th>
            <th>Sheet File</th>
            <th>Imported Products</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '15px 0', fontWeight: 'bold' }}>{supplier.name}</td>
              {/* Використовуємо правильне поле sheetUrl */}
              <td>{supplier.sheetUrl}</td>
              <td>{supplier.productsCount}</td>
              <td>
                {/* Динамічний статус: якщо є товари - зелений, якщо ні - жовтий */}
                <span style={{ 
                  background: supplier.productsCount > 0 ? '#d4edda' : '#fff3cd', 
                  color: supplier.productsCount > 0 ? '#155724' : '#856404',
                  padding: '5px 10px', 
                  borderRadius: '15px', 
                  fontSize: '14px' 
                }}>
                  {supplier.productsCount > 0 ? 'Active' : 'Pending Import'}
                </span>
              </td>
              <td>
                <button style={{ marginRight: '10px', cursor: 'pointer' }}>Edit</button>
                <button style={{ cursor: 'pointer' }}>View Catalog</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Suppliers;