export const rbacTypeDefs = `
  type Permission {
    id: ID!
    name: String!
    description: String
    scope: PermissionScope!
    createdAt: String!
    updatedAt: String!
  }

  type Role {
    id: ID!
    name: String!
    description: String
    permissions: [Permission!]!
    parentRole: Role
    scope: RoleScope!
    createdAt: String!
    updatedAt: String!
  }

  enum PermissionScope {
    GLOBAL
    ORGANIZATION
    TEAM
  }

  enum RoleScope {
    GLOBAL
    ORGANIZATION
    TEAM
  }

  extend type Query {
    roles: [Role!]!
    role(id: ID!): Role
    permissions: [Permission!]!
    permission(id: ID!): Permission
    userPermissions: [Permission!]!
  }

  extend type Mutation {
    assignRole(userId: ID!, roleName: String!): Boolean!
    createRole(input: CreateRoleInput!): Role!
    updateRole(id: ID!, input: UpdateRoleInput!): Role!
    deleteRole(id: ID!): Boolean!
    addPermissionToRole(roleId: ID!, permissionId: ID!): Role!
    removePermissionFromRole(roleId: ID!, permissionId: ID!): Role!
  }

  input CreateRoleInput {
    name: String!
    description: String
    permissions: [ID!]
    parentRole: ID
    scope: RoleScope
  }

  input UpdateRoleInput {
    name: String
    description: String
    permissions: [ID!]
    parentRole: ID
    scope: RoleScope
  }
`;