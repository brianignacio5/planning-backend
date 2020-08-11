import { NextFunction, Request, Response, Router } from "express";
import IController from "./IController";
import boardModel from "../models/board";
import cardModel from "../models/card";
import HttpException from "../types/httpException";
import { Card } from "../types/card";
import userCommentModel from "../models/userComments";
import { isValidObjectId } from "mongoose";
import isAuthenticated from "../middleware/isAuthenticated";

export default class CardController implements IController {
  public path = "/card";
  public router = Router();

  constructor() {
    this.router.use(this.path, isAuthenticated);
    this.router.get(this.path, this.getAllCards);
    this.router.get(`${this.path}/user`, this.getAllUserCards);
    this.router.post(this.path, this.createCard);
    this.router.put(`${this.path}/:id`, this.updateCard);
    this.router.delete(`${this.path}/:id`, this.deleteCard);
  }

  private getAllCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const boardId = req.body.boardId;
      let cardQuery = boardId
        ? cardModel.find({ board: boardId })
        : cardModel.find();
      const cards = await cardQuery
        .populate({
          path: "comments",
          model: "Comment",
          populate: {
            path: "createdBy",
            model: "User",
            select: "name picture email -_id",
          },
        })
        .populate({
          path: "assignee",
          model: "User",
          select: "name picture email",
        })
        .exec();
      cards
        ? res.status(201).send(cards)
        : next(new HttpException(404, new Error("Cards not found")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private getAllUserCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.body.user;
      if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const cards = await cardModel
        .find({ assignee: userId })
        .populate({
          path: "comments",
          model: "Comment",
          populate: {
            path: "createdBy",
            model: "User",
            select: "name picture email -_id",
          },
        })
        .populate("assignee")
        .exec();
      cards
        ? res.status(201).send(cards)
        : next(new HttpException(404, new Error("Cards not found")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private createCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const cardData: Card = req.body;
      const newCard = new cardModel(cardData);
      const savedCard = await newCard.save();
      if (savedCard) {
        await boardModel.findByIdAndUpdate(
          savedCard.board,
          {
            $push: { cards: savedCard._id },
          },
          { new: true }
        );
      }
      savedCard
        ? res.status(201).send(savedCard)
        : next(new HttpException(404, new Error("Error saving card")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private updateCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const id = req.params.id;
      const modifiedCard: Card = req.body;
      const destBoardCardIndex = req.body.insertIndex;
      const oldCard = await cardModel.findById(id).exec();
      const requestedCard = await cardModel
        .findByIdAndUpdate(id, modifiedCard, { new: true })
        .exec();
      if (
        oldCard &&
        requestedCard &&
        oldCard.board
          .toString()
          .localeCompare(requestedCard.board.toString()) !== 0
      ) {
        await boardModel.findByIdAndUpdate(
          requestedCard?.board,
          {
            $push: {
              cards: {
                $each: [requestedCard?._id],
                $position: destBoardCardIndex,
              },
            },
          },
          { new: true }
        );
        await boardModel.findByIdAndUpdate(
          oldCard?.board,
          {
            $pullAll: { cards: [requestedCard?._id] },
          },
          { new: true }
        );
      }
      requestedCard
        ? res.status(201).send(requestedCard)
        : next(new HttpException(404, new Error("Card has not been modified")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private deleteCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const id = req.params.id;
      const commentsResult = await userCommentModel
        .deleteMany({ card: id })
        .exec();
      const result = await cardModel.findByIdAndDelete(id);
      result
        ? res.status(201).send({ result, commentsResult })
        : next(new HttpException(404, new Error("Error deleting card")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };
}
