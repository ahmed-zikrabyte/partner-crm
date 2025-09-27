import express, {
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";
import EmployeeController from "../../controllers/partner/employee.partner.controller";

const employeeRouter: Router = express.Router();
const employeeController = new EmployeeController();

employeeRouter.post("/", (req: Request, res: Response, next: NextFunction) =>
  employeeController.create(req, res)
);

employeeRouter.get("/", (req, res, next) =>
  employeeController.getAll(req, res)
);

employeeRouter.get("/:id", (req, res, next) =>
  employeeController.getById(req, res)
);

employeeRouter.patch("/:id", (req, res, next) =>
  employeeController.update(req, res)
);

employeeRouter.patch("/toggle/:id", (req, res, next) =>
  employeeController.toggleStatus(req, res)
);

employeeRouter.delete("/:id", (req, res, next) =>
  employeeController.delete(req, res)
);

export default employeeRouter;
