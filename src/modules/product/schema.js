export const productTypeDefs = `
  type Media {
    url: String!
    type: MediaType!
    alt: String
  }

  type ProductVariant {
    id: ID!
    sku: String!
    name: String
    price: Float!
    compareAtPrice: Float
    inventory: Int!
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

  enum MediaType {
    IMAGE
    VIDEO
  }

  input ProductInput {
    name: String!
    description: String
    categoryId: ID
    tags: [String!]
    variants: [ProductVariantInput!]!
    requiresApproval: Boolean
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
    pendingApprovals(limit: Int, offset: Int): [Product!]!
    productApprovalHistory(id: ID!): Product!
  }

  extend type Mutation {
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
  }
`;