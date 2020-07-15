import { Document } from "mongoose";

export interface User extends Document {
  accessToken: string;
  comparePassword: (password: string) => Promise<Boolean>;
  createdOn: Date;
  email: string;
  githubId: string,
  id: string;
  name: string;
  password: string;
  picture: string;
  provider: string;
  refreshToken: string;
}