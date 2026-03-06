import { env } from './config/env.config';
import { logger } from './config/logger';
import app from './app';

const PORT = env.PORT;

app.listen(PORT, () => {
    logger.info(`LoomiFlow Backend Service listening on port ${PORT}`);
});
