// deno-lint-ignore-file no-explicit-any
import express from "npm:express@4.18.2";
import authRoutes from "./auth.route.ts";

const router = express.Router();

// deno-lint-ignore no-unused-vars
router.get('/status', (req: any, res: any) => res.send('OK'));

router.use('/auth', authRoutes);


export default router;