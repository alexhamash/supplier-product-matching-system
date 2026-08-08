import { Router } from "express";
import {
  getAllSuppliers,
  createSupplier,
  deleteSupplier,
} from "../controllers/supplierController";
import {
  syncSupplierFeed,
  updateSupplierFeedConfig,
} from "../controllers/feedController";

const router = Router();

// GET    /api/suppliers       → Retrieve all suppliers
router.get("/", getAllSuppliers);

// POST   /api/suppliers       → Create a new supplier
router.post("/", createSupplier);

// DELETE /api/suppliers/:id   → Delete a supplier by ID
router.delete("/:id", deleteSupplier);

// POST   /api/suppliers/:id/sync          → Trigger an immediate manual feed sync
router.post("/:id/sync", syncSupplierFeed);

// PATCH  /api/suppliers/:id/feed-config   → Update feedUrl / feedType / autoSync
router.patch("/:id/feed-config", updateSupplierFeedConfig);

export default router;
