export const pricingTypeDefs = `
  type ExchangeRate {
    id: ID!
    baseCurrency: String!
    targetCurrency: String!
    rate: Float!
    lastUpdated: String!
  }

  type Discount {
    id: ID!
    code: String
    type: DiscountType!
    value: Float!
    minPurchase: Float
    maxDiscount: Float
    startDate: String
    endDate: String
    usageLimit: Int
    usageCount: Int
    conditions: DiscountConditions
    status: DiscountStatus!
    createdAt: String!
    updatedAt: String!
  }

  type DiscountConditions {
    categories: [Category!]
    products: [Product!]
    customerGroups: [String!]
    buyQuantity: Int
    getQuantity: Int
    targetProduct: Product
  }

  enum DiscountType {
    PERCENTAGE
    FIXED
    BUY_X_GET_Y
  }

  enum DiscountStatus {
    ACTIVE
    INACTIVE
    EXPIRED
  }

  input CreateDiscountInput {
    code: String
    type: DiscountType!
    value: Float!
    minPurchase: Float
    maxDiscount: Float
    startDate: String
    endDate: String
    usageLimit: Int
    conditions: DiscountConditionsInput
  }

  input DiscountConditionsInput {
    categories: [ID!]
    products: [ID!]
    customerGroups: [String!]
    buyQuantity: Int
    getQuantity: Int
    targetProduct: ID
  }

  input UpdateDiscountInput {
    code: String
    type: DiscountType
    value: Float
    minPurchase: Float
    maxDiscount: Float
    startDate: String
    endDate: String
    usageLimit: Int
    conditions: DiscountConditionsInput
    status: DiscountStatus
  }

  extend type Query {
    discounts(
      status: DiscountStatus
      limit: Int = 20
      offset: Int = 0
    ): [Discount!]!
    
    discount(id: ID!): Discount
    
    validateDiscount(
      code: String!
      items: [CartItemInput!]!
    ): DiscountValidation!
    
    exchangeRate(
      fromCurrency: String!
      toCurrency: String!
    ): ExchangeRate!
  }

  extend type Mutation {
    createDiscount(input: CreateDiscountInput!): Discount!
    updateDiscount(id: ID!, input: UpdateDiscountInput!): Discount!
    deleteDiscount(id: ID!): Boolean!
    applyDiscount(code: String!): Cart!
    removeDiscount(code: String!): Cart!
  }

  type DiscountValidation {
    isValid: Boolean!
    discount: Discount
    error: String
  }
`;