export const userTypeDefs = `
  type BusinessProfile {
    name: String
    logo: Media
    banner: Media
    description: String
    address: String
    documents: [BusinessDocument!]
  }

  type BusinessDocument {
    id: ID!
    type: BusinessDocumentType!
    media: Media!
    verificationStatus: VerificationStatus!
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

  extend type Mutation {
    updateAvatar(file: Upload!): Media!
    updateBusinessProfile(input: BusinessProfileInput!): User!
  }
`;