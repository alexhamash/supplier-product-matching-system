import { Router } from "express";
import {
  getAllMainProducts,
  createMainProduct,
  updateMainProduct,
  deleteMainProduct,
} from "../controllers/mainProductController";

const router = Router();

// GET    /api/main-products       → Retrieve all main products
router.get("/", getAllMainProducts);

// POST   /api/main-products       → Create a new main product
router.post("/", createMainProduct);

// PUT    /api/main-products/:id   → Update a main product by ID
router.put("/:id", updateMainProduct);

// DELETE /api/main-products/:id   → Delete a main product by ID
router.delete("/:id", deleteMainProduct);

export default router;
