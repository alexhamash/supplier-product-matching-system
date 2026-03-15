import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { importSupplierData, getSuppliers } from "../services/supplierService";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    info: "",
    sheetUrl: "",
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Отримуємо дані з твого сервісу при завантаженні сторінки
    const data = getSuppliers();
    setSuppliers(data);
  }, []);

  const handleImport = async (id) => {
    setMessage(`Import for supplier ${id} started...`);

    try {
      const result = await importSupplierData(id);
      setSuppliers([...getSuppliers()]); // Оновлюємо стан для перерендерингу
      setMessage(result.message);
    } catch (error) {
      setSuppliers([...getSuppliers()]);
      alert(`Error: ${error}`); // Виводимо помилку (Edge Case з US 6)
    }
  };

  const handleSubmit = () => {
    const isDuplicate = suppliers.find(
      (s) => s.name.toLowerCase() === formData.name.toLowerCase(),
    );

    if (isDuplicate) {
      alert("This supplier name already exists!");
      return;
    }

    const newSupplier = {
      ...formData,
      id: suppliers.length + 1,
      productsCount: 0,
    };

    setSuppliers([...suppliers, newSupplier]);

    setMessage("Profile created successfully!");
    setIsFormVisible(false);

    setFormData({ name: "", info: "", sheetUrl: "" });
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Suppliers List</h2>
        {/* Кнопка для додавання нового постачальника */}
        <button
          onClick={() => setIsFormVisible(true)}
          style={{
            padding: "10px 15px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          + Add New Supplier
        </button>
      </div>

      {message && (
        <div style={{ color: "green", padding: "10px" }}>{message}</div>
      )}

      {isFormVisible && (
        <div
          style={{
            background: "#f9f9f9",
            padding: "20px",
            margin: "20px 0",
            border: "1px solid #ddd",
          }}
        >
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
            onChange={(e) =>
              setFormData({ ...formData, sheetUrl: e.target.value })
            }
          />
          <button onClick={handleSubmit}>Save Supplier</button>
          <button onClick={() => setIsFormVisible(false)}>Cancel</button>
        </div>
      )}

      <p style={{ color: "gray" }}>Total suppliers: {suppliers.length}</p>

      <table
        style={{
          width: "100%",
          textAlign: "left",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc" }}>
            <th style={{ padding: "10px 0" }}>Supplier Name</th>
            <th>Sheet File</th>
            <th>Imported Products</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* 1. Map починається ТУТ */}
          {suppliers.map((supplier) => (
            <tr key={supplier.id} style={{ borderBottom: "1px solid #eee" }}>
              {/* 2. Кожна властивість постачальника — в окремій клітинці */}
              <td style={{ padding: "10px" }}>{supplier.name}</td>
              <td>{supplier.info}</td>
              <td>{supplier.sheetUrl}</td>

              <td>
                {supplier.status === "In Progress" && <progress />}{" "}
                {/* Візуальний прогрес бар */}
                <span
                  style={{
                    color:
                      supplier.status === "Success"
                        ? "green"
                        : supplier.status === "Failed"
                          ? "red"
                          : "orange",
                  }}
                >
                  {supplier.status}
                </span>
              </td>
              <td>
                <button
                  onClick={() => handleImport(supplier.id)}
                  disabled={supplier.status === "In Progress"}
                >
                  {supplier.status === "In Progress"
                    ? "Loading..."
                    : "Import Products"}
                </button>
              </td>

              {/* 4. Кнопка "Actions" (твій Link) */}
              <td>
                <Link
                  to={`/suppliers/${supplier.id}/import`}
                  style={{
                    display: "inline-block", // Щоб кнопка мала відступи
                    padding: "8px 12px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    borderRadius: "5px",
                    textDecoration: "none",
                  }}
                >
                  Import Catalog
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Suppliers;
