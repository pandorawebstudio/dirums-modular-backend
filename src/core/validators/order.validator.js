import Joi from 'joi';

const orderItemSchema = Joi.object({
  productId: Joi.string().required(),
  variantId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required()
});

const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  zipCode: Joi.string().required(),
  company: Joi.string(),
  vatNumber: Joi.string()
});

const orderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema,
  paymentMethod: Joi.string()
    .valid('CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY')
    .required(),
  currency: Joi.string().length(3).default('USD'),
  discountCodes: Joi.array().items(Joi.string()),
  notes: Joi.string()
});

export async function validateOrder(data) {
  try {
    await orderSchema.validateAsync(data, { abortEarly: false });
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`);
  }
}