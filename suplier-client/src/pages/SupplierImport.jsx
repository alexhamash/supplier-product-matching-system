import React, { useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { getSuppliers } from '../services/supplierService'; // Твій сервіс постачальників

const SupplierImport = () => {

const { id } = useParams();
const [loading, setLoading] = useState(false);
const [importedCount, setImportedCount] = useState(0);

const supplier = getSuppliers().find(s => s.id === parseInt(id));

const handleImport = () => {
    setLoading(true)

    setTimeout(() => {
      setLoading(false);
      setImportedCount(45); // Тест, ми "знайшли" 45 товарів у прайсі
    }, 2000);

    if (!supplier) return <div>Постачальника не знайдено</div>;
}   

  return (
    <div style={{ padding: '20px' }}>
        <h1>Import catalog for: {supplier.name}</h1>
        <p>Source URL: <a href={supplier.sheetUrl} target="_blank">{supplier.sheetUrl}</a></p>

        <hr />

        {importedCount === 0 && !loading && (
                <button onClick={handleImport} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Start Sync with Google Sheets
                </button>
        )}

        {loading && <p>⏳ Importing products, please wait...</p>}

        {importedCount > 0 && (
        <div style={{ color: 'green', marginTop: '20px' }}>
          <h3>✅ Success!</h3>
          <p>Imported {importedCount} products from {supplier.name}.</p>
          <Link to="/suppliers">Return to list</Link>
        </div>
      )}
    </div>

    
  )
}

export default SupplierImport