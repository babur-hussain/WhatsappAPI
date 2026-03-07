import { env } from './config/env.config';
import { logger } from './config/logger';
import { httpServer } from './app';

const PORT = env.PORT;

httpServer.listen(PORT, () => {
    logger.info(`LoomiFlow Backend Service listening on port ${PORT}`);
});

