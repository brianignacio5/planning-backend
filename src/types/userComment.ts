import { Document } from "mongoose";

export interface UserComment extends Document {
  card: string;
  content: string;
  createdBy: string;
  createdOn: Date;
}