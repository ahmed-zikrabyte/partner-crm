"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

interface ConfirmationModalProps {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "destructive" | "warning" | "info";
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  title,
  description,
  open,
  onOpenChange,
  type = "info",
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (type) {
      case "destructive":
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case "destructive":
        return "destructive" as const;
      case "warning":
        return "default" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button
            className="text-white"
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
