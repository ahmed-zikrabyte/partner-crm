/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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
import { registerPartner, updatePartner } from "@/services/partnerService";
import {
  createPartnerSchema,
  updatePartnerSchema,
  type PartnerFormData,
} from "./partner.schema";

interface PartnerFormProps {
  mode: "create" | "edit" | "view";
  partnerId?: string;
  defaultValues?: Partial<PartnerFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PartnerForm({
  mode,
  partnerId,
  defaultValues,
  onSuccess,
  onCancel,
}: PartnerFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
  };

  const form = useForm({
    resolver: zodResolver(
      mode === "create" ? createPartnerSchema : updatePartnerSchema
    ),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
      ...(mode === "create" && { password: "" }),
      isActive: true,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (mode === "create") {
        const response = await registerPartner(data);
        toast.success(response.message || "Partner created successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/partners");
        }
      } else if (mode === "edit" && partnerId) {
        // Only send fields that are present (password optional)
        const response = await updatePartner(partnerId, data);
        toast.success(response.message || "Partner updated successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/partners");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || `Failed to ${mode} partner`);
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
                  placeholder="Enter name"
                  {...field}
                  readOnly={mode === "view"}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[a-zA-Z\s]*$/.test(value) || value === "") {
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter email"
                  {...field}
                  readOnly={mode === "view"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter phone"
                  {...field}
                  readOnly={mode === "view"}
                  maxLength={10}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) || value === "") {
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />



        {/* Password: only in create or edit mode if needed */}
        {mode === "create" && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                    >
                      Generate
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Action Buttons */}
        {mode !== "view" && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              {mode === "create" ? "Create Partner" : "Update Partner"}
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
