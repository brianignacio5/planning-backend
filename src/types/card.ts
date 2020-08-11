import { Document } from "mongoose";

export interface Card extends Document {
  assignee: string;
  board: string;
  comments: string[];
  createdOn: Date;
  description: string;
  dueOn: Date;
  picture: string;
  title: string;
}