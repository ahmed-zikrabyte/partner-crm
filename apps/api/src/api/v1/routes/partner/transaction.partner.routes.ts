import express, { type NextFunction, type Request, type Response, type Router } from "express";
import TransactionController from "../../controllers/partner/transaction.partner.controller";

const transactionRouter: Router = express.Router();
const transactionController = new TransactionController();

// Create a new transaction
transactionRouter.post("/", (req: Request, res: Response, next: NextFunction) =>
  transactionController.create(req, res, next)
);

// Get all transactions (optional filters by vendor/type)
transactionRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  transactionController.getAll(req, res, next)
);

// Export transactions
transactionRouter.get("/export/all", (req: Request, res: Response, next: NextFunction) =>
  transactionController.exportTransactions(req, res, next)
);

// Get transaction by ID
transactionRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  transactionController.getById(req, res, next)
);

export default transactionRouter;
