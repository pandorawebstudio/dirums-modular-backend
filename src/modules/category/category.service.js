import { CategoryModel } from './model.js';
import { logger } from '../../utils/logger.js';

export class CategoryService {
  async createCategory(data) {
    try {
      const { name, parent, ...rest } = data;
      
      const slug = this.generateSlug(name);
      const existingCategory = await CategoryModel.findOne({ slug });
      
      if (existingCategory) {
        throw new Error('Category with this name already exists');
      }

      let ancestors = [];
      let level = 0;

      if (parent) {
        const parentCategory = await CategoryModel.findById(parent);
        if (!parentCategory) {
          throw new Error('Parent category not found');
        }

        ancestors = [...parentCategory.ancestors, parent];
        level = parentCategory.level + 1;
      }

      const category = new CategoryModel({
        name,
        slug,
        parent,
        ancestors,
        level,
        ...rest
      });

      await category.save();

      // Update parent's children array
      if (parent) {
        await CategoryModel.findByIdAndUpdate(parent, {
          $push: { children: category._id }
        });
      }

      return category;
    } catch (error) {
      logger.error(`Create category error: ${error.message}`);
      throw error;
    }
  }

  async updateCategory(id, data) {
    try {
      const category = await CategoryModel.findById(id);
      if (!category) {
        throw new Error('Category not found');
      }

      if (data.name && data.name !== category.name) {
        const slug = this.generateSlug(data.name);
        const existingCategory = await CategoryModel.findOne({
          slug,
          _id: { $ne: id }
        });

        if (existingCategory) {
          throw new Error('Category with this name already exists');
        }

        data.slug = slug;
      }

      if (data.parent && data.parent !== category.parent?.toString()) {
        await this.updateCategoryHierarchy(category, data.parent);
      }

      Object.assign(category, data);
      await category.save();

      return category;
    } catch (error) {
      logger.error(`Update category error: ${error.message}`);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const category = await CategoryModel.findById(id);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if category has children
      if (category.children.length > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      // Remove category from parent's children array
      if (category.parent) {
        await CategoryModel.findByIdAndUpdate(category.parent, {
          $pull: { children: category._id }
        });
      }

      await category.remove();
      return true;
    } catch (error) {
      logger.error(`Delete category error: ${error.message}`);
      throw error;
    }
  }

  async updateCategoryHierarchy(category, newParentId) {
    try {
      const newParent = await CategoryModel.findById(newParentId);
      if (!newParent) {
        throw new Error('New parent category not found');
      }

      // Check for circular reference
      if (newParent.ancestors.includes(category._id)) {
        throw new Error('Circular reference detected');
      }

      // Remove from old parent's children
      if (category.parent) {
        await CategoryModel.findByIdAndUpdate(category.parent, {
          $pull: { children: category._id }
        });
      }

      // Update ancestors and level
      category.parent = newParentId;
      category.ancestors = [...newParent.ancestors, newParentId];
      category.level = newParent.level + 1;

      // Add to new parent's children
      await CategoryModel.findByIdAndUpdate(newParentId, {
        $push: { children: category._id }
      });

      // Update all descendants
      await this.updateDescendants(category);
    } catch (error) {
      logger.error(`Update category hierarchy error: ${error.message}`);
      throw error;
    }
  }

  async updateDescendants(category) {
    const descendants = await CategoryModel.find({
      ancestors: category._id
    });

    for (const descendant of descendants) {
      const ancestorIndex = descendant.ancestors.indexOf(category._id);
      const newAncestors = [
        ...category.ancestors,
        category._id,
        ...descendant.ancestors.slice(ancestorIndex + 1)
      ];

      descendant.ancestors = newAncestors;
      descendant.level = newAncestors.length;
      await descendant.save();
    }
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async addAttribute(categoryId, attribute) {
    try {
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Validate attribute
      if (!attribute.name || !attribute.type) {
        throw new Error('Invalid attribute data');
      }

      // Check for duplicate attribute names
      if (category.attributes.some(attr => attr.name === attribute.name)) {
        throw new Error('Attribute with this name already exists');
      }

      category.attributes.push(attribute);
      await category.save();

      return category;
    } catch (error) {
      logger.error(`Add attribute error: ${error.message}`);
      throw error;
    }
  }

  async updateAttribute(categoryId, attributeId, data) {
    try {
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      const attribute = category.attributes.id(attributeId);
      if (!attribute) {
        throw new Error('Attribute not found');
      }

      Object.assign(attribute, data);
      await category.save();

      return category;
    } catch (error) {
      logger.error(`Update attribute error: ${error.message}`);
      throw error;
    }
  }

  async removeAttribute(categoryId, attributeId) {
    try {
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      category.attributes.pull(attributeId);
      await category.save();

      return category;
    } catch (error) {
      logger.error(`Remove attribute error: ${error.message}`);
      throw error;
    }
  }
}