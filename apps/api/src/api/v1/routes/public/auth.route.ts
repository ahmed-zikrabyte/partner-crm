import {Request, Response, NextFunction} from "express";
import {Router} from "express";
import {login, register} from "../../controllers/public/auth.controller";

const router: Router = Router();

router.post("/register", register);
router.post("/login", login);

export default router;
