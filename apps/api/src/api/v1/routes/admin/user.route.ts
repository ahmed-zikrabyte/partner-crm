import {Router} from "express";
import {protect} from "../../../../middleware/auth.middleware";
import {getUsers} from "../../controllers/admin/user.controller";

const router: Router = Router();

router.use(protect("admin"));

router.get("/", getUsers);

export default router;
