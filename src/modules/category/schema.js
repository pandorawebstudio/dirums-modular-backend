export const categoryTypeDefs = `
  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    parent: Category
    ancestors: [Category!]
    children: [Category!]
    level: Int!
    status: CategoryStatus!
    attributes: [CategoryAttribute!]
    metadata: JSON
    image: Media
    createdAt: String!
    updatedAt: String!
  }

  type CategoryAttribute {
    name: String!
    description: String
    type: AttributeType!
    options: [String!]
    isRequired: Boolean!
    defaultValue: JSON
    validation: AttributeValidation
  }

  type AttributeValidation {
    min: Float
    max: Float
    pattern: String
    customValidator: String
  }

  enum CategoryStatus {
    ACTIVE
    INACTIVE
    ARCHIVED
  }

  enum AttributeType {
    TEXT
    NUMBER
    BOOLEAN
    DATE
    SELECT
  }

  input CreateCategoryInput {
    name: String!
    description: String
    parentId: ID
    attributes: [CategoryAttributeInput!]
    image: MediaInput
    status: CategoryStatus
  }

  input UpdateCategoryInput {
    name: String
    description: String
    parentId: ID
    attributes: [CategoryAttributeInput!]
    image: MediaInput
    status: CategoryStatus
  }

  input CategoryAttributeInput {
    name: String!
    description: String
    type: AttributeType!
    options: [String!]
    isRequired: Boolean
    defaultValue: JSON
    validation: AttributeValidationInput
  }

  input AttributeValidationInput {
    min: Float
    max: Float
    pattern: String
    customValidator: String
  }

  extend type Query {
    categories(
      parentId: ID
      status: CategoryStatus
      limit: Int
      offset: Int
    ): [Category!]!
    category(id: ID!): Category
    categoryBySlug(slug: String!): Category
    categoryTree: [Category!]!
  }

  extend type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
    addCategoryAttribute(categoryId: ID!, attribute: CategoryAttributeInput!): Category!
    updateCategoryAttribute(categoryId: ID!, attributeId: ID!, input: CategoryAttributeInput!): Category!
    removeCategoryAttribute(categoryId: ID!, attributeId: ID!): Category!
  }
`;