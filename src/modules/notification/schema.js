export const notificationTypeDefs = `
  type Notification {
    id: ID!
    recipient: User!
    type: NotificationType!
    title: String
    content: String!
    status: NotificationStatus!
    readAt: String
    metadata: JSON
    createdAt: String!
    updatedAt: String!
  }

  enum NotificationType {
    EMAIL
    SMS
    SYSTEM
  }

  enum NotificationStatus {
    PENDING
    SENT
    FAILED
  }

  extend type Query {
    notifications(
      status: NotificationStatus
      limit: Int = 20
      offset: Int = 0
    ): [Notification!]!
    
    unreadNotificationsCount: Int!
  }

  extend type Mutation {
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: ID!): Boolean!
  }
`;