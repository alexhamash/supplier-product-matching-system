import { Router } from "express";
import {
  getAllSuppliers,
  createSupplier,
  deleteSupplier,
} from "../controllers/supplierController";

const router = Router();

// GET    /api/suppliers       → Retrieve all suppliers
router.get("/", getAllSuppliers);

// POST   /api/suppliers       → Create a new supplier
router.post("/", createSupplier);

// DELETE /api/suppliers/:id   → Delete a supplier by ID
router.delete("/:id", deleteSupplier);

export default router;
