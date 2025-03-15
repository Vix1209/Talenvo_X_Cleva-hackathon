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