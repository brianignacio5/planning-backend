import IController from "./IController";
import { NextFunction, Request, Response, Router } from "express";
import projectModel from "../models/project";
import boardModel from "../models/board";
import cardModel from "../models/card";
import userCommentModel from "../models/userComments";
import { isValidObjectId } from "mongoose";
import isAuthenticated from "../middleware/isAuthenticated";
import HttpException from "../types/httpException";
import { Project } from "../types/project";

export default class ProjectController implements IController {
  public path = "/project";
  public router = Router();

  constructor() {
    this.router.use(this.path, isAuthenticated);
    this.router.get(this.path, this.getAllProjects);
    this.router.get(`${this.path}/:id`, this.getProjectById);
    this.router.post(this.path, this.createProject);
    this.router.put(`${this.path}/:id`, this.updateProject);
    this.router.delete(`${this.path}/:id`, this.deleteProject);
  }

  private getAllProjects = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projects = await projectModel
        .find()
        .populate({
          path: "boards",
          populate: {
            path: "cards",
            model: "Card",
            populate: {
              path: "comments",
              model: "Comment",
              populate: {
                path: "createdBy",
                model: "User",
                select: "name picture email -_id",
              },
            },
          },
        })
        .populate("users")
        .exec();
      projects
        ? res.status(201).send(projects)
        : next(new HttpException(404, new Error("Error getting projects")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private getProjectById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const project = await projectModel
        .findById(req.params.id)
        .populate({
          path: "boards",
          populate: {
            path: "cards",
            model: "Card",
            populate: {
              path: "comments",
              model: "Comment",
              populate: {
                path: "createdBy",
                model: "User",
                select: "name picture email -_id",
              },
            },
          },
        })
        .populate("users")
        .exec();
      project
        ? res.status(201).send(project)
        : next(new HttpException(404, new Error("Error getting project")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectData: Project = req.body;
      const newProject = new projectModel(projectData);
      const savedProject = await newProject.save();
      savedProject
        ? res.status(201).send(savedProject)
        : next(new HttpException(404, new Error("Error creating project")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private updateProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const projectData: Project = req.body;
      console.log(req.body);
      const modifiedProject = await projectModel
        .findByIdAndUpdate(req.params.id, projectData, { new: true })
        .exec();
      modifiedProject
        ? res.status(201).send(modifiedProject)
        : next(
            new HttpException(404, new Error("Project has not been modified"))
          );
    } catch (error) {
      next(new HttpException(404, error));
    }
  };

  private deleteProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.params.id || !isValidObjectId(req.params.id)) {
        return res.status(404).json({ msg: "invalid id" });
      }
      const deletedProject = await projectModel
        .findByIdAndDelete(req.params.id)
        .exec();

      const boardsId = (
        await boardModel
          .find({ project: deletedProject?._id })
          .select("_id")
          .exec()
      ).map((b) => b._id);
      const cardsId = (
        await cardModel
          .find({ board: { $in: boardsId } })
          .select("_id")
          .exec()
      ).map((c) => c._id);
      const commentsResult = await userCommentModel
        .deleteMany({ card: { $in: cardsId } })
        .exec();
      const cardsResult = await cardModel
        .deleteMany({ board: { $in: boardsId } })
        .exec();
      const boardResult = await boardModel
        .deleteMany({ project: deletedProject?._id })
        .exec();
      deletedProject
        ? res.status(201).send({
            boardResult,
            cardsResult,
            commentsResult,
            deletedProject,
          })
        : next(new HttpException(404, new Error("Error deleting project")));
    } catch (error) {
      next(new HttpException(404, error));
    }
  };
}
