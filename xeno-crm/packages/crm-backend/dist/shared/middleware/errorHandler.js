"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../errors");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, _next) => {
    if (err instanceof errors_1.AppError) {
        logger_1.logger.warn('Application error', {
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            path: req.path,
        });
        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                code: err.code,
            },
        });
        return;
    }
    logger_1.logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
    });
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
        },
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'ROUTE_NOT_FOUND',
        },
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map