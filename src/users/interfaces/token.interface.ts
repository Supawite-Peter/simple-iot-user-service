export interface TokenDetail {
  user?: {
    sub: number;
    username: string;
  };
  token?: {
    accessToken?: string;
    refreshToken?: string;
  };
}
