export interface UserStubInfo {
  id: number;
  username: string;
  passwordHash: string;
  mqttPasswordHash?: string;
  firstName?: string;
  lastName?: string;
}
