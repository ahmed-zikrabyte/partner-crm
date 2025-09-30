import axiosInstance from "@/lib/axios";

export type TransactionType = "return" | "sell" | "credit" | "debit";

export interface TransactionPayload {
  vendorId?: string;       // optional for internal transactions
  deviceId?: string;       // only required for returns
  amount: number;
  note?: string;
  paymentMode?: "upi" | "card" | "cash"; // optional for credit/debit
  type: TransactionType;
  date?: string;
}

// Create transaction
export const createTransaction = async (payload: TransactionPayload) => {
  try {
    const response = await axiosInstance.post("/partner/transaction", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

// Get all transactions
export const getAllTransactions = async ({
  vendorId,
  type,
  search,
  startDate,
  endDate,
}: {
  vendorId?: string;
  type?: TransactionType;
  search?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  try {
    const response = await axiosInstance.get("/partner/transaction", {
      params: { vendorId, type, search, startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

// Get transaction by ID
export const getTransactionById = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/partner/transaction/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

// Export transactions
export const exportTransactions = async ({
  vendorId,
  type,
  startDate,
  endDate,
}: {
  vendorId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
} = {}) => {
  try {
    const response = await axiosInstance.get("/partner/transaction/export/all", {
      params: { vendorId, type, startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting transactions:", error);
    throw error;
  }
};
