import { UserService } from './user.service.js';
import { requirePermission } from '../auth/middleware/rbac.middleware.js';
import { logger } from '../../utils/logger.js';

const userService = new UserService();

export const userResolvers = {
  Query: {
    me: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return auth.user;
    },

    user: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('READ_USER')(auth);
      return userService.findById(id);
    },

    users: async (_, { role, limit = 20, offset = 0 }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('READ_USER')(auth);
      return userService.findUsers({ role, limit, offset });
    }
  },

  Mutation: {
    updateProfile: async (_, { input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return userService.updateProfile(auth.user.id, input);
    },

    updateAvatar: async (_, { file }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return userService.updateAvatar(auth.user.id, file);
    },

    updateBusinessProfile: async (_, { input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      if (auth.user.role !== 'VENDOR') {
        throw new Error('Only vendors can update business profile');
      }

      return userService.updateBusinessProfile(auth.user.id, input);
    },

    updateUserRole: async (_, { userId, role }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('UPDATE_USER')(auth);
      return userService.updateRole(userId, role);
    },

    deleteUser: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('DELETE_USER')(auth);
      return userService.deleteUser(id);
    }
  },

  User: {
    // Field resolvers
    avatar: async (user) => {
      if (!user.avatar) return null;
      return userService.getMediaUrl(user.avatar);
    },

    businessProfile: async (user) => {
      if (!user.businessProfile) return null;
      
      // Resolve media URLs for logo and banner
      const profile = { ...user.businessProfile };
      
      if (profile.logo) {
        profile.logo = await userService.getMediaUrl(profile.logo);
      }
      if (profile.banner) {
        profile.banner = await userService.getMediaUrl(profile.banner);
      }
      
      return profile;
    },

    documents: async (user, _, { auth }) => {
      // Only return documents if user is viewing their own profile or is admin
      if (auth.user.id !== user.id && auth.user.role !== 'ADMIN') {
        return null;
      }

      if (!user.businessProfile?.documents) return [];

      return Promise.all(
        user.businessProfile.documents.map(async (doc) => ({
          ...doc,
          media: await userService.getMediaUrl(doc.media)
        }))
      );
    }
  }
};