import { Document } from "mongoose";
import { User } from "./user";
import { Card } from "./card";

export interface UserComment extends Document {
  content: string;
  createdOn: Date;
  createdBy: User;
  card: Card;
}