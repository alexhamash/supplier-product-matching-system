import React from "react";
import { useState, useEffect } from "react";
import { getSuppliers } from "../services/supplierService";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const data = getSuppliers();
    setSuppliers(data);
  }, []);

  return (
    <div>
      {suppliers.map(supplier => (
        <div key={supplier.id}>
          {supplier.name} - {supplier.sheet}
        </div>
      ))}
    </div>
  );
};

export default Suppliers;
