import jwt, {SignOptions} from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {IUser} from "src/interfaces";
import config from "../../../../config";
// This is a mock user data store. Replace with a database in a real application.
const users: IUser[] = [];

const signToken = (id: string, role: "admin" | "client") => {
  const secret = role === "admin" ? config.adminJwt.secret : config.jwt.secret;
  const expiresIn =
    role === "admin" ? config.adminJwt.expiresIn : config.jwt.expiresIn;

  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign({id, role}, secret as string, options);
};

export const registerUser = async (userData: Partial<IUser>) => {
  const {name, email, password, role} = userData;

  if (!name || !email || !password || !role) {
    throw new Error("Please provide all required fields");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser: IUser = {
    id: `${users.length + 1}`,
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);

  const token = signToken(newUser.id, newUser.role);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {password: _, ...userWithoutPassword} = newUser;

  return {user: userWithoutPassword, token};
};

export const loginUser = async (credentials: Partial<IUser>) => {
  const {email, password} = credentials;

  if (!email || !password) {
    throw new Error("Please provide email and password");
  }

  const user = users.find((u) => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password!))) {
    throw new Error("Incorrect email or password");
  }

  const token = signToken(user.id, user.role);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {password: _, ...userWithoutPassword} = user;

  return {user: userWithoutPassword, token};
};
