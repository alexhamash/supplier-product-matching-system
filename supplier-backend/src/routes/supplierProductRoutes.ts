import { Router } from "express";
import {
  importSupplierProducts,
  getSupplierProducts,
  clearSupplierProducts,
} from "../controllers/supplierProductController";

const router = Router();

// POST   /api/suppliers/:id/products   → Import / ingest batch of raw products
router.post("/:id/products", importSupplierProducts);

// GET    /api/suppliers/:id/products   → Fetch imported products for a supplier
router.get("/:id/products", getSupplierProducts);

// DELETE /api/suppliers/:id/products   → Clear all products for a supplier
router.delete("/:id/products", clearSupplierProducts);

export default router;
