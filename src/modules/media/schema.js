export const mediaTypeDefs = `
  type Media {
    id: ID!
    key: String!
    originalName: String!
    mimeType: String!
    size: Int!
    type: MediaType!
    url: String
    metadata: MediaMetadata
    status: MediaStatus!
    error: String
    uploadedBy: User!
    isPublic: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type MediaMetadata {
    width: Int
    height: Int
    duration: Float
    thumbnails: [Thumbnail!]
  }

  type Thumbnail {
    key: String!
    url: String
    width: Int!
    height: Int!
  }

  enum MediaType {
    IMAGE
    VIDEO
    DOCUMENT
  }

  enum MediaStatus {
    PENDING
    PROCESSING
    READY
    ERROR
  }

  input MediaUploadInput {
    file: Upload!
    type: MediaType!
    isPublic: Boolean
  }

  input MediaUpdateInput {
    originalName: String
    isPublic: Boolean
    metadata: JSON
  }

  extend type Query {
    media(id: ID!): Media!
    myMedia(
      type: MediaType
      status: MediaStatus
      limit: Int = 20
      offset: Int = 0
    ): [Media!]!
  }

  extend type Mutation {
    uploadMedia(input: MediaUploadInput!): Media!
    updateMedia(id: ID!, input: MediaUpdateInput!): Media!
    deleteMedia(id: ID!): Boolean!
    generateUploadUrl(
      fileName: String!
      mimeType: String!
      size: Int!
      isPublic: Boolean
    ): UploadUrlResponse!
  }

  type UploadUrlResponse {
    uploadUrl: String!
    key: String!
    expiresIn: Int!
  }
`;