import Joi from 'joi';

const variantSchema = Joi.object({
  sku: Joi.string().required(),
  name: Joi.string(),
  price: Joi.number().positive().required(),
  compareAtPrice: Joi.number().positive(),
  inventory: Joi.number().min(0).required(),
  attributes: Joi.object()
});

const productSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  categoryId: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  variants: Joi.array().items(variantSchema).min(1).required(),
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'ARCHIVED')
});

export async function validateProduct(data) {
  try {
    await productSchema.validateAsync(data, { abortEarly: false });
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
}