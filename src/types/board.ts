import { Document } from "mongoose";

export default interface Board extends Document {
  name: string;
  user: string;
  cards: string[];
}