import IController from "./IController";
import { NextFunction, Request, Response, Router } from "express";
import boardModel from "../models/board";
import cardModel from "../models/card";
import HttpException from "../types/httpException";
import userModel from "../models/user";

export default class BoardController implements IController {
  public path = "/board";
  public router = Router();

  constructor() {
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
      const userId = req.body.userId;
      const boardQuery = userId
        ? boardModel.find({ user: userId })
        : boardModel.find();
      const boards = await boardQuery.populate("cards").exec();
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
        await userModel.findByIdAndUpdate(savedBoard.user, {
          $push: { boards: savedBoard._id }
        }, { new: true });
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
      const boardId = req.params.id;
      const cardsResult = await cardModel.deleteMany({ board: boardId }).exec();
      const result = await boardModel.findByIdAndDelete(boardId).exec();
      if (result) {
        await userModel.findByIdAndUpdate(result.user, {
          $pullAll: { boards: result._id }
        }, { new: true });
      }
      result
        ? res.status(201).send({result, cardsResult})
        : next(new HttpException(404, new Error("Error deleting the board")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };
}
