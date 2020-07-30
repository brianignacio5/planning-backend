import { Document } from "mongoose";

export interface UserComment extends Document {
  content: string;
  createdOn: Date;
  createdBy: string;
  card: string;
}