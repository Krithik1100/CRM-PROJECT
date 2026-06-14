import { segmentRepository } from './segment.repository';
import { aiService } from './ai.service';
import { NotFoundError } from '../../shared/errors';
import { FilterJson } from './filter.translator';

export const segmentService = {
  async listSegments() {
    return segmentRepository.findAll();
  },

  async getSegment(id: string) {
    const segment = await segmentRepository.findById(id);
    if (!segment) throw new NotFoundError('Segment');
    return segment;
  },

  async aiQuery(naturalLanguageQuery: string) {
    const parsed = await aiService.parseSegmentQuery(naturalLanguageQuery);
    const { customers, count } = await segmentRepository.computeCustomers(parsed.filterJson as FilterJson);
    return {
      ...parsed,
      customerCount: count,
      customerSample: customers.slice(0, 10),
    };
  },

  async createSegment(data: {
    name: string;
    description?: string;
    filter_json: FilterJson;
    ai_query?: string;
  }) {
    const { count } = await segmentRepository.computeCustomers(data.filter_json);
    return segmentRepository.create({ ...data, customer_count: count });
  },

  async getSegmentCustomers(id: string) {
    const segment = await segmentRepository.findById(id);
    if (!segment) throw new NotFoundError('Segment');
    return segmentRepository.computeCustomers(segment.filter_json);
  },
};
