import { RBACService } from './rbac.service.js';
import { Role } from './role.model.js';
import { Permission } from './permission.model.js';

const rbacService = new RBACService();

export const rbacResolvers = {
  Query: {
    roles: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      return Role.find().populate('permissions parentRole');
    },

    role: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      return Role.findById(id).populate('permissions parentRole');
    },

    permissions: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      return Permission.find();
    },

    permission: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      return Permission.findById(id);
    },

    userPermissions: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return rbacService.getRolePermissions(auth.user.role);
    }
  },

  Mutation: {
    assignRole: async (_, { userId, roleName }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      return rbacService.assignRole(userId, roleName);
    },

    createRole: async (_, { input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      const role = new Role(input);
      await role.save();
      rbacService.clearCache();
      
      return role.populate('permissions parentRole');
    },

    updateRole: async (_, { id, input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      const role = await Role.findByIdAndUpdate(id, input, { new: true });
      rbacService.clearCache();
      
      return role.populate('permissions parentRole');
    },

    deleteRole: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      await Role.findByIdAndDelete(id);
      rbacService.clearCache();
      
      return true;
    },

    addPermissionToRole: async (_, { roleId, permissionId }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      const role = await Role.findById(roleId);
      if (!role.permissions.includes(permissionId)) {
        role.permissions.push(permissionId);
        await role.save();
        rbacService.clearCache();
      }
      
      return role.populate('permissions parentRole');
    },

    removePermissionFromRole: async (_, { roleId, permissionId }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        'MANAGE_SETTINGS'
      );
      if (!hasPermission) throw new Error('Not authorized');

      const role = await Role.findById(roleId);
      role.permissions = role.permissions.filter(
        p => !p.equals(permissionId)
      );
      await role.save();
      rbacService.clearCache();
      
      return role.populate('permissions parentRole');
    }
  }
};