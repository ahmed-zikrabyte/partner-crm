import {Router} from "express";
import {protect} from "../../../../middleware/auth.middleware";
import {getProfile} from "../../controllers/client/profile.controller";

const router: Router = Router();

router.use(protect("client"));

router.get("/", getProfile);

export default router;
