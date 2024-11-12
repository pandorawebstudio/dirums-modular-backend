import Joi from 'joi';

export const validators = {
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  pagination: {
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }
};

export function validateSchema(schema) {
  return async (request, reply) => {
    try {
      const value = await schema.validateAsync(request.body, {
        abortEarly: false,
        stripUnknown: true
      });
      request.body = value;
    } catch (error) {
      reply.code(400).send({
        error: 'Validation Error',
        details: error.details.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
}