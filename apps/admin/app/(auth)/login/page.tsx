"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { login } from "@/services/authService";
import { Button } from "@workspace/ui/components/button";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await login(data.email, data.password);
      localStorage.setItem("adminToken", response.data.token);
      router.push("/partner?type=partner");
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error.response.message || "Failed to login");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400">Sign in to manage your products</p>
        </div>

        <Card className="bg-gray-950 border border-gray-800 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">
              Welcome Back 👋
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Please enter your credentials below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<LoginForm, "email">;
                  }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            type="email"
                            placeholder="admin@company.com"
                            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-white"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<LoginForm, "password">;
                  }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-white"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-200"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-white text-gray-900 hover:bg-gray-200 font-medium py-2"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-xs text-gray-500">
          © 2025 Partner CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
