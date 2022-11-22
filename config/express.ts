import express from "npm:express@4.18.2";
import routes from '../routes/v1/index.ts';

const app = express();

app.use('/v1', routes);

export default app;