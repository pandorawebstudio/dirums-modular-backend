import { configureAuthModule } from './auth/index.js';
import { configureProductModule } from './product/index.js';
import { configureOrderModule } from './order/index.js';

export async function configureModules(fastify) {
  await configureAuthModule(fastify);
  await configureProductModule(fastify);
  await configureOrderModule(fastify);
}