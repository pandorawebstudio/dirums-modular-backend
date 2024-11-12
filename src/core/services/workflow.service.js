import { BaseService } from './base.service.js';
import { Workflow, Notification } from '../../modules/workflow/model.js';
import { logger } from '../../utils/logger.js';

export class WorkflowService extends BaseService {
  constructor() {
    super(new Workflow());
    this.notificationModel = Notification;
  }

  async processOrderWorkflow(order) {
    try {
      const workflows = await this.findActiveWorkflows('ORDER_CREATED');
      
      for (const workflow of workflows) {
        if (this.evaluateConditions(workflow.trigger.conditions, order)) {
          await this.executeActions(workflow.actions, { order });
        }
      }
    } catch (error) {
      logger.error(`Workflow processing error: ${error.message}`);
      throw error;
    }
  }

  async findActiveWorkflows(event) {
    return this.repository.find({
      'trigger.event': event,
      status: 'ACTIVE'
    });
  }

  evaluateConditions(conditions, context) {
    return conditions.every(condition => {
      const value = this.getFieldValue(condition.field, context);
      
      switch (condition.operator) {
        case 'EQUALS':
          return value === condition.value;
        case 'NOT_EQUALS':
          return value !== condition.value;
        case 'GREATER_THAN':
          return value > condition.value;
        case 'LESS_THAN':
          return value < condition.value;
        case 'CONTAINS':
          return value.includes(condition.value);
        default:
          return false;
      }
    });
  }

  getFieldValue(field, context) {
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }

  async executeActions(actions, context) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'EMAIL':
            await this.sendEmail(action.config, context);
            break;
          case 'SMS':
            await this.sendSMS(action.config, context);
            break;
          case 'WEBHOOK':
            await this.callWebhook(action.config, context);
            break;
          case 'UPDATE_STATUS':
            await this.updateStatus(action.config, context);
            break;
          case 'NOTIFY_ADMIN':
            await this.notifyAdmin(action.config, context);
            break;
        }
      } catch (error) {
        logger.error(`Action execution error: ${error.message}`);
      }
    }
  }

  async sendEmail({ template, recipient }, { order }) {
    // Email sending implementation
  }

  async sendSMS({ template, recipient }, { order }) {
    // SMS sending implementation
  }

  async callWebhook({ url, method, headers, payload }, context) {
    // Webhook implementation
  }

  async updateStatus({ status }, { order }) {
    await order.updateOne({ status });
  }

  async notifyAdmin({ message }, context) {
    await this.notificationModel.create({
      recipient: 'admin',
      type: 'SYSTEM',
      title: 'System Notification',
      content: this.interpolateTemplate(message, context)
    });
  }

  interpolateTemplate(template, context) {
    return template.replace(/\{\{(.*?)\}\}/g, (_, field) => 
      this.getFieldValue(field.trim(), context) || ''
    );
  }
}