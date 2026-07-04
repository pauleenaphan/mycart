import { api } from "~/trpc/react";
import { type UserProfile } from "~/types/user";

export function useProfileCache() {
  const utils = api.useUtils();

  const setUser = (data: UserProfile) => {
    utils.user.getProfile.setData(undefined, data);
  };

  return { setUser, utils };
}
