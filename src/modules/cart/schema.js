export const cartTypeDefs = `
  type Cart {
    id: ID!
    user: User!
    items: [CartItem!]!
    appliedCoupons: [AppliedCoupon!]!
    metadata: CartMetadata!
    lastActivity: String!
    createdAt: String!
    updatedAt: String!
  }

  type CartItem {
    id: ID!
    product: Product!
    variant: ProductVariant!
    quantity: Int!
    price: Float!
    selectedOptions: JSON
    notes: String
  }

  type AppliedCoupon {
    code: String!
    discountAmount: Float!
    type: DiscountType!
  }

  type CartMetadata {
    subtotal: Float!
    discount: Float!
    total: Float!
  }

  input CartItemInput {
    productId: ID!
    variantId: ID!
    quantity: Int!
    selectedOptions: JSON
    notes: String
  }

  extend type Query {
    cart: Cart!
  }

  extend type Mutation {
    addToCart(item: CartItemInput!): Cart!
    updateCartItem(itemId: ID!, input: CartItemInput!): Cart!
    removeFromCart(itemId: ID!): Cart!
    clearCart: Cart!
    applyCoupon(code: String!): Cart!
    removeCoupon(code: String!): Cart!
  }
`;