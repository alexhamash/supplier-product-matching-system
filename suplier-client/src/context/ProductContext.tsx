import { createContext, useState, type ReactNode, useContext, useEffect } from "react"
import type { MainProduct, Supplier, SupplierProduct, ProductContextState } from "../types"
import { getMainProducts } from "../services/mainProductService"
import { getSupplierProducts, getSuppliers } from "../services/supplierService"

const ProductContext = createContext<ProductContextState | undefined>(undefined)

export const ProductProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
    const [supplier, setSupplier] = useState<Supplier[]>([])
    const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null)
    const [products, setProducts] = useState<MainProduct[]>([])
    const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadData = async (): Promise<void> => {
            setLoading(true)
            try {
                const mainData: MainProduct[] = getMainProducts() as MainProduct[]
                const supplierData: SupplierProduct[] = getSupplierProducts(1) as SupplierProduct[]
                const suppliers: Supplier[] = getSuppliers() as Supplier[]

                setProducts(mainData)
                setSupplierProducts(supplierData)
                setSupplier(suppliers)
            } catch (error: unknown) {
                console.error("Помилка завантаження", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const addProduct = (newProduct: MainProduct): void => {
        const updated: MainProduct[] = [...products, newProduct]
        setProducts(updated)
        localStorage.setItem("main_products", JSON.stringify(updated))
    }

    const updateProduct = (updatedItem: MainProduct): void => {
        const updated: MainProduct[] = products.map((p: MainProduct) =>
            p.id === updatedItem.id ? updatedItem : p
        )
        setProducts(updated)
        localStorage.setItem("main_products", JSON.stringify(updated))
    }

    const updateSupplier = (updatedItem: Supplier): void => {
        const updatedSuppliers: Supplier[] = supplier.map((p: Supplier) =>
            p.id === updatedItem.id ? updatedItem : p
        )
        setSupplier(updatedSuppliers)
        localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers))
    }

    return (
        <ProductContext.Provider
            value={{
                products,
                setProducts,
                supplier,
                setSupplier,
                activeSupplier,
                setActiveSupplier,
                supplierProducts,
                setSupplierProducts,
                loading,
                setLoading,
                addProduct,
                updateProduct,
                updateSupplier,
            }}
        >
            {children}
        </ProductContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = (): ProductContextState => {
    const context: ProductContextState | undefined = useContext(ProductContext)
    if (context === undefined) {
        throw new Error("useProducts must be used within a ProductProvider")
    }
    return context
}