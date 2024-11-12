import Joi from 'joi';
import { logger } from '../utils/logger.js';

export function validateRequest(schema) {
  return async (request, reply) => {
    try {
      const validationSchema = Joi.object(schema);
      
      const toValidate = {};
      if (schema.body) toValidate.body = request.body;
      if (schema.query) toValidate.query = request.query;
      if (schema.params) toValidate.params = request.params;

      const { error } = validationSchema.validate(toValidate, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        reply.code(400).send({
          error: 'Validation Error',
          details: errors
        });
        return;
      }
    } catch (error) {
      logger.error(`Request validation error: ${error.message}`);
      reply.code(500).send({ error: 'Validation processing error' });
    }
  };
}