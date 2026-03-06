import winston from 'winston';
import { env } from './env.config';
import * as path from 'path';
import * as fs from 'fs';

// Ensure logs directory exists
const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Define specific log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

winston.addColors(colors);

// Set global log level based on environment
const level = () => {
    return env.isDev ? 'debug' : 'info';
};

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
    )
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    format
);

const transports = [
    new winston.transports.Console({
        format: consoleFormat,
    }),
    new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(winston.format.uncolorize(), format)
    }),
    new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: winston.format.combine(winston.format.uncolorize(), format)
    }),
];

export const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
});
