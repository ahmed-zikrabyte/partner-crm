"use client";

import { useEffect, useState } from "react";
import { getAllTransactions } from "@/services/transactionService";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";

interface Transaction {
  _id: string;
  vendorId: { _id: string; name: string };
  amount: number;
  note: string;
  paymentMode: "cash" | "upi" | "card";
  type: "return" | "sell";
  date: string;
  author: {
    authorType: "partner" | "employee";
    authorId: { _id: string; name: string };
  };
}

export default function CashbookPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "sell" | "return">("all");

  useEffect(() => {
    fetchCashTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, typeFilter]);

  const fetchCashTransactions = async () => {
    try {
      const response = await getAllTransactions();
      const cashTransactions = response.data.filter(
        (transaction: Transaction) => transaction.paymentMode === "cash"
      );
      setTransactions(cashTransactions);
    } catch (error) {
      console.error("Error fetching cash transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (typeFilter === "all") {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === typeFilter));
    }
  };

  const totalCashIn = filteredTransactions
    .filter(t => t.type === "sell")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCashOut = filteredTransactions
    .filter(t => t.type === "return")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = totalCashIn - totalCashOut;

  if (loading) {
    return <div className="p-6">Loading cash transactions...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cash Transactions</h1>
        <Select value={typeFilter} onValueChange={(value: "all" | "sell" | "return") => setTypeFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="sell">Sales Only</SelectItem>
            <SelectItem value="return">Returns Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Cash In (Sales)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCashIn.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Cash Out (Returns)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCashOut.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{netCash.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No cash transactions found</p>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.type === "sell" ? "default" : "destructive"}>
                        {transaction.type === "sell" ? "Sale" : "Return"}
                      </Badge>
                      <span className="font-medium">{transaction.vendorId.name}</span>
                    </div>
                    <div className={`text-lg font-bold ${transaction.type === "sell" ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === "sell" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Date: {new Date(transaction.date).toLocaleDateString()}</div>
                    <div>By: {transaction.author.authorId.name}</div>
                    {transaction.note && <div>Note: {transaction.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}