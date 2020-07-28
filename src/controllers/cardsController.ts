import { NextFunction, Request, Response, Router } from "express";
import IController from "./IController";
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
      const userId = req.body.userId;
      let cardQuery = userId
        ? cardModel.find({ assignee: userId })
        : cardModel.find({});
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
      const requestedCard = await cardModel
        .findByIdAndUpdate(id, modifiedCard, { new: true })
        .exec();
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
