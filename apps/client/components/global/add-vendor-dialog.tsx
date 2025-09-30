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
import { createVendor } from "@/services/vendorService";
import { toast } from "sonner";

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (vendor: { _id: string; name: string }) => void;
}

export function AddVendorDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddVendorDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter vendor name");
      return;
    }

    try {
      setLoading(true);
      const response = await createVendor({ name: name.trim() });
      toast.success("Vendor created successfully");
      onSuccess?.(response.data);
      onOpenChange(false);
      setName("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Vendor Name</Label>
            <Input
              id="name"
              placeholder="Enter vendor name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Vendor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}