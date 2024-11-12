import { makeExecutableSchema } from '@graphql-tools/schema';
import { authTypeDefs } from '../modules/auth/schema.js';
import { authResolvers } from '../modules/auth/resolvers.js';
import { productTypeDefs } from '../modules/product/schema.js';
import { productResolvers } from '../modules/product/resolvers.js';
import { orderTypeDefs } from '../modules/order/schema.js';
import { orderResolvers } from '../modules/order/resolvers.js';

const rootTypeDefs = `
  scalar JSON
  scalar Date

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
    orderTypeDefs
  ],
  resolvers: [
    authResolvers,
    productResolvers,
    orderResolvers
  ]
});