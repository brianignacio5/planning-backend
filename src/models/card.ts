import { model, Schema } from "mongoose";
import { Card } from "../types/card";

const cardSchema = new Schema({
  assignee: {
    ref: "User",
    type: Schema.Types.ObjectId
  },
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
  dueOn: Date,
  picture: String,
  title: String,
});

const cardModel = model<Card>("Card", cardSchema);
export default cardModel;
