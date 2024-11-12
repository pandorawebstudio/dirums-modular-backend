export const productTypeDefs = `
  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    media: [Media!]
    category: Category
    tags: [String!]
    variants: [ProductVariant!]!
    status: ProductStatus!
    vendor: User!
    approval: ProductApproval
    revisions: [ProductRevision!]
    messages: [ProductMessage!]
    isPublished: Boolean!
    publishedAt: String
    requiresApproval: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type ProductVariant {
    id: ID!
    sku: String!
    name: String
    price: Float!
    compareAtPrice: Float
    inventory: Int!
    media: [Media!]
    attributes: JSON
  }

  type ProductRevision {
    id: ID!
    user: User!
    changes: [FieldChange!]!
    timestamp: String!
    comment: String
  }

  type FieldChange {
    field: String!
    oldValue: JSON
    newValue: JSON
  }

  type ProductApproval {
    status: ApprovalStatus!
    reviewer: User
    reviewedAt: String
    comment: String
    changes: [FieldChange!]
  }

  type ProductMessage {
    id: ID!
    user: User!
    content: String!
    timestamp: String!
    attachments: [MessageAttachment!]
  }

  type MessageAttachment {
    url: String!
    type: String!
    name: String!
  }

  enum ProductStatus {
    DRAFT
    PENDING_APPROVAL
    ACTIVE
    ARCHIVED
    REJECTED
  }

  enum ApprovalStatus {
    PENDING
    APPROVED
    REJECTED
  }

  input ProductInput {
    name: String!
    description: String
    categoryId: ID
    tags: [String!]
    variants: [ProductVariantInput!]!
    requiresApproval: Boolean
  }

  input ProductVariantInput {
    sku: String!
    name: String
    price: Float!
    compareAtPrice: Float
    inventory: Int!
    attributes: JSON
  }

  input ProductMessageInput {
    content: String!
    attachments: [MessageAttachmentInput!]
  }

  input MessageAttachmentInput {
    url: String!
    type: String!
    name: String!
  }

  extend type Query {
    products(
      status: ProductStatus
      vendorId: ID
      categoryId: ID
      search: String
      limit: Int = 20
      offset: Int = 0
    ): [Product!]!
    
    product(id: ID!): Product
    productBySlug(slug: String!): Product
    pendingApprovals(limit: Int, offset: Int): [Product!]!
    productApprovalHistory(id: ID!): Product!
  }

  extend type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    submitProductForApproval(
      productId: ID!
      comment: String
    ): Product!

    reviewProduct(
      productId: ID!
      decision: ApprovalStatus!
      comment: String!
    ): Product!

    addProductMessage(
      productId: ID!
      message: ProductMessageInput!
    ): ProductMessage!

    updateProductStatus(
      productId: ID!
      status: ProductStatus!
    ): Product!

    updateInventory(
      variantId: ID!
      quantity: Int!
    ): ProductVariant!

    addProductMedia(
      productId: ID!
      files: [Upload!]!
      type: MediaType
    ): [Media!]!

    addVariantMedia(
      productId: ID!
      variantId: ID!
      files: [Upload!]!
    ): [Media!]!

    removeProductMedia(
      productId: ID!
      mediaId: ID!
    ): Boolean!

    reorderProductMedia(
      productId: ID!
      mediaOrder: [ID!]!
    ): Product!
  }
`;