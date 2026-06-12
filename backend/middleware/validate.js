const { z } = require('zod');

/**
 * Validation Middleware Wrapper
 * Validates request components against a Zod schema
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => {
        // Strip the parent path prefix ("body", "query", etc.) for clean API responses
        const cleanPath = err.path.slice(1).join('.');
        return {
          field: cleanPath || err.path[0],
          message: err.message
        };
      });

      return res.status(400).json({
        success: false,
        message: 'Request Validation Failed',
        errors: formattedErrors
      });
    }
    next(error);
  }
};

// -----------------------------------------------------------------
// SCHEMA DEFINITIONS
// -----------------------------------------------------------------

// MongoDB Hex ObjectId regex check
const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const zMongoId = z.string().regex(mongoIdRegex, { message: 'Invalid MongoDB ObjectId format' });

// pipeline status enum
const statusEnum = z.enum(['New', 'Contacted', 'Follow Up', 'Interested', 'Closed', 'Rejected'], {
  errorMap: () => ({ message: 'Status must be one of: New, Contacted, Follow Up, Interested, Closed, Rejected' })
});

// 1. Search Query Schema
const searchSchema = z.object({
  body: z.object({
    businessType: z.string({ required_error: 'Business Type is required' })
      .trim()
      .min(2, { message: 'Business Type must be at least 2 characters' })
      .max(100, { message: 'Business Type cannot exceed 100 characters' }),
    location: z.string({ required_error: 'Location is required' })
      .trim()
      .min(2, { message: 'Location must be at least 2 characters' })
      .max(100, { message: 'Location cannot exceed 100 characters' }),
    limit: z.preprocess((val) => (val === undefined ? undefined : Number(val)), z.number().int().min(1).max(200)).optional()
  })
});

// 2. Single Lead Status Update Schema
const statusUpdateSchema = z.object({
  params: z.object({
    id: zMongoId
  }),
  body: z.object({
    status: statusEnum
  })
});

// 3. Single Note Log Schema
const noteSchema = z.object({
  params: z.object({
    id: zMongoId
  }),
  body: z.object({
    content: z.string({ required_error: 'Note content is required' })
      .trim()
      .min(1, { message: 'Note content cannot be empty' })
      .max(1000, { message: 'Note content cannot exceed 1000 characters' })
  })
});

// 4. Bulk Status Update Schema
const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(zMongoId, { required_error: 'An array of lead IDs is required' })
      .min(1, { message: 'Must select at least 1 lead to perform bulk status update' }),
    status: statusEnum
  })
});

// 5. Bulk Note Log Schema
const bulkNoteSchema = z.object({
  body: z.object({
    ids: z.array(zMongoId, { required_error: 'An array of lead IDs is required' })
      .min(1, { message: 'Must select at least 1 lead to perform bulk note log' }),
    content: z.string({ required_error: 'Note content is required' })
      .trim()
      .min(1, { message: 'Note content cannot be empty' })
      .max(1000, { message: 'Note content cannot exceed 1000 characters' })
  })
});

// 6. Bulk Delete Schema
const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(zMongoId, { required_error: 'An array of lead IDs is required' })
      .min(1, { message: 'Must select at least 1 lead to perform bulk deletion' })
  })
});

// 7. Lead Param ID Schema (Common Lead Details/Delete checks)
const idParamSchema = z.object({
  params: z.object({
    id: zMongoId
  })
});

// 8. Lead Pitch Update Schema
const pitchUpdateSchema = z.object({
  params: z.object({
    id: zMongoId
  }),
  body: z.object({
    customPitch: z.string({ required_error: 'Custom pitch content is required' })
      .trim()
      .max(5000, { message: 'Custom pitch cannot exceed 5000 characters' })
  })
});

module.exports = {
  validate,
  searchSchema,
  statusUpdateSchema,
  noteSchema,
  bulkStatusSchema,
  bulkNoteSchema,
  bulkDeleteSchema,
  idParamSchema,
  pitchUpdateSchema
};
