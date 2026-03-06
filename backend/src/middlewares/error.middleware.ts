import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Custom API error definition
export class APIError extends Error {
    public statusCode: number;
    public errorCode?: string;

    constructor(message: string, statusCode: number = 500, errorCode?: string) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

// Global Error Handler Middleware
export const globalErrorHandler = (
    err: Error | APIError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_ERROR';

    if (err instanceof APIError) {
        statusCode = err.statusCode;
        message = err.message;
        errorCode = err.errorCode || 'API_ERROR';
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
        errorCode = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Authentication required';
        errorCode = 'UNAUTHORIZED';
    }

    // Log the error
    const errorLog = {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    };

    if (statusCode >= 500) {
        logger.error(`[${errorCode}] ${req.method} ${req.path}`, errorLog);
    } else {
        logger.warn(`[${errorCode}] ${req.method} ${req.path}`, errorLog);
    }

    // Send formatted JSON response (safeguard internal error messages to users)
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message: statusCode >= 500 && process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Please try again later.'
                : message,
        }
    });
};
