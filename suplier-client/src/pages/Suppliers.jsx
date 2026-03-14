import React, { useState, useEffect } from "react";
import { getSuppliers } from "../services/supplierService";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);


  const [formData, setFormData] = useState({name: "", info: "", sheetUrl: ""})
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Отримуємо дані з твого сервісу при завантаженні сторінки
    const data = getSuppliers();
    setSuppliers(data);
  }, []);

  const handleSubmit = () => {
    const isDuplicate = suppliers.find(s => s.name.toLowerCase() === formData.name.toLowerCase());

    if (isDuplicate) {
      alert("This supplier name already exists!"); 
      return;
    }

    const newSupplier = {
      ...formData,
      id: suppliers.length + 1,
      productsCount: 0
    }

    setSuppliers([...suppliers, newSupplier])

    setMessage('Profile created successfully!');
    setIsFormVisible(false)

    setFormData({ name: "", info: "", sheetUrl: "" });
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Suppliers List</h2>
        {/* Кнопка для додавання нового постачальника */}
        
        <button onClick={() => setIsFormVisible(true)} style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          + Add New Supplier
        </button>
      </div>
      
      {message && <div style={{ color: 'green', padding: '10px' }}>{message}</div>}

      {isFormVisible && (
        <div style={{ background: '#f9f9f9', padding: '20px', margin: '20px 0', border: '1px solid #ddd' }}>
          <h3>Add Supplier Profile</h3>
          <input 
            type="text" 
            placeholder="Supplier Name"
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Supplier Info"
            value={formData.info} 
            onChange={(e) => setFormData({ ...formData, info: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Supplier URL"
            value={formData.sheetUrl} 
            onChange={(e) => setFormData({ ...formData, sheetUrl: e.target.value })}
          />
          <button onClick={handleSubmit}>Save Supplier</button>
          <button onClick={() => setIsFormVisible(false)}>Cancel</button>
        </div>
      )}

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