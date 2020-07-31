import { Document } from "mongoose";

export interface Card extends Document {
  board: string;
  comments: string[];
  description: string;
  picture: string;
  title: string;
  createdOn: Date;
}