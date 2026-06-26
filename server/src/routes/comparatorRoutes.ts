import { Router } from "express";
import { comparatorController } from "../controllers/ComparatorController";
import { loadTestController } from "../controllers/LoadTestController";

const router = Router();

// Define the POST endpoint for the comparison
// We use .bind to ensure the 'this' context remains correct inside the controller class
router.post(
  "/compare",
  comparatorController.compare.bind(comparatorController),
);

router.post(
  "/load-test",
  loadTestController.run.bind(loadTestController),
);

export default router;
