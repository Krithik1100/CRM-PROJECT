"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentController = void 0;
const segment_service_1 = require("./segment.service");
const response_1 = require("../../shared/utils/response");
exports.segmentController = {
    async list(req, res, next) {
        try {
            const segments = await segment_service_1.segmentService.listSegments();
            (0, response_1.sendSuccess)(res, segments);
        }
        catch (err) {
            next(err);
        }
    },
    async getOne(req, res, next) {
        try {
            const segment = await segment_service_1.segmentService.getSegment(req.params.id);
            (0, response_1.sendSuccess)(res, segment);
        }
        catch (err) {
            next(err);
        }
    },
    async aiQuery(req, res, next) {
        try {
            const { query } = req.body;
            const result = await segment_service_1.segmentService.aiQuery(query);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    },
    async create(req, res, next) {
        try {
            const segment = await segment_service_1.segmentService.createSegment(req.body);
            (0, response_1.sendSuccess)(res, segment, 201);
        }
        catch (err) {
            next(err);
        }
    },
    async getCustomers(req, res, next) {
        try {
            const result = await segment_service_1.segmentService.getSegmentCustomers(req.params.id);
            (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=segment.controller.js.map