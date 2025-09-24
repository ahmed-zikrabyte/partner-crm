import { IUser } from './user.interface';

export interface IAdmin extends IUser {}

export interface IClient extends IUser {}

export * from './user.interface';
