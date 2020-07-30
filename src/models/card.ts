import { model, Schema } from "mongoose";
import { Card } from "../types/card";

const cardSchema = new Schema({
  board: {
    ref: "Board",
    type: Schema.Types.ObjectId,
  },
  description: String,
  picture: String,
  title: String,
  createdOn: Date,
});

const cardModel = model<Card>("Card", cardSchema);
export default cardModel;
