import React from 'react'
import { Outlet, NavLink } from "react-router-dom"

const MainLayout = () => {
  return (
    <>
        <div>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/suppliers">Suppliers</NavLink>
            <NavLink to="/supplier-products">Supplier Products</NavLink>
            <NavLink to="/product-matching">Product Matching</NavLink>
        </div>
        
        <div>
            <Outlet />
        </div>
    </>
  )
}

<>

</>
export default MainLayout