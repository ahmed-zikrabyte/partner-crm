import {Router} from "express";
import authRouter from './routes/public/auth.route';
import userRouter from './routes/admin/user.route';
import profileRouter from './routes/client/profile.route';

const mainRouter: Router = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/admin/users', userRouter);
mainRouter.use('/client/profile', profileRouter);

export default mainRouter;
