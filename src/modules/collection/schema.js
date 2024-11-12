export const collectionTypeDefs = `
  type Collection {
    id: ID!
    title: String!
    handle: String!
    description: String
    image: Media
    type: CollectionType!
    ruleGroups: [RuleGroup!]
    products: [Product!]
    sortOrder: SortOrder!
    isPublished: Boolean!
    publishedAt: String
    createdAt: String!
    updatedAt: String!
  }

  type RuleGroup {
    operator: LogicOperator!
    conditions: [Condition!]!
  }

  type Condition {
    field: ConditionField!
    operator: ConditionOperator!
    value: String!
  }

  type SortOrder {
    field: SortField!
    direction: SortDirection!
  }

  enum CollectionType {
    MANUAL
    AUTOMATIC
  }

  enum LogicOperator {
    AND
    OR
  }

  enum ConditionField {
    PRICE
    TITLE
    TAG
    VENDOR
    TYPE
    INVENTORY
    WEIGHT
  }

  enum ConditionOperator {
    EQUALS
    NOT_EQUALS
    GREATER_THAN
    LESS_THAN
    CONTAINS
    NOT_CONTAINS
    STARTS_WITH
    ENDS_WITH
  }

  enum SortField {
    TITLE
    CREATED_AT
    PRICE
    BEST_SELLING
    MANUAL
  }

  enum SortDirection {
    ASC
    DESC
  }

  input CreateCollectionInput {
    title: String!
    description: String
    image: MediaInput
    type: CollectionType!
    ruleGroups: [RuleGroupInput]
    products: [ID!]
    sortOrder: SortOrderInput
    isPublished: Boolean
  }

  input UpdateCollectionInput {
    title: String
    description: String
    image: MediaInput
    ruleGroups: [RuleGroupInput]
    products: [ID!]
    sortOrder: SortOrderInput
    isPublished: Boolean
  }

  input RuleGroupInput {
    operator: LogicOperator!
    conditions: [ConditionInput!]!
  }

  input ConditionInput {
    field: ConditionField!
    operator: ConditionOperator!
    value: String!
  }

  input SortOrderInput {
    field: SortField!
    direction: SortDirection!
  }

  input MediaInput {
    id: ID!
    alt: String
  }

  extend type Query {
    collections(
      limit: Int
      offset: Int
      published: Boolean
    ): [Collection!]!
    collection(id: ID!): Collection
    collectionByHandle(handle: String!): Collection
    collectionProducts(
      id: ID!
      limit: Int
      offset: Int
      sort: SortOrderInput
    ): [Product!]!
  }

  extend type Mutation {
    createCollection(input: CreateCollectionInput!): Collection!
    updateCollection(id: ID!, input: UpdateCollectionInput!): Collection!
    deleteCollection(id: ID!): Boolean!
    addProductToCollection(collectionId: ID!, productId: ID!): Collection!
    removeProductFromCollection(collectionId: ID!, productId: ID!): Collection!
    reorderCollectionProducts(collectionId: ID!, productIds: [ID!]!): Collection!
    publishCollection(id: ID!): Collection!
    unpublishCollection(id: ID!): Collection!
  }
`;