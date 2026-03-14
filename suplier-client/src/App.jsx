import { Routes, Route } from "react-router-dom"
import MainLayout from "./layout/MainLayout"
import Dashboard from "./pages/Dashboard"
import Suppliers from "./pages/Suppliers"
import SupplierProducts from "./pages/SupplierProducts"
import ProductMatching from "./pages/ProductMatching"
import MainProducts from "./pages/MainProducts"

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="main-products" element={<MainProducts />} /> 
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="supplier-products" element={<SupplierProducts />} />
        <Route path="product-matching" element={<ProductMatching />} />
      </Route>
    </Routes>

  
  )
}

export default App