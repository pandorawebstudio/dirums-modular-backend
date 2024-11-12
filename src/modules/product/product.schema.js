export const productTypeDefs = `
  type ProductMedia {
    id: ID!
    media: Media!
    type: ProductMediaType!
    variantId: ID
    sortOrder: Int!
  }

  enum ProductMediaType {
    PRIMARY
    GALLERY
    VARIANT
  }

  input ProductMediaInput {
    file: Upload!
    type: ProductMediaType!
    variantId: ID
  }

  extend type Mutation {
    addProductMedia(
      productId: ID!
      files: [Upload!]!
      type: ProductMediaType
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