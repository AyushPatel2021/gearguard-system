import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { Wrench, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

const resetPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const { resetPasswordMutation } = useAuth();
    const params = useParams<{ token: string }>();
    const [, setLocation] = useLocation();
    const [resetSuccess, setResetSuccess] = useState(false);

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ResetPasswordValues) => {
        try {
            await resetPasswordMutation.mutateAsync({
                token: params.token || "",
                password: data.password,
            });
            setResetSuccess(true);
        } catch (error) {
            // Error is handled by mutation
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">
            {/* Left Panel: Hero */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                        <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-display font-bold tracking-tight">GearGuard</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-display font-bold leading-tight mb-6">
                        Reset Your Password
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        Create a new secure password for your GearGuard account.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-slate-500 font-medium">
                    © 2025 GearGuard Systems Inc.
                </div>
            </div>

            {/* Right Panel: Reset Form */}
            <div className="flex items-center justify-center p-8">
                <Card className="w-full max-w-md shadow-2xl shadow-slate-200/50 border-slate-100">
                    <CardHeader className="space-y-1 text-center pb-8">
                        {resetSuccess ? (
                            <>
                                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl font-display font-bold">Password Reset!</CardTitle>
                                <CardDescription>
                                    Your password has been successfully reset.
                                </CardDescription>
                            </>
                        ) : (
                            <>
                                <CardTitle className="text-2xl font-display font-bold">Create New Password</CardTitle>
                                <CardDescription>
                                    Enter your new password below
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent>
                        {resetSuccess ? (
                            <Button
                                onClick={() => setLocation("/auth")}
                                className="w-full h-11 text-base shadow-lg shadow-primary/25"
                            >
                                Go to Login
                            </Button>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        {...field}
                                                        className="h-11 bg-slate-50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        {...field}
                                                        className="h-11 bg-slate-50"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full h-11 text-base shadow-lg shadow-primary/25 mt-2"
                                        disabled={resetPasswordMutation.isPending}
                                    >
                                        {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => setLocation("/auth")}
                                    >
                                        Back to Login
                                    </Button>
                                </form>
                            </Form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
