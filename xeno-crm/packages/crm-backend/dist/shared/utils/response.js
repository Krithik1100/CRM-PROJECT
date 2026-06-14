"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200, meta) => {
    res.status(statusCode).json({
        success: true,
        data,
        ...(meta && { meta }),
    });
};
exports.sendSuccess = sendSuccess;
const sendPaginated = (res, data, total, page, limit) => {
    res.status(200).json({
        success: true,
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=response.js.map