import { CategoryService } from './category.service.js';
import { requirePermission } from '../auth/middleware/rbac.middleware.js';

const categoryService = new CategoryService();

export const categoryResolvers = {
  Query: {
    categories: async (_, { parentId, status, limit, offset }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return categoryService.findCategories({ parentId, status, limit, offset });
    },

    category: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return categoryService.findById(id);
    },

    categoryBySlug: async (_, { slug }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return categoryService.findBySlug(slug);
    },

    categoryTree: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return categoryService.getCategoryTree();
    }
  },

  Mutation: {
    createCategory: async (_, { input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      await requirePermission('MANAGE_CATEGORIES')(auth);
      return categoryService.createCategory(input);
    },

    updateCategory: async (_, { id, input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      await requirePermission('MANAGE_CATEGORIES')(auth);
      return categoryService.updateCategory(id, input);
    },

    deleteCategory: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      await requirePermission('MANAGE_CATEGORIES')(auth);
      return categoryService.deleteCategory(id);
    },

    addCategoryAttribute: async (_, { categoryId, attribute }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      await requirePermission('MANAGE_CATEGORIES')(auth);
      return categoryService.addAttribute(categoryId, attribute);
    },

    updateCategoryAttribute: async (_, { categoryId, attributeId, input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      await requirePermission('MANAGE_CATEGORIES')(auth);
      return categoryService.updateAttribute(categoryId, attributeId, input);
    },

    removeCategoryAttribute: async (_, { categoryId, attributeId }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      await requirePermission('MANAGE_CATEGORIES')(auth);
      return categoryService.removeAttribute(categoryId, attributeId);
    }
  },

  Category: {
    parent: async (category) => {
      if (!category.parent) return null;
      return categoryService.findById(category.parent);
    },

    ancestors: async (category) => {
      if (!category.ancestors?.length) return [];
      return Promise.all(
        category.ancestors.map(id => categoryService.findById(id))
      );
    },

    children: async (category) => {
      if (!category.children?.length) return [];
      return Promise.all(
        category.children.map(id => categoryService.findById(id))
      );
    },

    image: async (category, _, { dataSources }) => {
      if (!category.image) return null;
      return dataSources.media.findById(category.image);
    }
  }
};