import { Router } from "express";
import {
  runMatching,
  getMatches,
  updateMatchStatus,
  linkMatch,
} from "../controllers/matchingController";

const router = Router();

// POST   /api/matching/run           → Trigger matching engine for a supplier
router.post("/run", runMatching);

// POST   /api/matching/link          → Directly link a supplier product to a main product
router.post("/link", linkMatch);

// GET    /api/matching               → Fetch matches (optional ?status= & ?supplierId=)
router.get("/", getMatches);

// PATCH  /api/matching/:id/status    → Update match status (APPROVED / REJECTED)
router.patch("/:id/status", updateMatchStatus);

export default router;
