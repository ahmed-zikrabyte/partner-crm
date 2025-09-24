import {IUser} from "src/interfaces";

// Mock user data store
const users: IUser[] = [];

export const getAllUsers = async () => {
  return users.filter((user) => user.role === "client");
};
