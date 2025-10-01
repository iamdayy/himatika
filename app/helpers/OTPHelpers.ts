import type { IResponse } from "~~/types/IResponse";
const router = useRouter();
export const AfterToken = async (
  type:
    | "Verify Account"
    | "Change Password"
    | "Reset Password"
    | "Change Email"
    | "Change Phone"
    | "Verify Email"
    | "Verify Phone",
  email: string,
  token: string
) => {
  let verified: (IResponse & { token?: string }) | false = false;
  try {
    switch (type) {
      case "Verify Account":
        verified = await $fetch<IResponse>("/api/user/verify", {
          method: "post",
          body: {
            email,
            token,
          },
        });
        break;
      case "Change Email":
        verified = await $fetch<IResponse>("/api/member/email", {
          method: "put",
          query: {
            token,
          },
          body: {
            email,
          },
        });
        break;
      case "Reset Password":
        verified = {
          statusCode: 200,
          statusMessage: "Redirecting...",
          token,
        };
        break;
      default:
        throw new Error("Invalid type");
    }
    return verified;
  } catch (error) {
    throw error;
  }
};
