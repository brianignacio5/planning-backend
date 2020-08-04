import IController from "./IController";
import { Request, Response, Router, NextFunction } from "express";
import HttpException from "../types/httpException";
import { UserComment } from "../types/userComment";
import userCommentModel from "../models/userComments";
import cardModel from "../models/card";
import { isValidObjectId } from "mongoose";
import isAuthenticated from "../middleware/isAuthenticated";

export default class CommentController implements IController {
  public path = "/comment";
  public router = Router();

  constructor() {
    this.router.use(this.path, isAuthenticated);
    this.router.get(this.path, this.getAllComments);
    this.router.post(this.path, this.createComment);
    this.router.put(`${this.path}/:id`, this.updateComment);
    this.router.delete(`${this.path}/:id`, this.deleteComment);
  }

  private getAllComments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const cardId = req.body.cardId;
      let commentQuery = cardId
        ? userCommentModel.find({ card: cardId })
        : userCommentModel.find();
      const comments = await commentQuery.populate("createdBy", "name picture").exec();
      comments
        ? res.status(201).send(comments)
        : next(new HttpException(404, new Error("Comments not found")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private createComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const commentData: UserComment = req.body;
      commentData.createdBy = req.body.user;
      const newComment = new userCommentModel(commentData);
      const savedComment = await newComment.save();
      const commentWithUser = await savedComment.populate("createdBy", "name picture").execPopulate();
      if (commentWithUser) {
        await cardModel.findByIdAndUpdate(
          commentWithUser.card,
          {
            $push: { comments: commentWithUser._id },
          },
          { new: true }
        );
      }
      commentWithUser
        ? res.status(201).send(commentWithUser)
        : next(new HttpException(404, new Error("Can't save new comment")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private updateComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const commentId = req.params.id;
      const commentData: UserComment = req.body;
      const modifiedComment = await userCommentModel.findByIdAndUpdate(
        commentId,
        commentData,
        { new: true }
      );
      modifiedComment
        ? res.status(201).send(modifiedComment)
        : next(new HttpException(404, new Error("Card is not modified")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private deleteComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const commentId = req.params.id;
      const result = await userCommentModel.findByIdAndDelete(commentId);
      result
        ? res.status(201).send(result)
        : next(
            new HttpException(404, new Error("Comment has not been deleted"))
          );
    } catch (error) {
      next(new HttpException(404, error));
    }
  };
}
