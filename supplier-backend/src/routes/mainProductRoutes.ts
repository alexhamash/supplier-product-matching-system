import { Router } from "express";
import {
  getAllMainProducts,
  createMainProduct,
  updateMainProduct,
  deleteMainProduct,
  getMainProductMatrix,
  importMainProductsFromFeed,
} from "../controllers/mainProductController";

const router = Router();

// GET    /api/main-products         → Retrieve all main products
router.get("/", getAllMainProducts);

// POST   /api/main-products         → Create a new main product
router.post("/", createMainProduct);

// POST   /api/main-products/import  → Batch-import main products from a feed
// NOTE: Must be registered BEFORE the `/:id` routes so "import" is not captured
// as an `:id` path parameter.
router.post("/import", importMainProductsFromFeed);

// GET    /api/main-products/:id/matrix → Retrieve the supplier matrix for a product
router.get("/:id/matrix", getMainProductMatrix);

// PUT    /api/main-products/:id     → Update a main product by ID
router.put("/:id", updateMainProduct);

// DELETE /api/main-products/:id     → Delete a main product by ID
router.delete("/:id", deleteMainProduct);

export default router;
