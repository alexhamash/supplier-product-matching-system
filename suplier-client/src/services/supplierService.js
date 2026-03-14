const suppliers = [
    {
        id: 1,
        name: "Stock",
        sheetUrl: "stock.xls",
        productsCount: 120
    },

    {
        id: 2,
        name: "NewTime",
        sheetUrl: "newtime.xls",
        productsCount: 100
    },

    {
        id: 3,
        name: "Gro",
        sheetUrl: "gro.xls",
        productsCount: 175
    },

     {
        id: 4,
        name: "MrFix",
        sheetUrl: "mrfix.xls",
        productsCount: 85
    }
]

export const getSuppliers = () => {
   return suppliers
}