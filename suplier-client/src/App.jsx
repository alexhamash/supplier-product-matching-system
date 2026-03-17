import { Routes, Route } from "react-router-dom"
import MainLayout from "./layout/MainLayout"
import Dashboard from "./pages/Dashboard"
import Suppliers from "./pages/Suppliers"
import SupplierProducts from "./pages/SupplierProducts"
import ProductMatching from "./pages/ProductMatching"
import MainProducts from "./pages/MainProducts"
import SupplierImport from "./pages/SupplierImport"
 
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers-products" element={<SupplierProducts />} />
        <Route path="product-matching" element={<ProductMatching />} />
        <Route path="main-products" element={<MainProducts />} />
        <Route path="suppliers/:id/import" element={<SupplierImport />} />
      </Route>
    </Routes>

  
  )
}

export default App