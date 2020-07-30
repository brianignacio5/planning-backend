import { NextFunction, Request, Response, Router } from "express";
import IController from "./IController";
import boardModel from "../models/board";
import cardModel from "../models/card";
import HttpException from "../types/httpException";
import { Card } from "../types/card";

export default class CardController implements IController {
  public path = "/card";
  public router = Router();

  constructor() {
    this.router.get(this.path, this.getAllCards);
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
      const cards = await cardQuery.exec();
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
        await boardModel.findByIdAndUpdate(savedCard.board, {
          $push: { cards: savedCard._id }
        }, { new: true });
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
      const id = req.params.id;
      const modifiedCard: Card = req.body;
      const oldCard = await cardModel.findById(id).exec();
      const requestedCard = await cardModel
        .findByIdAndUpdate(id, modifiedCard, { new: true })
        .exec();
      if (oldCard?.board !== requestedCard?.board) {
        await boardModel.findByIdAndUpdate(requestedCard?.board, {
          $push: { cards: requestedCard?._id }
        }, { new: true });
        await boardModel.findByIdAndUpdate(oldCard?.board, {
          $pullAll: { cards: [requestedCard?._id] }
        }, { new: true });
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
      const id = req.params.id;
      const result = await cardModel.findByIdAndDelete(id);
      result
        ? res.status(201).send(result)
        : next(new HttpException(404, new Error("Error deleting card")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };
}
