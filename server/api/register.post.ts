import { UserModel } from "~/server/models/UserModel";
import { IReqRegister } from "~/types/IRequestPost";
import { IRegisterResponse } from "~/types/IResponse";
import {
  findProfileAndMarkRegister,
  findProfileByNim,
} from "../utils/findProfile";

export default defineEventHandler(async (event): Promise<IRegisterResponse> => {
  const body = await readBody<IReqRegister>(event);
  const profileId = await findProfileByNim(body.NIM);
  if (!profileId) {
    throw createError({
      statusCode: 400,
      message: "Unchh.., Your Nim is not found",
    });
  }
  const form = {
    ...body,
    profile: profileId,
  };
  const user = new UserModel(form);
  const registered = await user.save();
  await findProfileAndMarkRegister(profileId);
  if (!registered) {
    throw createError({
      statusCode: 401,
      message: "Owhhh you not registered yet",
    });
  }
  return registered;
});
