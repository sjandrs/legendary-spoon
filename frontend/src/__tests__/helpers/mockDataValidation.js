/**
 * Mock Data Consistency Validation
 * Ensures mock responses match actual API response schemas
 */

const API_SCHEMAS = {
  '/api/contacts/': {
    required: ['id', 'name', 'email'],
    optional: ['phone', 'company', 'created_at', 'updated_at'],
    types: {
      id: 'number',
      name: 'string',
      email: 'string',
      phone: 'string',
      company: 'string',
      created_at: 'string',
      updated_at: 'string'
    }
  },
  '/api/analytics/forecast/': {
    required: ['next_month', 'next_quarter', 'next_year', 'accuracy_metrics'],
    optional: ['forecast_period', 'predicted_revenue', 'confidence_interval'],
    types: {
      next_month: 'number',
      next_quarter: 'number',
      next_year: 'number',
      accuracy_metrics: 'object',
      forecast_period: 'string',
      predicted_revenue: 'number',
      confidence_interval: 'object'
    }
  },
  '/api/deals/': {
    required: ['id', 'title', 'amount', 'stage'],
    optional: ['probability', 'expected_close_date', 'contact', 'created_at', 'updated_at'],
    types: {
      id: 'number',
      title: 'string',
      amount: 'number',
      stage: 'string',
      probability: 'number',
      expected_close_date: 'string',
      contact: 'object'
    }
  },
  '/api/blog-posts/': {
    required: ['id', 'title', 'slug', 'content', 'status'],
    optional: ['author', 'tags', 'created_at', 'updated_at', 'published_at'],
    types: {
      id: 'number',
      title: 'string',
      slug: 'string',
      content: 'string',
      status: 'string',
      author: 'object',
      tags: 'array'
    }
  },
  '/api/pages/': {
    required: ['id', 'title', 'slug', 'content'],
    optional: ['meta_title', 'meta_description', 'is_published', 'created_at', 'updated_at'],
    types: {
      id: 'number',
      title: 'string',
      slug: 'string',
      content: 'string',
      meta_title: 'string',
      meta_description: 'string',
      is_published: 'boolean'
    }
  },
  '/api/notifications/': {
    required: ['id', 'type', 'title', 'message'],
    optional: ['is_read', 'created_at'],
    types: {
      id: 'number',
      type: 'string',
      title: 'string',
      message: 'string',
      is_read: 'boolean',
      created_at: 'string'
    }
  },
  '/api/warehouse-items/': {
    required: ['id', 'name', 'sku', 'quantity', 'minimum_stock', 'unit_cost'],
    optional: ['warehouse', 'total_value', 'status', 'created_at', 'updated_at'],
    types: {
      id: 'number',
      name: 'string',
      sku: 'string',
      quantity: 'number',
      minimum_stock: 'number',
      unit_cost: 'number',
      total_value: 'number',
      status: 'string'
    }
  },
  '/api/budgets/': {
    required: ['id', 'category', 'period_start', 'period_end', 'budgeted_amount'],
    optional: ['spent_amount', 'remaining_amount', 'notes', 'created_at', 'updated_at'],
    types: {
      id: 'number',
      category: 'string',
      period_start: 'string',
      period_end: 'string',
      budgeted_amount: 'number',
      spent_amount: 'number',
      remaining_amount: 'number'
    }
  }
};

/**
 * Validates mock data against API schema
 * @param {Object} mockData - The mock response data
 * @param {string} endpoint - The API endpoint path
 * @returns {Object} - Validation result with success flag and errors
 */
