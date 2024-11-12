import { MediaService } from './media.service.js';
import { PERMISSIONS } from '../auth/rbac/roles.js';

const mediaService = new MediaService();

export const mediaResolvers = {
  Query: {
    media: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return mediaService.getMedia(id, auth.user.id);
    },

    myMedia: async (_, { type, status, limit = 20, offset = 0 }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const query = { uploadedBy: auth.user.id };
      if (type) query.type = type;
      if (status) query.status = status;

      return MediaModel.find(query)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
    }
  },

  Mutation: {
    initiateUpload: async (_, { input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.CREATE_MEDIA
      );
      if (!hasPermission) throw new Error('Not authorized');

      return mediaService.initiateUpload(input, auth.user.id);
    },

    completeUpload: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return mediaService.completeUpload(id);
    },

    deleteMedia: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return mediaService.deleteMedia(id, auth.user.id);
    }
  }
};