import { Role } from './role.model.js';
import { Permission } from './permission.model.js';
import { ROLES, ROLE_HIERARCHY, PERMISSIONS, ROLE_PERMISSIONS } from './roles.js';
import { logger } from '../../../utils/logger.js';

export class RBACService {
  constructor() {
    this.roleCache = new Map();
    this.permissionCache = new Map();
  }

  async initialize() {
    try {
      // Create permissions
      for (const [key, value] of Object.entries(PERMISSIONS)) {
        await Permission.findOneAndUpdate(
          { name: value },
          { 
            name: value,
            description: `Permission to ${key.toLowerCase().replace(/_/g, ' ')}`
          },
          { upsert: true }
        );
      }

      // Create roles with permissions
      for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
        const permissionDocs = await Permission.find({ name: { $in: permissions } });
        
        await Role.findOneAndUpdate(
          { name: role },
          {
            name: role,
            permissions: permissionDocs.map(p => p._id),
            description: `${role.charAt(0) + role.slice(1).toLowerCase()} role`
          },
          { upsert: true }
        );
      }

      // Set up role hierarchy
      for (const [role, inheritedRoles] of Object.entries(ROLE_HIERARCHY)) {
        const parentRole = await Role.findOne({ name: role });
        
        for (const inheritedRole of inheritedRoles) {
          await Role.findOneAndUpdate(
            { name: inheritedRole },
            { parentRole: parentRole._id }
          );
        }
      }
    } catch (error) {
      logger.error(`RBAC initialization error: ${error.message}`);
      throw error;
    }
  }

  async hasPermission(user, requiredPermission) {
    try {
      const role = await this.getRoleFromCache(user.role);
      if (!role) return false;

      // Check direct permissions
      const hasDirectPermission = await role.hasPermission(requiredPermission);
      if (hasDirectPermission) return true;

      // Check inherited permissions through role hierarchy
      const parentRole = await Role.findById(role.parentRole);
      if (!parentRole) return false;

      return parentRole.hasPermission(requiredPermission);
    } catch (error) {
      logger.error(`Permission check error: ${error.message}`);
      return false;
    }
  }

  async getRoleFromCache(roleName) {
    if (this.roleCache.has(roleName)) {
      return this.roleCache.get(roleName);
    }

    const role = await Role.findOne({ name: roleName }).populate('permissions');
    if (role) {
      this.roleCache.set(roleName, role);
    }

    return role;
  }

  async getPermissionFromCache(permissionName) {
    if (this.permissionCache.has(permissionName)) {
      return this.permissionCache.get(permissionName);
    }

    const permission = await Permission.findOne({ name: permissionName });
    if (permission) {
      this.permissionCache.set(permissionName, permission);
    }

    return permission;
  }

  async assignRole(userId, roleName) {
    try {
      const role = await this.getRoleFromCache(roleName);
      if (!role) throw new Error(`Role ${roleName} not found`);

      await User.findByIdAndUpdate(userId, { role: roleName });
      return true;
    } catch (error) {
      logger.error(`Role assignment error: ${error.message}`);
      throw error;
    }
  }

  async getRolePermissions(roleName) {
    try {
      const role = await this.getRoleFromCache(roleName);
      if (!role) throw new Error(`Role ${roleName} not found`);

      await role.populate('permissions');
      return role.permissions.map(p => p.name);
    } catch (error) {
      logger.error(`Get role permissions error: ${error.message}`);
      throw error;
    }
  }

  clearCache() {
    this.roleCache.clear();
    this.permissionCache.clear();
  }
}