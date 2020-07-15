import { model, Schema } from "mongoose";
import { User } from "../types/user";
import bcrypt from "bcrypt";

const userSchema = new Schema({
  createdOn: Date,
  email: {
    unique: true,
    lowercase: true,
    required: true,
    trim: true,
    type: String,
  },
  githubId: {
    type: String,
    unique: true,
  },
  name: String,
  password: {
    type: String,
    required: true
  },
  picture: String,
  provider: String
});

userSchema.pre<User>("save", async (next) => {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(user.password, salt);
  user.password = hash;
  next();
});

userSchema.methods.comparePassword = async (password: string): Promise<boolean> => {
  return await bcrypt.compare(password, this.password);
}

const userModel = model<User>("User", userSchema);
export default userModel;