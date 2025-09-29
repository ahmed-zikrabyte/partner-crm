"use client";
import { useState, useEffect } from "react";
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
import { getAllDevices } from "@/services/deviceService";
import { toast } from "sonner";

interface TransactionForm {
  paymentMode: "upi" | "card" | "cash";
  amount: string;
  note: string;
  type: "return" | "sell";
  deviceId?: string;
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
    deviceId: "",
  });
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);

  const resetForm = () => {
    setForm({
      paymentMode: "cash",
      amount: "",
      note: "",
      type: "sell",
      deviceId: "",
    });
  };

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await getAllDevices({ limit: 0 });
        setDevices(response.data.devices || []);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchDevices();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!form.type) {
        toast.error("Please select transaction type");
        return;
      }
      if (!form.paymentMode) {
        toast.error("Please select payment mode");
        return;
      }
      if (!form.amount || parseFloat(form.amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      if (!form.note.trim()) {
        toast.error("Please enter a note");
        return;
      }
      if (form.type === "return" && !form.deviceId) {
        toast.error("Please select a device for return transaction");
        return;
      }

      setLoading(true);

      const payload = {
        amount: parseFloat(form.amount),
        paymentMode: form.paymentMode,
        type: form.type,
        note: form.note,
        vendorId: entityType === "vendor" ? entityId : undefined,
        deviceId: entityType === "device" ? entityId : form.deviceId,
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
            <Label className="mb-3" htmlFor="type">
              Transaction Type
            </Label>
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
          {form.type === "return" && (
            <div>
              <Label className="mb-3" htmlFor="deviceId">
                Device
              </Label>
              <Select
                value={form.deviceId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, deviceId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device._id} value={device._id}>
                      {device.deviceId} - {device.brand} {device.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="mb-3" htmlFor="paymentMode">
              Payment Mode
            </Label>
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
            <Label className="mb-3" htmlFor="amount">
              Amount
            </Label>
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
            <Label className="mb-3" htmlFor="note">
              Note
            </Label>
            <Textarea
              id="note"
              placeholder="Enter note"
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
