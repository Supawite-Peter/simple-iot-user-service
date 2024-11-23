export interface DeviceDetail {
  id: number;
  name: string;
  userId: number;
  serial: string;
  topics: string[];
}

export interface TopicAdd {
  topicsAdded: number;
  topics: string[];
}

export interface TopicRemove {
  topicsRemoved: number;
  topics: string[];
}
