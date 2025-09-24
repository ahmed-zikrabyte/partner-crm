export interface IUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'client';
  createdAt: Date;
  updatedAt: Date;
}
