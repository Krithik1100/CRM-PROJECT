import { ValidationError } from '../../shared/errors';

export interface FilterCondition {
  field: string;
  op: string;
  value: unknown;
  subquery?: boolean;
}

export interface FilterJson {
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

const ALLOWED_CUSTOMER_FIELDS = new Set([
  'total_spent', 'order_count', 'last_order_at', 'first_order_at',
  'tier', 'city', 'name',
]);

const SUBQUERY_FIELDS = new Set(['category', 'channel']);

const ALLOWED_OPS = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'days_ago_gte', 'days_ago_lte',
]);

/**
 * Translates AI-generated filter JSON into a safe parameterized SQL WHERE clause.
 * AI never directly generates SQL — this is the security boundary.
 */
export function filterJsonToSql(filterJson: FilterJson): { sql: string; params: unknown[] } {
  if (!filterJson || !Array.isArray(filterJson.conditions)) {
    return { sql: '1=1', params: [] };
  }

  const params: unknown[] = [];
  const clauses: string[] = [];

  for (const condition of filterJson.conditions) {
    const { field, op, value, subquery } = condition;

    if (!ALLOWED_OPS.has(op)) {
      throw new ValidationError(`Invalid filter operator: ${op}`);
    }

    if (subquery && SUBQUERY_FIELDS.has(field)) {
      // Subquery on orders table
      const { sql: subSql, params: subParams } = buildSubqueryClause(field, op, value, params.length);
      params.push(...subParams);
      clauses.push(subSql);
      continue;
    }

    if (!ALLOWED_CUSTOMER_FIELDS.has(field)) {
      throw new ValidationError(`Invalid filter field: ${field}`);
    }

    const { sql: clauseSql, params: clauseParams } = buildClause(field, op, value, params.length);
    params.push(...clauseParams);
    clauses.push(clauseSql);
  }

  if (clauses.length === 0) return { sql: '1=1', params: [] };

  const operator = filterJson.operator === 'OR' ? ' OR ' : ' AND ';
  return { sql: clauses.join(operator), params };
}

function buildClause(field: string, op: string, value: unknown, paramOffset: number): { sql: string; params: unknown[] } {
  const p = paramOffset + 1;

  if (op === 'days_ago_gte') {
    // last_order_at >= NOW() - INTERVAL 'N days'  => customer is active within N days
    return {
      sql: `${field} >= NOW() - INTERVAL '1 day' * $${p}`,
      params: [value],
    };
  }

  if (op === 'days_ago_lte') {
    // last_order_at <= NOW() - INTERVAL 'N days' => customer hasn't ordered in N days
    return {
      sql: `${field} <= NOW() - INTERVAL '1 day' * $${p}`,
      params: [value],
    };
  }

  if (op === 'in' && Array.isArray(value)) {
    const placeholders = value.map((_, i) => `$${paramOffset + i + 1}`).join(', ');
    return { sql: `${field} IN (${placeholders})`, params: value };
  }

  const opMap: Record<string, string> = {
    eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=',
  };
  return { sql: `${field} ${opMap[op]} $${p}`, params: [value] };
}

function buildSubqueryClause(field: string, op: string, value: unknown, paramOffset: number): { sql: string; params: unknown[] } {
  const p = paramOffset + 1;

  if (op === 'in' && Array.isArray(value)) {
    const placeholders = value.map((_, i) => `$${paramOffset + i + 1}`).join(', ');
    return {
      sql: `id IN (SELECT DISTINCT customer_id FROM orders WHERE ${field} IN (${placeholders}))`,
      params: value,
    };
  }

  return {
    sql: `id IN (SELECT DISTINCT customer_id FROM orders WHERE ${field} = $${p})`,
    params: [value],
  };
}
