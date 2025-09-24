import {IUser} from "src/interfaces";

// Mock user data store
const users: IUser[] = [];

export const getProfileById = async (id: string) => {
  const user = users.find((u) => u.id === id && u.role === "client");
  if (!user) {
    throw new Error("User not found");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {password, ...userWithoutPassword} = user;
  return userWithoutPassword;
};
