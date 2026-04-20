import { createContext, useState, ReactNode, useContext, useEffect } from "react"
import { MainProduct, SupplierProduct } from "../types"
import { getMainProducts } from "../services/mainProductService"
import { getSupplierProducts} from "../services/supplierService"


interface ProductContextType {
    products: MainProduct[]
    setProducts: (products: MainProduct[]) => void
    supplierProducts: SupplierProduct[]
    setSupplierProducts: (supplierProducts: SupplierProduct[]) => void
    loading: boolean
    setLoading: (loading: boolean) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)


export const ProductProvider = ({ children }: { children: ReactNode }) => {
    const [products, setProducts] = useState<MainProduct[]>([])
    const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
    const [loading, setLoading] = useState(false)

   useEffect(() => {
    const loadData = async () => {
        setLoading(true)
        try {
            const mainData = getMainProducts() as MainProduct[]
            const supplierData = getSupplierProducts(1) as SupplierProduct[]

            setProducts(mainData)
            setSupplierProducts(supplierData)
        } catch (error) {
            console.log("Помилка завантаження", error);
            
        } finally {
            setLoading(false)
        }
    }
    loadData()
   }, [])

    

return (
    <ProductContext.Provider value = {{products, setProducts, supplierProducts, setSupplierProducts, loading, setLoading }}>
        {children}
    </ProductContext.Provider>
)
}

export const useProducts = () => {
    const context = useContext(ProductContext)
    if (!context) throw new Error('useProducts must be used within a ProductProvider');
    return context
}