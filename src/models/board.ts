import { model, Schema } from "mongoose";
import Board from "../types/board";

const boardSchema = new Schema({
  name: String,
  project: {
    ref: "Project",
    type: Schema.Types.ObjectId,
  },
  cards: [
    {
      ref: "Card",
      type: Schema.Types.ObjectId
    }
  ]
});

const boardModel = model<Board>("Board", boardSchema);
export default boardModel;