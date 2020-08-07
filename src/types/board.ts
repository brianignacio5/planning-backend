import { Document } from "mongoose";

export default interface Board extends Document {
  name: string;
  project: string;
  cards: string[];
}