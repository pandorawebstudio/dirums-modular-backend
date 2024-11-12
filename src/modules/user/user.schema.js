export const userTypeDefs = `
  type User {
    id: ID!
    phoneNumber: String
    email: String
    role: UserRole!
    name: String
    avatar: Media
    businessProfile: BusinessProfile
    documents: [BusinessDocument!]
    status: UserStatus!
    createdAt: String!
    updatedAt: String!
  }

  type BusinessProfile {
    name: String
    logo: Media
    banner: Media
    description: String
    address: String
    documents: [BusinessDocument!]
    status: BusinessStatus!
  }

  type BusinessDocument {
    id: ID!
    type: BusinessDocumentType!
    media: Media!
    verificationStatus: VerificationStatus!
  }

  enum UserRole {
    CUSTOMER
    VENDOR
    ADMIN
    STAFF
  }

  enum UserStatus {
    ACTIVE
    SUSPENDED
  }

  enum BusinessStatus {
    ACTIVE
    SUSPENDED
  }

  enum BusinessDocumentType {
    REGISTRATION
    TAX
    IDENTITY
    OTHER
  }

  enum VerificationStatus {
    PENDING
    VERIFIED
    REJECTED
  }

  input UpdateProfileInput {
    name: String
    email: String
    phoneNumber: String
  }

  input BusinessProfileInput {
    name: String
    logo: Upload
    banner: Upload
    description: String
    address: String
    documents: [BusinessDocumentInput!]
  }

  input BusinessDocumentInput {
    type: BusinessDocumentType!
    file: Upload!
  }

  extend type Query {
    me: User!
    user(id: ID!): User
    users(
      role: UserRole
      limit: Int = 20
      offset: Int = 0
    ): [User!]!
  }

  extend type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    updateAvatar(file: Upload!): Media!
    updateBusinessProfile(input: BusinessProfileInput!): User!
    updateUserRole(userId: ID!, role: UserRole!): User!
    deleteUser(id: ID!): Boolean!
  }
`;