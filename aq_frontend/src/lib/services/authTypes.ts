export type AuthUser = {
  id: string;
  nickname: string;
  avatar_id: number;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};
