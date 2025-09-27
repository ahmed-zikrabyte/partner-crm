/* eslint-disable @typescript-eslint/no-unused-expressions */
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
import { createEmployee, updateEmployee } from "@/services/employeeService";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type EmployeeFormData,
  type EmployeeUpdateData,
} from "./employee.schema";

interface EmployeeFormProps {
  mode: "create" | "edit" | "view";
  employeeId?: string;
  defaultValues?: Partial<EmployeeFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmployeeForm({
  mode,
  employeeId,
  defaultValues,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
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
      mode === "create" ? createEmployeeSchema : updateEmployeeSchema
    ),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
      password: "",
      salaryPerDay: undefined,
    },
  });

  const onSubmit = async (data: EmployeeFormData | EmployeeUpdateData) => {
    try {
      if (mode === "create") {
        const response = await createEmployee(data as EmployeeFormData);
        toast.success(response.message || "Employee created successfully");
        onSuccess ? onSuccess() : router.push("/employees");
      } else if (mode === "edit" && employeeId) {
        const response = await updateEmployee(employeeId, data);
        toast.success(response.message || "Employee updated successfully");
        onSuccess ? onSuccess() : router.push("/employees");
      }
    } catch (err: any) {
      console.error("Error:", err);
      let errorMessage = `Failed to ${mode} employee`;
      if (err?.response?.data) {
        errorMessage = err.response.data.message || errorMessage;
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
                <Input
                  placeholder="Enter employee name"
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
                  type="email"
                  placeholder="Enter email address"
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
                  placeholder="Enter phone number"
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

        {/* Password */}
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

        {/* Salary Per Day */}
        <FormField
          control={form.control}
          name="salaryPerDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salary Per Day</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter salary per day"
                  {...field}
                  value={field.value?.toString() || ""}
                  readOnly={mode === "view"}
                  style={{ MozAppearance: "textfield" }}
                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
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
              {mode === "create" ? "Create Employee" : "Update Employee"}
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
