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
