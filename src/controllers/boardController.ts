import IController from "./IController";
import { NextFunction, Request, Response, Router } from "express";
import boardModel from "../models/board";
import cardModel from "../models/card";
import HttpException from "../types/httpException";
import projectModel from "../models/project";
import userCommentModel from "../models/userComments";
import { isValidObjectId } from "mongoose";
import isAuthenticated from "../middleware/isAuthenticated";

export default class BoardController implements IController {
  public path = "/board";
  public router = Router();

  constructor() {
    this.router.use(this.path, isAuthenticated);
    this.router.get(this.path, this.getAllBoards);
    this.router.post(this.path, this.createBoard);
    this.router.delete(`${this.path}/:id`, this.deleteBoard);
  }

  private getAllBoards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectId = req.body.project;
      const boardQuery = projectId
        ? boardModel.find({ project: projectId })
        : boardModel.find();
      const boards = await boardQuery
        .populate({
          path: "cards",
          populate: {
            path: "comments",
            model: "Comment",
            populate: {
              path: "createdBy",
              model: "User",
              select: "name picture email -_id",
            },
          },
        })
        .exec();
      boards
        ? res.status(201).send(boards)
        : next(new HttpException(404, new Error("Error getting boards")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private createBoard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const boardData = req.body;
      const newBoard = new boardModel(boardData);
      const savedBoard = await newBoard.save();
      if (savedBoard) {
        await projectModel.findByIdAndUpdate(
          savedBoard.project,
          {
            $push: { boards: savedBoard._id },
          },
          { new: true }
        );
      }
      savedBoard
        ? res.status(201).send(savedBoard)
        : next(new HttpException(404, new Error("Board could not be saved")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private deleteBoard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const boardId = req.params.id;
      const cardsIds = (
        await cardModel.find({ board: boardId }).select("_id").exec()
      ).map((c) => c._id);
      const commentsResult = await userCommentModel.deleteMany({
        card: { $in: cardsIds },
      });
      const cardsResult = await cardModel.deleteMany({ board: boardId }).exec();
      const result = await boardModel.findByIdAndDelete(boardId).exec();
      if (result) {
        await projectModel.findByIdAndUpdate(
          result.project,
          {
            $pullAll: { boards: [result._id] },
          },
          { new: true }
        );
      }
      result
        ? res.status(201).send({ result, cardsResult, commentsResult })
        : next(new HttpException(404, new Error("Error deleting the board")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };
}
