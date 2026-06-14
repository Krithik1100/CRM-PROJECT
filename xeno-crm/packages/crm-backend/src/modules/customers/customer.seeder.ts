import { v4 as uuidv4 } from 'uuid';
import { customerRepository } from './customer.repository';
import { logger } from '../../shared/utils/logger';

const FIRST_NAMES = ['Aarav', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Neha', 'Arjun', 'Sanya', 
  'Kiran', 'Meera', 'Rohan', 'Divya', 'Aditya', 'Pooja', 'Shreya', 'Kabir', 'Ishaan', 
  'Tara', 'Riya', 'Dev', 'Nisha', 'Arnav', 'Kritika', 'Varun', 'Simran'];

const LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Mehta', 'Joshi', 'Gupta', 'Shah', 
  'Verma', 'Nair', 'Iyer', 'Reddy', 'Kapoor', 'Malhotra', 'Chopra', 'Bose', 'Roy', 'Das'];

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 
  'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal'];

const CATEGORIES = ['Hot Coffee', 'Cold Coffee', 'Pastries', 'Beans', 'Merchandise',
  'Breakfast', 'Desserts', 'Subscriptions', 'Gift Cards'];

const PRODUCTS: Record<string, string[]> = {
  'Hot Coffee': ['Cappuccino', 'Latte', 'Americano', 'Mocha', 'Flat White'],
  'Cold Coffee': ['Cold Brew', 'Iced Latte', 'Frappe', 'Iced Mocha', 'Nitro Cold Brew'],
  'Pastries': ['Butter Croissant', 'Blueberry Muffin', 'Cinnamon Roll', 'Banana Bread', 'Chocolate Danish'],
  'Beans': ['House Blend Beans', 'Single Origin Beans', 'Espresso Roast', 'French Roast', 'Filter Coffee Pack'],
  'Merchandise': ['Travel Mug', 'Ceramic Mug', 'Coffee Tumbler', 'Reusable Cup', 'Brew Kit'],
  'Breakfast': ['Bagel Sandwich', 'Avocado Toast', 'Granola Bowl', 'Egg Wrap', 'Waffle'],
  'Desserts': ['Tiramisu Cup', 'Brownie', 'Cheesecake Slice', 'Cookie Box', 'Affogato'],
  'Subscriptions': ['Monthly Coffee Plan', 'Weekly Beans Plan', 'Office Coffee Plan', 'Cold Brew Pack', 'Cafe Rewards Plan'],
  'Gift Cards': ['INR 500 Gift Card', 'INR 1000 Gift Card', 'Birthday Coffee Card', 'Weekend Treat Card', 'Corporate Gift Card'],
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function seedDatabase(customerCount = 500): Promise<void> {
  logger.info(`Seeding database with ${customerCount} customers...`);

  const now = new Date();
  const oneYearAgo = daysAgo(365);

  for (let i = 0; i < customerCount; i++) {
    const firstName = randomFrom(FIRST_NAMES);
    const lastName = randomFrom(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(10, 999)}`;
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

    const customer = await customerRepository.insertCustomer({
      external_id: `EXT-${uuidv4().slice(0, 8).toUpperCase()}`,
      name,
      email: `${emailPrefix}@${randomFrom(domains)}`,
      phone: `+91${randomInt(7000000000, 9999999999)}`,
      city: randomFrom(CITIES),
      tier: 'bronze',
      first_order_at: undefined,
      last_order_at: undefined,
    });

    // Generate 1-8 orders per customer, distributed realistically
    const orderCount = randomInt(1, 8);
    const orderDates: Date[] = [];
    
    for (let j = 0; j < orderCount; j++) {
      // Bias: some customers ordered recently, some are lapsed
      const isLapsed = Math.random() < 0.3;
      const orderDate = isLapsed
        ? randomDateBetween(oneYearAgo, daysAgo(60))
        : randomDateBetween(daysAgo(60), now);
      orderDates.push(orderDate);
    }
    
    orderDates.sort((a, b) => a.getTime() - b.getTime());

    for (let j = 0; j < orderCount; j++) {
      const category = randomFrom(CATEGORIES);
      const products = PRODUCTS[category];
      const productName = randomFrom(products);
      const qty = randomInt(1, 3);
      const unitPrice = randomInt(99, 1299);

      await customerRepository.insertOrder({
        customer_id: customer.id,
        order_number: `ORD-${Date.now()}-${randomInt(1000, 9999)}`,
        amount: qty * unitPrice,
        status: 'completed',
        channel: Math.random() > 0.4 ? 'online' : 'offline',
        category,
        items: [{ name: productName, qty, unit_price: unitPrice }],
        ordered_at: orderDates[j].toISOString(),
      });
    }
  }

  logger.info(`✅ Seeded ${customerCount} customers with realistic order history`);
}
