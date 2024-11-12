import { makeExecutableSchema } from '@graphql-tools/schema';
import { authTypeDefs, authResolvers } from '../../modules/auth/index.js';
import { productTypeDefs, productResolvers } from '../../modules/product/index.js';
import { orderTypeDefs, orderResolvers } from '../../modules/order/index.js';
import { collectionTypeDefs, collectionResolvers } from '../../modules/collection/index.js';
import { mediaTypeDefs, mediaResolvers } from '../../modules/media/index.js';
import { userTypeDefs, userResolvers } from '../../modules/user/index.js';
import { rbacTypeDefs, rbacResolvers } from '../../modules/auth/rbac/index.js';

const rootTypeDefs = `
  scalar JSON
  scalar Date
  scalar Upload

  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }
`;

export const schema = makeExecutableSchema({
  typeDefs: [
    rootTypeDefs,
    authTypeDefs,
    productTypeDefs,
    orderTypeDefs,
    collectionTypeDefs,
    mediaTypeDefs,
    userTypeDefs,
    rbacTypeDefs
  ],
  resolvers: [
    authResolvers,
    productResolvers,
    orderResolvers,
    collectionResolvers,
    mediaResolvers,
    userResolvers,
    rbacResolvers
  ]
});