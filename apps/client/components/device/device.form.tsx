/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";

import { createDevice, updateDevice, getEmployeesForPartner } from "@/services/deviceService";
import { getAllCompanies, getCompanyById } from "@/services/companyService";
import { getAllVendors } from "@/services/vendorService";
import { getCurrentUser } from "@/services/authService";
import {
  createDeviceSchema,
  updateDeviceSchema,
  DeviceFormData,
} from "./device.schema";

interface DeviceFormProps {
  mode: "create" | "edit" | "view";
  deviceId?: string;
  defaultValues?: Partial<DeviceFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DeviceForm({
  mode,
  deviceId,
  defaultValues,
  onSuccess,
  onCancel,
}: DeviceFormProps) {
  const router = useRouter();

  const [vendors, setVendors] = useState<{ _id: string; name: string }[]>([]);
  const [companies, setCompanies] = useState<
    { _id: string; name: string; creditValue: number; companyIds?: string[] }[]
  >([]);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [perCredit, setPerCredit] = useState<number | undefined>(undefined);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(
      mode === "create" ? createDeviceSchema : updateDeviceSchema
    ),
    defaultValues: (() => {
      if (!defaultValues) {
        return {
          vendorId: "",
          companyIds: "",
          selectedCompanyIds: "",
          date: new Date().toISOString().split('T')[0],
          serviceNumber: "",
          brand: "",
          model: "",
          imei1: "",
          imei2: "",
          initialCost: undefined,
          cost: undefined,
          extraAmount: undefined,
          credit: undefined,
          perCredit: undefined,
          commission: undefined,
          gst: undefined,
          totalCost: undefined,
          selling: undefined,
          profit: undefined,
          pickedBy: "",
          box: "no",
          warranty: "",
          isActive: true,
        };
      }
      
      // Normalize object IDs to strings
      const normalized = { ...defaultValues };
      if (normalized.vendorId && typeof normalized.vendorId === 'object') {
        normalized.vendorId = (normalized.vendorId as any)._id || '';
      }
      if (normalized.companyIds && typeof normalized.companyIds === 'object') {
        normalized.companyIds = (normalized.companyIds as any)._id || '';
      }
      if (normalized.pickedBy && typeof normalized.pickedBy === 'object') {
        normalized.pickedBy = (normalized.pickedBy as any)._id || '';
      }
      return normalized;
    })(),
  });

  // Fetch vendors, companies, employees, and current user on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [vendorRes, companyRes, employeeRes, userRes] = await Promise.all([
          getAllVendors({ limit: 0 }),
          getAllCompanies({ limit: 0 }),
          getEmployeesForPartner(),
          getCurrentUser(),
        ]);
        setVendors(vendorRes.data.vendors || []);
        setCompanies(companyRes.data.companies || []);
        setEmployees(employeeRes.data || []);
        setCurrentUser(userRes.data);
        
        // If employee and creating new device, set pickedBy to current user
        if (mode === "create" && userRes.data?.role === "employee" && !defaultValues?.pickedBy) {
          form.setValue("pickedBy", userRes.data._id);
        }
      } catch (err: any) {
        toast.error("Failed to fetch data");
      }
    }
    fetchData();
  }, []);

  // Initialize perCredit and selectedCompanyIds if company is already selected (edit mode)
  useEffect(() => {
    const companyIds = form.getValues("companyIds");
    if (companyIds && companies.length > 0) {
      const id = typeof companyIds === 'object' && companyIds ? (companyIds as any)._id : companyIds;
      if (id) {
        handleCompanyChangeForEdit(id);
      }
    }
  }, [companies]);

  // Handle company change for edit mode (preserves existing selectedCompanyIds)
  const handleCompanyChangeForEdit = async (companyIds: string) => {
    try {
      const res = await getCompanyById(companyIds);
      const creditValue = res.data.creditValue;
      const companyIdsList = res.data.companyIds || [];
      setPerCredit(creditValue);
      setSelectedCompanyIds(companyIdsList);
      form.setValue("perCredit", creditValue);
      // Don't reset selectedCompanyIds in edit mode
    } catch (err: any) {
      console.error("Error fetching company:", err);
    }
  };

  // Handle company change
  const handleCompanyChange = async (companyIds: string) => {
    form.setValue("companyIds", companyIds);

    if (!companyIds) {
      form.setValue("perCredit", undefined);
      setPerCredit(undefined);
      return;
    }

    try {
      const res = await getCompanyById(companyIds);
      // Updated path to match your API
      const creditValue = res.data.creditValue;
      const companyIdsList = res.data.companyIds || [];
      console.log('Company IDs from API:', companyIdsList);
      setPerCredit(creditValue);
      setSelectedCompanyIds(companyIdsList);
      form.setValue("perCredit", creditValue);
      form.setValue("selectedCompanyIds", "");
    } catch (err: any) {
      console.error("Error fetching company:", err);
      toast.error("Failed to fetch company details");
    }
  };

  // Watch fields that affect calculations
  useEffect(() => {
    const subscription = form.watch((values) => {
      const { credit, perCredit, cost, extraAmount, gst, selling } = values;

      if (credit === undefined || perCredit === undefined) return;

      const commission = credit * perCredit; // Commission = credit * perCredit
      const totalCost =
        (cost || 0) + (extraAmount || 0) + commission + (gst || 0);
      const profit = (selling || 0) - totalCost;

      // Only update if different
      if (commission !== values.commission)
        form.setValue("commission", commission);
      if (totalCost !== values.totalCost) form.setValue("totalCost", totalCost);
      if (profit !== values.profit) form.setValue("profit", profit);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: any) => {
    try {
      // Clean data to ensure IDs are strings, not objects
      const cleanData = { ...data };
      if (cleanData.vendorId && typeof cleanData.vendorId === 'object') {
        cleanData.vendorId = cleanData.vendorId._id || cleanData.vendorId;
      }
      if (cleanData.companyIds && typeof cleanData.companyIds === 'object') {
        cleanData.companyIds = cleanData.companyIds._id || cleanData.companyIds;
      }
      
      console.log('Form data being submitted:', cleanData);

      if (mode === "create") {
        const response = await createDevice(cleanData);
        toast.success(response.message || "Device created successfully");
        onSuccess ? onSuccess() : router.push("/device");
      } else if (mode === "edit" && deviceId) {
        const response = await updateDevice(deviceId, cleanData);
        toast.success(response.message || "Device updated successfully");
        onSuccess ? onSuccess() : router.push("/device");
      }
    } catch (err: any) {
      console.error("Error object:", err);
      let errorMessage = `Failed to ${mode} device`;
      if (err?.response?.data) {
        errorMessage =
          err.response.data.message ||
          err.response.data.error?.message ||
          errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  const renderInputField = (
    name: keyof DeviceFormData,
    label: string,
    type: string = "text",
    readOnlyOverride?: boolean
  ) => {
    const isReadOnly = readOnlyOverride ?? mode === "view";
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type={type}
                step="any"
                placeholder={`Enter ${label}`}
                {...field}
                value={field.value?.toString() || ""}
                readOnly={isReadOnly}
                style={{
                  ...(type === "number" ? { MozAppearance: "textfield" } : {}),
                  ...(isReadOnly ? { cursor: "not-allowed" } : {})
                }}
                className={`${
                  type === "number"
                    ? "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    : ""
                } ${
                  isReadOnly ? "bg-gray-50 text-gray-600" : ""
                }`}
                onWheel={(e) => type === "number" && e.currentTarget.blur()}
                onChange={(e) =>
                  type === "number"
                    ? field.onChange(
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    : field.onChange(e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Vendor Dropdown */}
        <FormField
          control={form.control}
          name="vendorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sold To</FormLabel>
              <FormControl>
                <Select
                  value={typeof field.value === 'object' && field.value ? (field.value as any)._id : field.value}
                  onValueChange={field.onChange}
                  disabled={mode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v._id} value={v._id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Dropdown */}
        <FormField
          control={form.control}
          name="companyIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Select
                  value={typeof field.value === 'object' && field.value ? (field.value as any)._id : field.value}
                  onValueChange={handleCompanyChange}
                  disabled={mode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Company ID Dropdown */}
        {selectedCompanyIds.length > 0 && (
          <FormField
            control={form.control}
            name="selectedCompanyIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company ID</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === "view"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCompanyIds.map((id, index) => {
                        console.log(`Rendering company ID ${index}:`, id);
                        return (
                          <SelectItem key={`${id}-${index}`} value={id}>
                            {id}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Date field */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  readOnly={mode === "view"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Other fields */}
        {renderInputField("serviceNumber", "Service Number")}
        {renderInputField("brand", "Brand")}
        {renderInputField("model", "Model")}
        {renderInputField("imei1", "IMEI1")}
        {renderInputField("imei2", "IMEI2")}
        {renderInputField("initialCost", "Initial Cost", "number", mode === "edit")}
        {renderInputField("cost", "Cost", "number", mode === "edit")}
        {renderInputField("extraAmount", "Extra Amount", "number", mode === "edit")}
        {renderInputField("credit", "Credit", "number", mode === "edit")}
        {renderInputField("perCredit", "Per Credit", "number", true)}
        {renderInputField("commission", "Commission", "number", true)}
        {renderInputField("gst", "GST", "number", mode === "edit")}
        {renderInputField("totalCost", "Total Cost", "number", true)}
        {renderInputField("selling", "Selling", "number", mode === "edit")}
        {renderInputField("profit", "Profit", "number", true)}
        
        {/* Picked By - Dropdown for partners, read-only for employees */}
        <FormField
          control={form.control}
          name="pickedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Picked By</FormLabel>
              <FormControl>
                {currentUser?.role === "employee" ? (
                  <Input
                    value={currentUser?.name || ""}
                    readOnly
                    className="bg-gray-50"
                  />
                ) : (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === "view"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Box yes/no */}
        <FormField
          control={form.control}
          name="box"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormLabel>Box</FormLabel>
              <Switch
                checked={field.value === "yes"}
                onCheckedChange={(val) => field.onChange(val ? "yes" : "no")}
                disabled={mode === "view"}
              />
            </FormItem>
          )}
        />
        {renderInputField("warranty", "Warranty")}

        {/* Buttons */}
        {mode !== "view" && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              {mode === "create" ? "Create Device" : "Update Device"}
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
