import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  catalogResolvers,
  catalogTypeDefs
} from '../../domains/catalog';
import {
  orderResolvers,
  orderTypeDefs
} from '../../domains/order';
import {
  userResolvers,
  userTypeDefs
} from '../../domains/user';

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
    catalogTypeDefs,
    orderTypeDefs,
    userTypeDefs
  ],
  resolvers: [
    catalogResolvers,
    orderResolvers,
    userResolvers
  ]
});