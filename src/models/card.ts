import { model, Schema } from "mongoose";
import { Card } from "../types/card";

const cardSchema = new Schema({
  board: {
    ref: "Board",
    type: Schema.Types.ObjectId,
  },
  comments: [{
    ref: "Comment",
    type: Schema.Types.ObjectId
  }],
  createdOn: Date,
  description: String,
  picture: String,
  title: String,
});

const cardModel = model<Card>("Card", cardSchema);
export default cardModel;