export const validateMockResponse = (mockData, endpoint) => {
  const schema = API_SCHEMAS[endpoint];
  const errors = [];

  if (!schema) {
    return {
      success: false,
      errors: [`No schema defined for endpoint: ${endpoint}`],
      warnings: []
    };
  }

  // Handle paginated responses
  const dataToValidate = mockData.results || [mockData];
  if (!Array.isArray(dataToValidate)) {
    return {
      success: false,
      errors: [`Expected array or paginated response for ${endpoint}`],
      warnings: []
    };
  }

  const warnings = [];

  dataToValidate.forEach((item, index) => {
    // Check required fields
    schema.required.forEach(field => {
      if (!(field in item)) {
        errors.push(`Missing required field '${field}' in item ${index} for ${endpoint}`);
      }
    });

    // Check field types
    Object.keys(item).forEach(field => {
      if (schema.types[field]) {
        const expectedType = schema.types[field];
        const actualType = Array.isArray(item[field]) ? 'array' : typeof item[field];

        if (actualType !== expectedType && item[field] !== null) {
          errors.push(
            `Field '${field}' in item ${index} for ${endpoint}: expected ${expectedType}, got ${actualType}`
          );
        }
      } else if (!schema.required.includes(field) && !schema.optional.includes(field)) {
        warnings.push(`Unexpected field '${field}' in item ${index} for ${endpoint}`);
      }
    });
  });

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates all mock handlers against their schemas
 * @param {Array} handlers - MSW handlers to validate
 * @returns {Object} - Overall validation result
 */
export const validateAllMockHandlers = (handlers) => {
  const results = {};
  const overallErrors = [];
  const overallWarnings = [];

  // This would need to be called in actual test execution context
  // where handlers are executed and responses captured
  console.warn('validateAllMockHandlers: Implementation requires test execution context');

  return {
    success: overallErrors.length === 0,
    errors: overallErrors,
    warnings: overallWarnings,
    results
  };
};

/**
 * Creates a mock data validator for specific endpoint
 * @param {string} endpoint - API endpoint path
 * @returns {Function} - Validator function for the endpoint
 */
export const createEndpointValidator = (endpoint) => {
  return (mockData) => validateMockResponse(mockData, endpoint);
};

/**
 * Test helper to assert mock data validity
 * @param {Object} mockData - Mock response data
 * @param {string} endpoint - API endpoint path
 */
export const assertMockDataValid = (mockData, endpoint) => {
  const validation = validateMockResponse(mockData, endpoint);

  if (!validation.success) {
    throw new Error(
      `Mock data validation failed for ${endpoint}:\n${validation.errors.join('\n')}`
    );
  }

  if (validation.warnings.length > 0) {
    console.warn(
      `Mock data warnings for ${endpoint}:\n${validation.warnings.join('\n')}`
    );
  }
};

/**
 * Validates common paginated response structure
 * @param {Object} response - Paginated API response
 * @param {string} endpoint - API endpoint path
 * @returns {Object} - Validation result
 */
export const validatePaginatedResponse = (response, endpoint) => {
  const errors = [];

  // Check required pagination fields
  const requiredFields = ['count', 'results'];
  requiredFields.forEach(field => {
    if (!(field in response)) {
      errors.push(`Missing required pagination field '${field}' for ${endpoint}`);
    }
  });

  // Validate results array
  if (response.results && !Array.isArray(response.results)) {
    errors.push(`'results' field must be an array for ${endpoint}`);
  }

  // Validate count
  if (response.count !== undefined && typeof response.count !== 'number') {
    errors.push(`'count' field must be a number for ${endpoint}`);
  }

  // Validate pagination consistency
  if (response.results && response.count !== undefined) {
    if (response.results.length > response.count) {
      errors.push(`Results array length (${response.results.length}) exceeds count (${response.count}) for ${endpoint}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings: []
  };
};

/**
 * Schema documentation for developers
 */
export const getSchemaDocumentation = () => {
  return {
    description: 'API Schema validation ensures mock responses match real API structure',
    endpoints: Object.keys(API_SCHEMAS),
    usage: `
      import { validateMockResponse, assertMockDataValid } from './mockDataValidation';

      // In tests:
      const mockData = { id: 1, name: 'Test Contact', email: 'test@example.com' };
      assertMockDataValid(mockData, '/api/contacts/');

      // Or:
      const validation = validateMockResponse(mockData, '/api/contacts/');
      if (!validation.success) {
        console.error(validation.errors);
      }
    `
  };
};
