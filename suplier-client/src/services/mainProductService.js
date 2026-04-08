const STORAGE_KEY = 'main_products'

const defaultProducts = [
    { id: 1, name: "iPhone 17", SKU: "MXVC3", brand: "Apple", category: "iPhone" },
    { id: 2, name: "iPhone 15", SKU: "MUPE3", brand: "Apple", category: "iPhone" },
    { id: 3, name: "iPhone 16", SKU: "MQEC3", brand: "Apple", category: "iPhone" },
    { id: 4, name: "AirPods Max Blue", SKU: "MQNMV", brand: "Apple", category: "AirPods" },

];



export const getMainProducts = () => {
   const savedData = localStorage.getItem(STORAGE_KEY)
   return savedData ? JSON.parse(savedData) : defaultProducts
}


export const saveMainProducts = (newProduct) => {
    const products = getMainProducts()
    const updatedProducts = [...products, {...newProduct, id: Date.now() }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts))

    return updatedProducts
}