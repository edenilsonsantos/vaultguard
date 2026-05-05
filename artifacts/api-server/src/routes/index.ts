import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import vaultRouter from "./vault";
import apiKeysRouter from "./apikeys";
import certificatesRouter from "./certificates";
import logsRouter from "./logs";
import settingsRouter from "./settings";
import swaggerRouter from "./swagger";

const router: IRouter = Router();

router.use(swaggerRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(vaultRouter);
router.use(apiKeysRouter);
router.use(certificatesRouter);
router.use(logsRouter);
router.use(settingsRouter);

export default router;
