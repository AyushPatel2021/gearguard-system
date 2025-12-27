import { z } from 'zod';
import { 
  insertUserSchema, 
  insertDepartmentSchema,
  insertCategorySchema,
  insertTeamSchema,
  insertEquipmentSchema,
  insertRequestSchema,
  users,
  departments,
  categories,
  teams,
  equipment,
  maintenanceRequests,
  activityLogs
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string()
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() })
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void()
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.void()
      }
    }
  },
  departments: {
    list: {
      method: 'GET' as const,
      path: '/api/departments',
      responses: { 200: z.array(z.custom<typeof departments.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/departments',
      input: insertDepartmentSchema,
      responses: { 201: z.custom<typeof departments.$inferSelect>() }
    }
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: { 200: z.array(z.custom<typeof categories.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories',
      input: insertCategorySchema,
      responses: { 201: z.custom<typeof categories.$inferSelect>() }
    }
  },
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/teams',
      responses: { 200: z.array(z.custom<typeof teams.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/teams',
      input: insertTeamSchema,
      responses: { 201: z.custom<typeof teams.$inferSelect>() }
    }
  },
  equipment: {
    list: {
      method: 'GET' as const,
      path: '/api/equipment',
      responses: { 200: z.array(z.custom<typeof equipment.$inferSelect>()) }
    },
    get: {
      method: 'GET' as const,
      path: '/api/equipment/:id',
      responses: { 
        200: z.custom<typeof equipment.$inferSelect>(),
        404: errorSchemas.notFound 
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/equipment',
      input: insertEquipmentSchema,
      responses: { 201: z.custom<typeof equipment.$inferSelect>() }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/equipment/:id',
      input: insertEquipmentSchema.partial(),
      responses: { 
        200: z.custom<typeof equipment.$inferSelect>(),
        404: errorSchemas.notFound 
      }
    }
  },
  requests: {
    list: {
      method: 'GET' as const,
      path: '/api/requests',
      responses: { 200: z.array(z.custom<typeof maintenanceRequests.$inferSelect>()) }
    },
    get: {
      method: 'GET' as const,
      path: '/api/requests/:id',
      responses: { 
        200: z.custom<typeof maintenanceRequests.$inferSelect>(),
        404: errorSchemas.notFound 
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/requests',
      input: insertRequestSchema,
      responses: { 201: z.custom<typeof maintenanceRequests.$inferSelect>() }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/requests/:id',
      input: insertRequestSchema.partial(),
      responses: { 
        200: z.custom<typeof maintenanceRequests.$inferSelect>(),
        404: errorSchemas.notFound 
      }
    }
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      responses: { 200: z.array(z.custom<typeof activityLogs.$inferSelect>()) }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
