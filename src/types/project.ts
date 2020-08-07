import { Document } from "mongoose";

export interface Project extends Document {
  boards: string[];
  createdOn: Date;
  name: string;
  users: string[];
}