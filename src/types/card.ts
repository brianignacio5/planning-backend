import { Document } from "mongoose";
import { User } from "./user";

export interface Card extends Document {
  assignee: User;
  description: string;
  picture: string;
  title: string;
  createdOn: Date;
}