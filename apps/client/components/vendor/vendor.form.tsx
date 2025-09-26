/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { createVendor, updateVendor } from "@/services/vendorService";
import {
  createVendorSchema,
  updateVendorSchema,
  type VendorFormData,
} from "./vendor.schema";

interface VendorFormProps {
  mode: "create" | "edit" | "view";
  vendorId?: string;
  defaultValues?: Partial<VendorFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VendorForm({
  mode,
  vendorId,
  defaultValues,
  onSuccess,
  onCancel,
}: VendorFormProps) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(mode === "create" ? createVendorSchema : updateVendorSchema),
    defaultValues: defaultValues || {
      name: "",
      amount: undefined,
      isActive: true,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (mode === "create") {
        const response = await createVendor(data);
        toast.success(response.message || "Vendor created successfully");
        onSuccess ? onSuccess() : router.push("/vendors");
      } else if (mode === "edit" && vendorId) {
        const response = await updateVendor(vendorId, data);
        toast.success(response.message || "Vendor updated successfully");
        onSuccess ? onSuccess() : router.push("/vendors");
      }
    } catch (err: any) {
      console.error('Error:', err);
      let errorMessage = `Failed to ${mode} vendor`;
      if (err?.response?.data) {
        errorMessage = err.response.data.message || err.response.data.error?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter vendor name" {...field} readOnly={mode === "view"} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount - Only show in view mode */}
        {mode === "view" && (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    {...field}
                    readOnly={mode === "view"}
                    min="0"
                    style={{ MozAppearance: 'textfield' }}
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Buttons */}
        {mode !== "view" && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">{mode === "create" ? "Create Vendor" : "Update Vendor"}</Button>
          </div>
        )}

        {mode === "view" && onCancel && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Close
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}