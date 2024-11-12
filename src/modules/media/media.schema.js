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

  input InitiateUploadInput {
    fileName: String!
    mimeType: String!
    size: Int!
    isPublic: Boolean
  }

  type UploadResponse {
    media: Media!
    uploadUrl: String!
  }

  extend type Query {
    media(id: ID!): Media!
    myMedia(
      type: MediaType
      status: MediaStatus
      limit: Int
      offset: Int
    ): [Media!]!
  }

  extend type Mutation {
    initiateUpload(input: InitiateUploadInput!): UploadResponse!
    completeUpload(id: ID!): Media!
    deleteMedia(id: ID!): Boolean!
  }
`;