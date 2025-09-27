/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
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
import { createCompany, updateCompany } from "@/services/companyService";
import {
  createCompanySchema,
  updateCompanySchema,
  type CompanyFormData,
} from "./company.schema";

interface CompanyFormProps {
  mode: "create" | "edit" | "view";
  companyIds?: string;
  defaultValues?: Partial<CompanyFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CompanyForm({
  mode,
  companyIds,
  defaultValues,
  onSuccess,
  onCancel,
}: CompanyFormProps) {
  const router = useRouter();
  const [companyIdsInput, setCompanyIdsInput] = useState(
    defaultValues?.companyIds?.join(', ') || ''
  );

  const form = useForm({
    resolver: zodResolver(
      mode === "create" ? createCompanySchema : updateCompanySchema
    ),
    defaultValues: defaultValues || {
      name: "",
      creditValue: undefined,
      companyIds: [],
      isActive: true,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (mode === "create") {
        const response = await createCompany(data);
        toast.success(response.message || "Company created successfully");
        onSuccess ? onSuccess() : router.push("/companies");
      } else if (mode === "edit" && companyIds) {
        const response = await updateCompany(companyIds, data);
        toast.success(response.message || "Company updated successfully");
        onSuccess ? onSuccess() : router.push("/companies");
      }
    } catch (err: any) {
      console.error('Full error object:', err);
      console.log('Error response:', err?.response);
      console.log('Error data:', err?.response?.data);
      
      let errorMessage = `Failed to ${mode} company`;
      
      if (err?.response?.data) {
        errorMessage = err.response.data.message || err.response.data.error?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      console.log('Final error message:', errorMessage);
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
                <Input
                  placeholder="Enter company name"
                  {...field}
                  readOnly={mode === "view"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Credit Value */}
        <FormField
          control={form.control}
          name="creditValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter credit value (e.g., 12.5)"
                  {...field}
                  readOnly={mode === "view"}
                  min="0"
                  style={{ MozAppearance: 'textfield' }}
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : parseFloat(value) || 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company IDs */}
        <FormField
          control={form.control}
          name="companyIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company IDs</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter company IDs separated by commas"
                  value={companyIdsInput}
                  readOnly={mode === "view"}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCompanyIdsInput(value);
                    const ids = value ? value.split(',').map(id => id.trim()).filter(id => id) : [];
                    field.onChange(ids);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* Buttons */}
        {mode !== "view" && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              {mode === "create" ? "Create Company" : "Update Company"}
            </Button>
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
