import { createContext, useState, ReactNode, useContext, useEffect } from "react"
import { MainProduct, Supplier, SupplierProduct, type ProductContextState } from "../types"
import { getMainProducts } from "../services/mainProductService"
import { getSupplierProducts, getSuppliers} from "../services/supplierService"

const ProductContext = createContext<ProductContextState | undefined>(undefined)


export const ProductProvider = ({ children }: { children: ReactNode }) => {
    const [supplier, setSupplier] = useState<Supplier[]>([])
    const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null)
    const [products, setProducts] = useState<MainProduct[]>([])
    const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
    const [loading, setLoading] = useState(false)

   useEffect(() => {
    const loadData = async () => {
        setLoading(true)
        try {
            const mainData = getMainProducts() as MainProduct[]
            const supplierData = getSupplierProducts(1) as SupplierProduct[]
            const suppliers = getSuppliers() as Supplier[]

            setProducts(mainData)
            setSupplierProducts(supplierData)
            setSupplier(suppliers)
        } catch (error) {
            console.log("Помилка завантаження", error);
            
        } finally {
            setLoading(false)
        }
    }
    loadData()  
   }, [])

    const addProduct = (newProduct: MainProduct) => {
        const updated = [...products, newProduct];
        setProducts(updated);
        localStorage.setItem("main_products", JSON.stringify(updated));
    };

    const updateProduct = (updatedItem: MainProduct) => {
        const updated = products.map(p => p.id === updatedItem.id ? updatedItem : p);
        setProducts(updated);
        localStorage.setItem("main_products", JSON.stringify(updated));
    };

    const updateSupplier = (updatedItem: Supplier) => {
        const updatedSuppliers = supplier.map(p => p.id === updatedItem.id ? updatedItem : p);
        setSupplier(updatedSuppliers);
        localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers));
    };


    

return (
    <ProductContext.Provider value = {{
            products,
            setProducts,
            supplier,
            setSupplier,
            activeSupplier,
            supplierProducts,
            setSupplierProducts,
            loading,
            setLoading,
            addProduct,
            updateProduct,
            updateSupplier
        }}>
        {children}
    </ProductContext.Provider>
)
}

export const useProducts = () => {
    const context = useContext(ProductContext)
    if (!context) throw new Error('useProducts must be used within a ProductProvider');
    return context
}