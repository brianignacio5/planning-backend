import { model, Schema } from "mongoose";
import { Project } from "../types/project";

const projectSchema = new Schema({
  boards: [
    {
      ref: "Board",
      type: Schema.Types.ObjectId,
    },
  ],
  createdOn: Date,
  name: String,
  users: [
    {
      ref: "User",
      type: Schema.Types.ObjectId,
    },
  ],
});

const projectModel = model<Project>("Project", projectSchema);
export default projectModel;
