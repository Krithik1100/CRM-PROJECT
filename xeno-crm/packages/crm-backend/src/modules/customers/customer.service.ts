import { customerRepository } from './customer.repository';
import { seedDatabase } from './customer.seeder';
import { CustomerListQuery } from './customer.types';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';

export const customerService = {
  async listCustomers(query: CustomerListQuery) {
    return customerRepository.findAll(query);
  },

  async getCustomer(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new NotFoundError('Customer');

    const orders = await customerRepository.findOrdersByCustomerId(id);
    return { ...customer, orders };
  },

  async getStats() {
    return customerRepository.getStats();
  },

  async seedData(count = 30) {
    const seedCount = Math.min(Math.max(Number(count) || 30, 10), 40);
    logger.info(`Resetting existing demo data and seeding cafe dataset with ${seedCount} customers`);
    await customerRepository.resetDemoData();
    await seedDatabase(seedCount);
    return { seeded: true, reset: true, dataset: 'cafe', count: seedCount };
  },
};
