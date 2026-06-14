"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentService = void 0;
const segment_repository_1 = require("./segment.repository");
const ai_service_1 = require("./ai.service");
const errors_1 = require("../../shared/errors");
exports.segmentService = {
    async listSegments() {
        return segment_repository_1.segmentRepository.findAll();
    },
    async getSegment(id) {
        const segment = await segment_repository_1.segmentRepository.findById(id);
        if (!segment)
            throw new errors_1.NotFoundError('Segment');
        return segment;
    },
    async aiQuery(naturalLanguageQuery) {
        const parsed = await ai_service_1.aiService.parseSegmentQuery(naturalLanguageQuery);
        const { customers, count } = await segment_repository_1.segmentRepository.computeCustomers(parsed.filterJson);
        return {
            ...parsed,
            customerCount: count,
            customerSample: customers.slice(0, 10),
        };
    },
    async createSegment(data) {
        const { count } = await segment_repository_1.segmentRepository.computeCustomers(data.filter_json);
        return segment_repository_1.segmentRepository.create({ ...data, customer_count: count });
    },
    async getSegmentCustomers(id) {
        const segment = await segment_repository_1.segmentRepository.findById(id);
        if (!segment)
            throw new errors_1.NotFoundError('Segment');
        return segment_repository_1.segmentRepository.computeCustomers(segment.filter_json);
    },
};
//# sourceMappingURL=segment.service.js.map