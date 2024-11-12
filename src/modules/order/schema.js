export const orderTypeDefs = `
  type OrderItem {
    product: Product!
    variant: ProductVariant!
    quantity: Int!
    price: Float!
  }

  type ShippingAddress {
    street: String!
    city: String!
    state: String!
    country: String!
    zipCode: String!
  }

  type Order {
    id: ID!
    customer: User!
    items: [OrderItem!]!
    status: OrderStatus!
    shippingAddress: ShippingAddress!
    paymentStatus: PaymentStatus!
    subtotal: Float!
    tax: Float!
    shippingCost: Float!
    total: Float!
    paymentMethod: PaymentMethod!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
  }

  enum PaymentMethod {
    CREDIT_CARD
    BANK_TRANSFER
    CASH_ON_DELIVERY
  }

  input OrderItemInput {
    productId: ID!
    variantId: ID!
    quantity: Int!
  }

  input ShippingAddressInput {
    street: String!
    city: String!
    state: String!
    country: String!
    zipCode: String!
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
    shippingAddress: ShippingAddressInput!
    paymentMethod: PaymentMethod!
    notes: String
  }

  type Query {
    orders(
      limit: Int
      offset: Int
      status: OrderStatus
      customerId: ID
    ): [Order!]!
    order(id: ID!): Order
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    updatePaymentStatus(id: ID!, status: PaymentStatus!): Order!
    cancelOrder(id: ID!): Order!
  }
`;