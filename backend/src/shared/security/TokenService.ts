export interface TokenService {
  createAccessToken(userId: string): Promise<string>;
  verifyAccessToken(token: string): Promise<string>;
  revokeAccessToken(token: string): Promise<void>;
}
