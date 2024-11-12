import { CollectionService } from './collection.service.js';

const collectionService = new CollectionService();

export const collectionResolvers = {
  Query: {
    collections: async (_, { limit = 20, offset = 0, published }) => {
      const query = published !== undefined ? { isPublished: published } : {};
      return collectionService.find(query, { limit, offset });
    },

    collection: async (_, { id }) => {
      return collectionService.findById(id);
    },

    collectionByHandle: async (_, { handle }) => {
      return collectionService.findOne({ handle });
    },

    collectionProducts: async (_, { id, limit, offset, sort }) => {
      return collectionService.getCollectionProducts(id, { limit, offset, sort });
    }
  },

  Mutation: {
    createCollection: async (_, { input }) => {
      return collectionService.createCollection(input);
    },

    updateCollection: async (_, { id, input }) => {
      return collectionService.updateCollection(id, input);
    },

    deleteCollection: async (_, { id }) => {
      await collectionService.delete(id);
      return true;
    },

    addProductToCollection: async (_, { collectionId, productId }) => {
      return collectionService.addProductToCollection(collectionId, productId);
    },

    removeProductFromCollection: async (_, { collectionId, productId }) => {
      return collectionService.removeProductFromCollection(collectionId, productId);
    },

    reorderCollectionProducts: async (_, { collectionId, productIds }) => {
      return collectionService.reorderProducts(collectionId, productIds);
    },

    publishCollection: async (_, { id }) => {
      return collectionService.updateCollection(id, {
        isPublished: true,
        publishedAt: new Date()
      });
    },

    unpublishCollection: async (_, { id }) => {
      return collectionService.updateCollection(id, {
        isPublished: false,
        publishedAt: null
      });
    }
  }
};