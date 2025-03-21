export enum ResourceType {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  LINK = 'LINK',
  TEXT = 'TEXT',
}

export interface DeviceInfo {
  platform: string;
  browser: string;
  version?: string;
  screenSize?: string;
  model?: string;
  os?: string;
}

export enum NotificationType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

/**
 * EmailNotificationMetadata defines the structure of metadata for email notifications
 *
 * This interface provides type safety and documentation for email notification properties
 * that can be used in email templates.
 */
export interface EmailNotificationMetadata {
  /**
   * Course ID (used for course-related notifications)
   */
  courseId?: string;

  /**
   * Course name to display in the notification
   */
  courseName?: string;

  /**
   * ISO date string or formatted date when course was completed
   */
  completedAt?: string;

  /**
   * Progress percentage (0-100)
   */
  progress?: number;

  /**
   * ISO date string or formatted date when course was downloaded
   */
  downloadedAt?: string;

  /**
   * Course size (formatted string like "120MB")
   */
  estimatedSize?: string;

  /**
   * URL for action button
   */
  actionUrl?: string;

  /**
   * Text to display on action button (defaults to "View Details" if not provided)
   */
  actionText?: string;

  [key: string]: any;
}

export interface VideoUploadResult {
  secure_url: string;
  [key: string]: any;
}
