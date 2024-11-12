import { AttributeModel } from './model.js';
import { logger } from '../../utils/logger.js';

export class AttributeService {
  async createAttribute(data) {
    try {
      const { name, code } = data;

      // Check for duplicate code
      const existingAttribute = await AttributeModel.findOne({ code });
      if (existingAttribute) {
        throw new Error('Attribute with this code already exists');
      }

      const attribute = new AttributeModel(data);
      return attribute.save();
    } catch (error) {
      logger.error(`Create attribute error: ${error.message}`);
      throw error;
    }
  }

  async updateAttribute(id, data) {
    try {
      const attribute = await AttributeModel.findById(id);
      if (!attribute) {
        throw new Error('Attribute not found');
      }

      if (data.code && data.code !== attribute.code) {
        const existingAttribute = await AttributeModel.findOne({
          code: data.code,
          _id: { $ne: id }
        });

        if (existingAttribute) {
          throw new Error('Attribute with this code already exists');
        }
      }

      Object.assign(attribute, data);
      return attribute.save();
    } catch (error) {
      logger.error(`Update attribute error: ${error.message}`);
      throw error;
    }
  }

  async deleteAttribute(id) {
    try {
      const attribute = await AttributeModel.findById(id);
      if (!attribute) {
        throw new Error('Attribute not found');
      }

      // Check if attribute is in use
      // Implement check logic here

      await attribute.remove();
      return true;
    } catch (error) {
      logger.error(`Delete attribute error: ${error.message}`);
      throw error;
    }
  }

  async addOption(id, option) {
    try {
      const attribute = await AttributeModel.findById(id);
      if (!attribute) {
        throw new Error('Attribute not found');
      }

      if (!['SELECT', 'MULTI_SELECT', 'COLOR'].includes(attribute.type)) {
        throw new Error('Options can only be added to SELECT, MULTI_SELECT, or COLOR attributes');
      }

      // Check for duplicate option value
      if (attribute.options.some(opt => opt.value === option.value)) {
        throw new Error('Option with this value already exists');
      }

      attribute.options.push(option);
      return attribute.save();
    } catch (error) {
      logger.error(`Add option error: ${error.message}`);
      throw error;
    }
  }

  async updateOption(id, optionId, data) {
    try {
      const attribute = await AttributeModel.findById(id);
      if (!attribute) {
        throw new Error('Attribute not found');
      }

      const option = attribute.options.id(optionId);
      if (!option) {
        throw new Error('Option not found');
      }

      if (data.value && data.value !== option.value) {
        if (attribute.options.some(opt => 
          opt._id !== optionId && opt.value === data.value
        )) {
          throw new Error('Option with this value already exists');
        }
      }

      Object.assign(option, data);
      return attribute.save();
    } catch (error) {
      logger.error(`Update option error: ${error.message}`);
      throw error;
    }
  }

  async removeOption(id, optionId) {
    try {
      const attribute = await AttributeModel.findById(id);
      if (!attribute) {
        throw new Error('Attribute not found');
      }

      attribute.options.pull(optionId);
      return attribute.save();
    } catch (error) {
      logger.error(`Remove option error: ${error.message}`);
      throw error;
    }
  }

  async validateAttributeValue(attribute, value) {
    try {
      switch (attribute.type) {
        case 'NUMBER':
          return this.validateNumberValue(attribute, value);
        
        case 'TEXT':
          return this.validateTextValue(attribute, value);
        
        case 'SELECT':
        case 'MULTI_SELECT':
          return this.validateSelectValue(attribute, value);
        
        case 'BOOLEAN':
          return typeof value === 'boolean';
        
        case 'DATE':
          return !isNaN(Date.parse(value));
        
        default:
          return true;
      }
    } catch (error) {
      logger.error(`Validate attribute value error: ${error.message}`);
      throw error;
    }
  }

  validateNumberValue(attribute, value) {
    if (typeof value !== 'number') return false;

    const { min, max } = attribute.validation?.config || {};
    
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    
    return true;
  }

  validateTextValue(attribute, value) {
    if (typeof value !== 'string') return false;

    const { pattern } = attribute.validation?.config || {};
    if (pattern && !new RegExp(pattern).test(value)) {
      return false;
    }

    return true;
  }

  validateSelectValue(attribute, value) {
    const values = Array.isArray(value) ? value : [value];
    const validValues = attribute.options.map(opt => opt.value);
    
    return values.every(v => validValues.includes(v));
  }
}