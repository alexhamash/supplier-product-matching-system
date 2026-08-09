import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from 'react-hot-toast';
import MainLayout from "./layout/MainLayout"
import Dashboard from "./pages/Dashboard"
import Suppliers from "./pages/Suppliers"
import SupplierProducts from "./pages/SupplierProducts"
import ProductMatching from "./pages/ProductMatching"
import MainProducts from "./pages/MainProducts"
import SupplierImport from "./pages/SupplierImport"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ProtectedRoute from "./components/ProtectedRoute"
import { ProductProvider } from "./context/ProductContext";

 
const App: React.FC = () => {
  return (

    <BrowserRouter>
      <ProductProvider>
        <Toaster position="top-right" />
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected application routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers-products" element={<SupplierProducts />} />
              <Route path="product-matching" element={<ProductMatching />} />
              <Route path="main-products" element={<MainProducts />} />
              <Route path="suppliers/:id/import" element={<SupplierImport />} />
              <Route path="/matching" element={<ProductMatching />} />
            </Route>
          </Routes>
      </ProductProvider>
   </BrowserRouter>
    
  )
}

export default App