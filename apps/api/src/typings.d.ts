export type ServiceResponse<T = {} | [] | any> = Promise<{
  success: boolean;
  data?: T;
  totalRows?: number;
  status: number;
  message: string;
  pagination?: any;
}>;
