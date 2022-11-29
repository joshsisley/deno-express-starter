// deno-lint-ignore-file no-explicit-any
import express from "npm:express@4.18.2";

const router = express.Router();

router.get('/status', (req: any, res: any) => res.send('OK'));


export default router;