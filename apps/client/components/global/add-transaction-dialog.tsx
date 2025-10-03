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
  type: "return" | "sell" | "credit" | "debit" | "investment";
  deviceId?: string;
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: "vendor" | "device" | "partner"; // partner added for internal
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
  const [deviceSearch, setDeviceSearch] = useState("");

  const resetForm = () => {
    setForm({
      paymentMode: "cash",
      amount: "",
      note: "",
      type: entityType === "partner" ? "credit" : "sell",
      deviceId: "",
    });
    setDeviceSearch("");
  };

  useEffect(() => {
    if (entityType === "partner") {
      setForm(prev => ({ ...prev, type: "credit" }));
    }
  }, [entityType]);

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

      if ((form.type === "sell" || form.type === "return" || form.type === "investment") && !form.paymentMode) {
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

      const payload: any = {
        amount: parseFloat(form.amount),
        type: form.type,
        note: form.note,
        date: new Date().toISOString(),
      };

      if (form.type === "sell" || form.type === "return" || form.type === "investment") {
        payload.paymentMode = form.paymentMode;
        payload.vendorId = entityType === "vendor" ? entityId : undefined;
      }

      if (form.type === "return" && (entityType === "device" || form.deviceId)) {
        payload.deviceId = entityType === "device" ? entityId : form.deviceId;
      }

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
              onValueChange={(value: TransactionForm["type"]) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityType === "partner" ? (
                  <>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {(form.type === "return" || form.type === "sell" || form.type === "investment") && (
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
          )}

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
                  <div className="p-2">
                    <Input
                      placeholder="Search devices..."
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                      className="mb-2"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {devices
                    .filter((device) => {
                      // Filter devices sold to this vendor
                      const soldToVendor = entityType === "vendor" && device.sellHistory?.some((history: any) => 
                        history.type === 'sell' && history.vendor?._id === entityId
                      );
                      
                      // Apply search filter
                      const matchesSearch = !deviceSearch || 
                        device.deviceId?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                        device.brand?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                        device.model?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                        device.imei1?.toLowerCase().includes(deviceSearch.toLowerCase());
                      
                      return (entityType === "vendor" ? soldToVendor : true) && matchesSearch;
                    })
                    .map((device) => (
                      <SelectItem key={device._id} value={device._id}>
                        {device.deviceId} - {device.brand} {device.model}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                setForm((prev) => ({ ...prev, amount: e.target.value }))
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
