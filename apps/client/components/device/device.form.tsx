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
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { createDevice, updateDevice, getEmployeesForPartner } from "@/services/deviceService";
import { getAllCompanies, getCompanyById } from "@/services/companyService";
import { getAllVendors, createVendor } from "@/services/vendorService";
import { getCurrentUser } from "@/services/authService";
import {
  createDeviceSchema,
  updateDeviceSchema,
  DeviceFormData,
} from "./device.schema";
import { AddTransactionDialog } from "@/components/global/add-transaction-dialog";

interface DeviceFormProps {
  mode: "create" | "edit" | "view";
  deviceId?: string;
  defaultValues?: Partial<DeviceFormData> & {
    sellHistory?: {
      type: "sell" | "return";
      vendor: { _id: string; name: string };
      selling?: number;
      returnAmount?: number;
      amount?: number;
      createdAt: string;
    }[];
  };
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
  const [isSold, setIsSold] = useState(false);
  const [deviceState, setDeviceState] = useState<"new" | "sold" | "return">("new");
  const [hasPreviouslySoldData, setHasPreviouslySoldData] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filteredVendors, setFilteredVendors] = useState<{ _id: string; name: string }[]>([]);

  // Determine device state based on sellHistory
  useEffect(() => {
    if (defaultValues?.sellHistory && defaultValues.sellHistory.length > 0) {
      const lastEntry = defaultValues.sellHistory[defaultValues.sellHistory.length - 1];
      if (lastEntry?.type === "sell") {
        setDeviceState("sold");
        setIsSold(true);
        setHasPreviouslySoldData(true);
      } else if (lastEntry?.type === "return") {
        setDeviceState("return");
        setIsSold(true);
      }
    } else {
      setDeviceState("new");
      setIsSold(false);
    }
  }, [defaultValues, mode]);

  const form = useForm({
    resolver: zodResolver(
      mode === "create" ? createDeviceSchema : updateDeviceSchema
    ),
    defaultValues: (() => {
      if (!defaultValues) {
        return {
          companyIds: "",
          selectedCompanyIds: "",
          soldTo: "",
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
          issues: "",
          isActive: true,
        };
      }
      
      // Normalize object IDs to strings
      const normalized = { ...defaultValues };
      if (normalized.companyIds && typeof normalized.companyIds === 'object') {
        normalized.companyIds = (normalized.companyIds as any)._id || '';
      }
      if (normalized.pickedBy && typeof normalized.pickedBy === 'object') {
        normalized.pickedBy = (normalized.pickedBy as any)._id || '';
      }
      // Extract vendor from sellHistory for edit mode
      if ((normalized as any).sellHistory && (normalized as any).sellHistory.length > 0) {
        const lastEntry = (normalized as any).sellHistory[(normalized as any).sellHistory.length - 1];
        
        if (lastEntry) {
          normalized.soldTo = typeof lastEntry.vendor === 'object' ? lastEntry.vendor._id : lastEntry.vendor;
          
          if (lastEntry.type === 'sell') {
            normalized.selling = lastEntry.selling || lastEntry.amount;
          } else if (lastEntry.type === 'return') {
            normalized.selling = lastEntry.returnAmount || lastEntry.amount;
          }
        }
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
        setFilteredVendors(vendorRes.data.vendors || []);
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

  // Filter vendors based on search
  useEffect(() => {
    const filtered = vendors.filter((v) => 
      v.name.toLowerCase().includes(vendorSearch.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [vendors, vendorSearch]);

  const handleCreateVendor = async () => {
    if (!vendorSearch.trim()) return;
    
    try {
      const response = await createVendor({ name: vendorSearch.trim() });
      const newVendor = response.data;
      setVendors(prev => [...prev, newVendor]);
      form.setValue("soldTo", newVendor._id);
      setVendorSearch("");
      toast.success("Vendor created successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create vendor");
    }
  };

  const handleAddTransaction = () => {
    const soldTo = form.getValues("soldTo");
    if (!soldTo) {
      toast.error("Please select a vendor first");
      return;
    }
    setShowTransactionDialog(true);
  };

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
      const creditValue = res.data.creditValue;
      const companyIdsList = res.data.companyIds || [];
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

      // Convert to numbers for calculations
      const creditNum = typeof credit === 'string' ? parseFloat(credit) || 0 : credit;
      const perCreditNum = typeof perCredit === 'string' ? parseFloat(perCredit) || 0 : perCredit;
      const costNum = typeof cost === 'string' ? parseFloat(cost) || 0 : cost || 0;
      const extraAmountNum = typeof extraAmount === 'string' ? parseFloat(extraAmount) || 0 : extraAmount || 0;
      const gstNum = typeof gst === 'string' ? parseFloat(gst) || 0 : gst || 0;
      const sellingNum = selling ? (typeof selling === 'string' ? parseFloat(selling) : selling) : undefined;

      const commission = creditNum * perCreditNum;
      const totalCost = costNum + extraAmountNum + commission + gstNum;
      const profit = sellingNum !== undefined ? sellingNum - totalCost : undefined;

      if (commission !== values.commission) form.setValue("commission", commission);
      if (totalCost !== values.totalCost) form.setValue("totalCost", totalCost);
      if (!isSubmitting && profit !== values.profit) {
        form.setValue("profit", profit);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const cleanData = { ...data };
      if (cleanData.companyIds && typeof cleanData.companyIds === 'object') {
        cleanData.companyIds = cleanData.companyIds._id || cleanData.companyIds;
      }
      
      // Convert selling to number if it's a string
      if (cleanData.selling && typeof cleanData.selling === 'string') {
        cleanData.selling = parseFloat(cleanData.selling) || undefined;
      }

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
      let errorMessage = `Failed to ${mode} device`;
      if (err?.response?.data) {
        errorMessage = err.response.data.message || err.response.data.error?.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
                className={isReadOnly ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""}
                onChange={(e) =>
                  type === "number"
                    ? field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
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

  const renderDisplayField = (name: keyof DeviceFormData, label: string) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 font-medium">
              {field.value?.toString() || "0"}
            </div>
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                          <div className="p-2">
                            <Input
                              placeholder="Search companies..."
                              value={companySearch}
                              onChange={(e) => setCompanySearch(e.target.value)}
                              className="mb-2"
                              onKeyDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {companies
                            .filter((c) => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                            .map((c) => (
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
                            {selectedCompanyIds.map((id, index) => (
                              <SelectItem key={`${id}-${index}`} value={id}>
                                {id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderInputField("serviceNumber", "Service Number")}
              {renderInputField("brand", "Brand")}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {renderInputField("model", "Model")}
              {renderInputField("warranty", "Warranty")}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div></div>
            </div>

            <FormField
              control={form.control}
              name="issues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issues</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any issues with the device"
                      {...field}
                      readOnly={mode === "view"}
                      className={mode === "view" ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                          className="bg-gray-50 cursor-not-allowed"
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
                            <div className="p-2">
                              <Input
                                placeholder="Search employees..."
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                className="mb-2"
                                onKeyDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            {employees
                              .filter((employee) => employee.name.toLowerCase().includes(employeeSearch.toLowerCase()))
                              .map((employee) => (
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
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Picked Date</FormLabel>
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
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderInputField("imei1", "IMEI1")}
              {renderInputField("imei2", "IMEI2")}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderInputField("initialCost", "Initial Cost", "number", mode === "edit")}
            
            <div className="grid grid-cols-3 gap-4">
              {renderInputField("cost", "Purchased Cost", "number", mode === "edit")}
              {renderInputField("extraAmount", "Extra Amount", "number", mode === "edit")}
              {renderInputField("gst", "GST", "number", mode === "edit")}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {renderInputField("credit", "Credits", "number", mode === "edit")}
              {renderDisplayField("perCredit", "Per Credit Value")}
              {renderDisplayField("commission", "Commission")}
            </div>
            
            {renderDisplayField("totalCost", "Total Cost")}
          </CardContent>
        </Card>

        {/* Sales Information */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <FormItem className="flex items-center gap-2">
                <FormLabel>Sold</FormLabel>
                <Switch
                  checked={isSold}
                  onCheckedChange={(checked) => {
                    setIsSold(checked);
                    if (!checked) {
                      form.setValue("selling", undefined);
                      form.setValue("soldTo", "");
                    }
                  }}
                  disabled={mode === "view"}
                />
              </FormItem>
              
              {mode !== "view" && isSold && (
                <Button
                  type="button"
                  onClick={handleAddTransaction}
                  disabled={!form.watch("soldTo") || !form.watch("selling")}
                >
                  Add Transaction
                </Button>
              )}
            </div>

            {isSold && (
              <>
                <FormField
                  control={form.control}
                  name="soldTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sold To</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={mode === "view" || (deviceState === "sold" && hasPreviouslySoldData)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2">
                              <Input
                                placeholder="Search vendors..."
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                className="mb-2"
                                onKeyDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            {filteredVendors.map((v) => (
                              <SelectItem key={v._id} value={v._id}>
                                {v.name}
                              </SelectItem>
                            ))}
                            {vendorSearch && filteredVendors.length === 0 && (
                              <div className="p-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={handleCreateVendor}
                                >
                                  Add &quot;{vendorSearch}&quot; as new vendor
                                </Button>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="selling"
                    render={({ field }) => {
                      const isReadOnly = mode === "view" || (deviceState === "sold" && hasPreviouslySoldData);
                      return (
                        <FormItem>
                          <FormLabel>Selling Cost</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="Enter Selling Cost"
                              readOnly={isReadOnly}
                              className={isReadOnly ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  {renderDisplayField("profit", "Profit/Loss")}
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
      
      <AddTransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        entityId={form.getValues("soldTo") || ""}
        entityType="vendor"
        deviceContext={mode === "edit" && deviceId ? {
          deviceId: deviceId,
          sellHistory: defaultValues?.sellHistory || []
        } : undefined}
        mode={mode === "create" ? "add" : "edit"}
        isNewDevice={mode === "create"}
        onSuccess={() => {
          toast.success("Transaction added successfully");
        }}
      />
    </Form>
  );
}