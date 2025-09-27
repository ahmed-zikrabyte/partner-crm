/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { createTransaction } from "@/services/transactionService";
import { toast } from "sonner";

interface TransactionForm {
  paymentMode: "upi" | "card" | "cash";
  amount: string;
  note: string;
  type: "return" | "sell";
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: "vendor" | "device";
  onSuccess?: () => void;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  entityId,
  entityType,
  onSuccess,
}: AddTransactionDialogProps) {
  const [form, setForm] = useState<TransactionForm>({
    paymentMode: "cash",
    amount: "",
    note: "",
    type: "sell",
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      paymentMode: "cash",
      amount: "",
      note: "",
      type: "sell",
    });
  };

  const handleSubmit = async () => {
    try {
      if (!form.amount) {
        toast.error("Please enter amount");
        return;
      }

      setLoading(true);
      
      const payload = {
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        type: form.type,
        note: form.note,
        ...(entityType === "vendor" ? { vendorId: entityId } : { deviceId: entityId }),
      };

      await createTransaction(payload);
      

      toast.success("Transaction created successfully");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={form.type}
              onValueChange={(value: "return" | "sell") =>
                setForm((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select
              value={form.paymentMode}
              onValueChange={(value: "upi" | "card" | "cash") =>
                setForm((prev) => ({ ...prev, paymentMode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Enter note (optional)"
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Transaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}