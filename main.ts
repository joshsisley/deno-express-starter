import app from './config/express.ts';
import * as mongoose from './config/mongoose.ts';
import config from './config/config.ts';

// Connect to MongoDB
mongoose.connect();

app.listen(config.port);