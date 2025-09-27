import axiosInstance from "@/lib/axios";

export interface TransactionPayload {
  vendorId?: string;
  deviceId?: string;
  amount: number;
  note?: string;
  paymentMode: "upi" | "card" | "cash";
  type: "return" | "sell";
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
}: {
  vendorId?: string;
  type?: "return" | "sell";
} = {}) => {
  try {
    const response = await axiosInstance.get("/partner/transaction", {
      params: { vendorId, type },
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