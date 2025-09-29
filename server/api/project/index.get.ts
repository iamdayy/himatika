import { SortOrder } from "mongoose";
import { PhotoModel } from "~~/server/models/PhotoModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { IProject } from "~~/types";
import { IReqProjectQuery } from "~~/types/IRequestPost";
import { IProjectsResponse } from "~~/types/IResponse";

type ISortable = {
  [key: string]: SortOrder;
};

/**
 * Handles GET requests for retrieving project information.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Object>} An object containing project data or a list of projects.
 * @throws {H3Error} If the project is not found or if a system error occurs.
 */
export default defineEventHandler(async (event): Promise<IProjectsResponse> => {
  try {
    const {
      perPage,
      page,
      id,
      notPublished,
      sort,
      order,
      tags,
      search,
      category,
    } = getQuery<IReqProjectQuery>(event);

    // If an ID is provided, return a single project
    if (id) {
      const project = await ProjectModel.findById(id).populate({
        path: "photos",
        model: PhotoModel,
      });
      if (!project) {
        throw createError({
          statusCode: 404,
          statusMessage: "Project not found",
        });
      }

      return {
        statusCode: 200,
        statusMessage: "Project fetched",
        data: {
          project: project.toObject() as IProject,
        },
      };
    }

    const organizer = event.context.organizer;

    let query: any = {};
    if (category && JSON.parse(category).length > 0) {
      query.category = { $in: JSON.parse(category) };
    }

    if (tags && JSON.parse(tags).length > 0) {
      query.tags = { $in: JSON.parse(tags) };
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    let sortOpt: ISortable = {};
    if (sort && order) {
      sortOpt = { [sort]: order };
    }

    if (!notPublished || notPublished === "false") {
      query = {
        ...query,
        published: true,
      };
    }
    if ((notPublished || notPublished === "true") && !organizer) {
      query = {
        ...query,
        published: true,
      };
    }
    const projectsLength = await ProjectModel.countDocuments(query);

    const projects = await ProjectModel.find(query)
      .skip((Number(page) - 1) * Number(perPage))
      .limit(Number(perPage))
      .sort(sortOpt);

    return {
      statusCode: 200,
      statusMessage: "Projects fetched",
      data: {
        projects: projects as IProject[],
        length: projectsLength,
      },
    };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "An unexpected error occurred",
    };
  }
});
