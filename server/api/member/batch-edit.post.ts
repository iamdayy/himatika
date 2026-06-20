import { z } from "zod";
import { MemberModel } from "~~/server/models/MemberModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { UserModel } from "~~/server/models/UserModel";
import { IMember } from "~~/types";
import { IResponse } from "~~/types/IResponse";

/**
 * Strict schema for batch edit payload
 */
const batchEditSchema = z.array(
  z.object({
    NIM: z.number().int().positive(),
    fullName: z.string().optional(),
    email: z.string().email().or(z.literal("")).optional(),
    class: z.string().optional(),
    semester: z.number().min(1).max(14).optional(),
    enteredYear: z.number().int().optional(),
    status: z.enum(["active", "inactive", "free", "deleted"]).optional(),
  })
);

/**
 * Handles POST requests for batch updating user members via Excel import.
 */
export default defineEventHandler(
  async (
    event
  ): Promise<
    IResponse & {
      data?: {
        failedMembers: IMember[];
        savedCount: number;
        failedCount: number;
      };
    }
  > => {
    // Ensure the user is authenticated and has the necessary permissions
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: "You must be logged in to use this endpoint",
      });
    }
    if (!event.context.organizer) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You must be administrator or department to use this endpoint",
      });
    }

    // Read the request body and validate with Zod strictly
    const body = await readValidatedBody(event, batchEditSchema.parse);

    let savedCount = 0;
    let failedCount = 0;
    let failedMembers: IMember[] = [];

    try {
      // Prepare bulkWrite operations
      const operations = body.map((member) => {
        const { NIM, ...rest } = member;
        const updateData: Record<string, any> = { ...rest };

        // Clean email: if empty or null, remove it from updateData so it doesn't trigger E11000
        if (!updateData.email || (typeof updateData.email === 'string' && updateData.email.trim() === "")) {
            delete updateData.email;
        }

        return {
          updateOne: {
            filter: { NIM: NIM },
            update: { $set: updateData },
          },
        };
      });

      const result = await MemberModel.bulkWrite(operations, {
        ordered: false,
      });

      // Handle deleted status side effects manually since bulkWrite skips Mongoose middleware
      const deletedNIMs = body.filter(m => m.status === 'deleted').map(m => m.NIM);
      if (deletedNIMs.length > 0) {
        const deletedMembers = await MemberModel.find({ NIM: { $in: deletedNIMs } });
        const deletedIds = deletedMembers.map(m => m._id);
        
        if (deletedIds.length > 0) {
          await Promise.all([
            ProjectModel.updateMany(
              { members: { $in: deletedIds } },
              { $pull: { members: { $in: deletedIds } } }
            ),
            AgendaModel.updateMany(
              {
                $or: [
                  { "committee.user": { $in: deletedIds } },
                  { "registered.member": { $in: deletedIds } },
                ],
              },
              {
                $pull: {
                  committee: { user: { $in: deletedIds } },
                  registered: { member: { $in: deletedIds } },
                },
              }
            ),
            UserModel.deleteMany({ member: { $in: deletedIds } } as any)
          ]);
        }
      }

      savedCount = result.modifiedCount + (result.upsertedCount || 0);
      failedCount = body.length - savedCount;

    } catch (error: any) {
      console.log(error);
      if (error.writeErrors) {
        savedCount = body.length - error.writeErrors.length;
        failedCount = error.writeErrors.length;
        failedMembers = error.writeErrors.map((writeError: any) => {
          const index = writeError.index;
          return body[index] as IMember;
        });
      } else {
        failedCount = body.length;
      }
    }

    return {
      statusCode: 200,
      statusMessage: `Successfully updated ${savedCount} members. ${failedCount} members failed to update.`,
      data: { failedMembers, savedCount, failedCount },
    };
  }
);

