import { model, Schema } from "mongoose";
import { UserComment } from "../types/userComment";

const userCommentSchema = new Schema({
  card: {
    ref: "Card",
    type: Schema.Types.ObjectId,
  },
  content: String,
  createdBy: {
    ref: "User",
    type: Schema.Types.ObjectId,
  },
  createdOn: Date,
});

const userCommentModel = model<UserComment>("Comment", userCommentSchema);
export default userCommentModel;