import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";
import CompanyAuthController from "../../controllers/partner/company.partner.controller";

const companyAuthRouter: Router = express.Router();
const companyAuthController = new CompanyAuthController();

companyAuthRouter.post("/", (req: Request, res: Response, next: NextFunction) =>
  companyAuthController.create(req, res, next)
);

companyAuthRouter.get("/", (req, res, next) =>
  companyAuthController.getAll(req, res, next)
);

companyAuthRouter.get("/:id", (req, res, next) =>
  companyAuthController.getById(req, res, next)
);

companyAuthRouter.patch("/:id", (req, res, next) =>
  companyAuthController.update(req, res, next)
);

companyAuthRouter.patch("/toggle/:id", (req, res, next) =>
  companyAuthController.toggleIsActive(req, res, next)
);

companyAuthRouter.delete("/:id", (req, res, next) =>
  companyAuthController.softDelete(req, res, next)
);

export default companyAuthRouter;
