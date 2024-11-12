export const swaggerOptions = {
  routePrefix: '/documentation',
  exposeRoute: true,
  swagger: {
    info: {
      title: 'Commerce Platform API',
      description: 'API documentation for the Commerce Platform',
      version: '1.0.0'
    },
    externalDocs: {
      url: 'https://github.com/your-repo',
      description: 'Find more info here'
    },
    host: 'localhost:3000',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      apiKey: {
        type: 'apiKey',
        name: 'apiKey',
        in: 'header'
      },
      bearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};