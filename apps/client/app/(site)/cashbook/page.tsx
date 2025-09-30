"use client";

import { useEffect, useState } from "react";
import { getAllTransactions, exportTransactions } from "@/services/transactionService";
import { getPartnerProfile } from "@/services/authService";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { AddTransactionDialog } from "@/components/global/add-transaction-dialog";
import { IndianRupee, Download, Search } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  _id: string;
  vendorId?: { _id: string; name: string };
  amount: number;
  note: string;
  paymentMode?: "cash" | "upi" | "card";
  type: "return" | "sell" | "credit" | "debit";
  date: string;
  author: {
    authorType: "partner" | "employee";
    authorId: { _id: string; name: string };
  };
}

export default function CashbookPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [internalTransactions, setInternalTransactions] = useState<Transaction[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "sell" | "return">("all");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [internalSearch, setInternalSearch] = useState("");
  const [internalStartDate, setInternalStartDate] = useState("");
  const [internalEndDate, setInternalEndDate] = useState("");
  const [internalTypeFilter, setInternalTypeFilter] = useState<"all" | "credit" | "debit">("all");

  useEffect(() => {
    fetchCashTransactions();
  }, [search, startDate, endDate]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, typeFilter, search, startDate, endDate]);

  const fetchCashTransactions = async () => {
    try {
      const [transactionResponse, partnerResponse] = await Promise.all([
        getAllTransactions({ search, startDate, endDate }),
        getPartnerProfile()
      ]);
      
      const allTransactions = transactionResponse.data;
      
      const cashTransactions = allTransactions.filter(
        (transaction: Transaction) => transaction.paymentMode === "cash"
      );
      
      const internalTxns = allTransactions.filter(
        (transaction: Transaction) => transaction.type === "credit" || transaction.type === "debit"
      );
      
      setTransactions(cashTransactions);
      setInternalTransactions(internalTxns);
      setPartner(partnerResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    setFilteredTransactions(filtered);
  };

  const handleExport = async (tabType: "all" | "internal") => {
    try {
      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      if (tabType === "internal") {
        // Export only internal transactions
        const internalTypes = ["credit", "debit"];
        const promises = internalTypes.map(type => 
          exportTransactions({ ...filters, type: type as any })
        );
        const responses = await Promise.all(promises);
        const combinedData = responses.flatMap(r => r.data);
        
        const csvContent = convertToCSV(combinedData);
        downloadCSV(csvContent, "internal-transactions");
      } else {
        // Export cash transactions only
        const response = await exportTransactions(filters);
        const cashData = response.data.filter((t: any) => 
          t["Payment Mode"] === "cash" || t["Type"] === "CREDIT" || t["Type"] === "DEBIT"
        );
        
        const csvContent = convertToCSV(cashData);
        downloadCSV(csvContent, "cash-transactions");
      }
      
      toast.success("Transactions exported successfully");
    } catch (error) {
      toast.error("Failed to export transactions");
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return "";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    return [headers, ...rows].join("\n");
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalCashIn = filteredTransactions
    .filter(t => t.type === "sell")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCashOut = filteredTransactions
    .filter(t => t.type === "return")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = totalCashIn - totalCashOut;

  const filteredInternalTransactions = internalTransactions.filter(transaction => {
    const matchesSearch = transaction.note?.toLowerCase().includes(internalSearch.toLowerCase()) ||
                         transaction.author.authorId.name?.toLowerCase().includes(internalSearch.toLowerCase());
    const matchesDateRange = (!internalStartDate || new Date(transaction.date) >= new Date(internalStartDate)) &&
                            (!internalEndDate || new Date(transaction.date) <= new Date(internalEndDate));
    const matchesType = internalTypeFilter === "all" || transaction.type === internalTypeFilter;
    
    return matchesSearch && matchesDateRange && matchesType;
  });

  if (loading) {
    return <div className="p-6">Loading cash transactions...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cashbook</h1>
        <Button onClick={() => setTransactionDialogOpen(true)}>
          <IndianRupee className="w-4 h-4 mr-2" />
          Add Internal Transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Total Cash Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${
            (partner?.cashAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ₹{(partner?.cashAmount || 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="internal">Internal Transactions ({internalTransactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Cash Transactions</h2>
              <Button onClick={() => handleExport("all")}>
                <Download className="w-4 h-4 mr-2" />
                Export Cash Transactions
              </Button>
            </div>
            
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
              
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
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch("");
                  setStartDate("");
                  setEndDate("");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
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
                          <span className="font-medium">{transaction.vendorId?.name || 'N/A'}</span>
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
        </TabsContent>

        <TabsContent value="internal" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Internal Transactions</h2>
              <Button onClick={() => handleExport("internal")}>
                <Download className="w-4 h-4 mr-2" />
                Export Internal Transactions
              </Button>
            </div>
            
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={internalSearch}
                  onChange={(e) => setInternalSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Input
                type="date"
                placeholder="Start Date"
                value={internalStartDate}
                onChange={(e) => setInternalStartDate(e.target.value)}
                className="w-40"
              />
              
              <Input
                type="date"
                placeholder="End Date"
                value={internalEndDate}
                onChange={(e) => setInternalEndDate(e.target.value)}
                className="w-40"
              />
              
              <Select value={internalTypeFilter} onValueChange={(value: "all" | "credit" | "debit") => setInternalTypeFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="credit">Credits Only</SelectItem>
                  <SelectItem value="debit">Debits Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setInternalSearch("");
                  setInternalStartDate("");
                  setInternalEndDate("");
                  setInternalTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Cash In (Credits)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{filteredInternalTransactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Cash Out (Debits)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{filteredInternalTransactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Internal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (filteredInternalTransactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0) - 
                   filteredInternalTransactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)) >= 0 
                  ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{(
                    filteredInternalTransactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0) - 
                    filteredInternalTransactions.filter(t => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)
                  ).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Internal Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInternalTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No internal transactions found</p>
              ) : (
                <div className="space-y-4">
                  {filteredInternalTransactions.map((transaction) => (
                    <div key={transaction._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={transaction.type === "credit" ? "default" : "destructive"}>
                            {transaction.type === "credit" ? "Credit" : "Debit"}
                          </Badge>
                        </div>
                        <div className={`text-lg font-bold ${transaction.type === "credit" ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
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
        </TabsContent>
      </Tabs>

      <AddTransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        entityId=""
        entityType="partner"
        onSuccess={fetchCashTransactions}
      />
    </div>
  );
}