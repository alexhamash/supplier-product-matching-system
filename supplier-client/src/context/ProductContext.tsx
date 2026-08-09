import { createContext, useState, useCallback, type ReactNode, useContext, useEffect } from "react"
import type { MainProduct, Supplier, SupplierProduct, ProductContextState } from "../types"
import {
  getMainProducts,
  createMainProduct,
  updateMainProduct,
  deleteMainProduct,
} from "../services/mainProductService"
import {
  getSupplierProducts,
  getSuppliers,
  createSupplier,
} from "../services/supplierService"

const ProductContext = createContext<ProductContextState | undefined>(undefined)

export const ProductProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
    const [supplier, setSupplier] = useState<Supplier[]>([])
    const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null)
    const [products, setProducts] = useState<MainProduct[]>([])
    const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Load all main products and suppliers from the backend.
     * Exposed via `refresh` so components can re-fetch after mutations.
     */
    const refresh = useCallback(async (): Promise<void> => {
        setLoading(true)
        setError(null)
        try {
            const [mainData, suppliers] = await Promise.all([
                getMainProducts(),
                getSuppliers(),
            ])

            setProducts(mainData)
            setSupplier(suppliers)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Помилка завантаження"
            console.error("Помилка завантаження", err)
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    /**
     * Create a main product via the backend, then refetch the list.
     */
    const addProduct = async (newProduct: MainProduct): Promise<void> => {
        setError(null)
        try {
            await createMainProduct({
                sku: newProduct.SKU,
                name: newProduct.name,
                description: newProduct.category,
                price: 0,
            })
            await refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Помилка створення товару"
            console.error("Помилка створення товару", err)
            setError(message)
            throw err
        }
    }

    /**
     * Update a main product via the backend, then refetch the list.
     */
    const updateProduct = async (updatedItem: MainProduct): Promise<void> => {
        setError(null)
        try {
            await updateMainProduct(String(updatedItem.id), {
                sku: updatedItem.SKU,
                name: updatedItem.name,
                description: updatedItem.category ?? null,
            })
            await refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Помилка оновлення товару"
            console.error("Помилка оновлення товару", err)
            setError(message)
            throw err
        }
    }

    /**
     * Delete a main product via the backend, then refetch the list.
     * The backend also unlinks any associated supplier-product matches.
     */
    const deleteProduct = async (id: string): Promise<void> => {
        setError(null)
        try {
            await deleteMainProduct(id)
            await refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Помилка видалення товару"
            console.error("Помилка видалення товару", err)
            setError(message)
            throw err
        }
    }

    /**
     * Update a supplier via the backend, then refetch the list.
     */
    const updateSupplier = async (updatedItem: Supplier): Promise<void> => {
        setError(null)
        try {
            await createSupplier({
                name: updatedItem.name,
                contactInfo: updatedItem.sheetUrl,
            })
            await refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Помилка оновлення постачальника"
            console.error("Помилка оновлення постачальника", err)
            setError(message)
            throw err
        }
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
                error,
                setError,
                refresh,
                addProduct,
                updateProduct,
                deleteProduct,
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
