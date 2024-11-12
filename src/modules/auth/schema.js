export const authTypeDefs = `
  type User {
    id: ID!
    phoneNumber: String
    email: String
    role: UserRole!
    name: String
    createdAt: String!
    updatedAt: String!
  }

  enum UserRole {
    CUSTOMER
    VENDOR
    ADMIN
    STAFF
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  input EmailLoginInput {
    email: String!
    password: String!
  }

  input VendorRegistrationInput {
    phoneNumber: String!
    businessName: String!
    businessAddress: String!
    businessType: String!
    taxId: String
  }

  type Mutation {
    requestPhoneOTP(phoneNumber: String!, provider: String): Boolean!
    verifyPhoneOTP(phoneNumber: String!, otp: String!): AuthResponse!
    loginWithEmail(input: EmailLoginInput!): AuthResponse!
    registerVendor(input: VendorRegistrationInput!): AuthResponse!
  }

  type Query {
    me: User!
  }
`;