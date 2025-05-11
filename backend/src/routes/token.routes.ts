// backend/src/routes/token.routes.ts
import { Router } from "express";
import tokenController from "../controllers/token.controller";

const router = Router();

// Token routes
router.get("/", tokenController.getTokenList);

export default router;
