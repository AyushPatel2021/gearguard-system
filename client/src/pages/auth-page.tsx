import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Redirect } from "wouter";
import { Wrench, Mail } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, forgotPasswordMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("signin");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: LoginValues) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterValues) => {
    registerMutation.mutate({
      username: data.username,
      email: data.email,
      password: data.password,
      name: data.name,
    });
  };

  const onForgotPassword = async (data: ForgotPasswordValues) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      setForgotPasswordSent(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">
      {/* Left Panel: Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        {/* Abstract Background Shapes */}
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
            Intelligent Maintenance Management
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Streamline your operations, track equipment health, and boost team productivity with our enterprise-grade CMMS solution.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © 2025 GearGuard Systems Inc.
        </div>
      </div>

      {/* Right Panel: Auth Forms */}
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl shadow-slate-200/50 border-slate-100">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-display font-bold">Welcome to GearGuard</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="jdoe" {...field} className="h-11 bg-slate-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Forgot Password Link */}
                    <div className="text-right">
                      <Dialog open={forgotPasswordOpen} onOpenChange={(open) => {
                        setForgotPasswordOpen(open);
                        if (!open) {
                          setForgotPasswordSent(false);
                          forgotPasswordForm.reset();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="px-0 text-sm text-primary hover:text-primary/80">
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              {forgotPasswordSent
                                ? "Check your email for a reset link"
                                : "Enter your email and we'll send you a reset link"
                              }
                            </DialogDescription>
                          </DialogHeader>
                          {forgotPasswordSent ? (
                            <div className="flex flex-col items-center py-6">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-green-600" />
                              </div>
                              <p className="text-center text-muted-foreground">
                                If an account exists with that email, you'll receive a password reset link shortly.
                              </p>
                              <Button
                                className="mt-4"
                                onClick={() => {
                                  setForgotPasswordOpen(false);
                                  setForgotPasswordSent(false);
                                  forgotPasswordForm.reset();
                                }}
                              >
                                Done
                              </Button>
                            </div>
                          ) : (
                            <Form {...forgotPasswordForm}>
                              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                                <FormField
                                  control={forgotPasswordForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="email"
                                          placeholder="you@example.com"
                                          {...field}
                                          className="h-11"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="submit"
                                  className="w-full h-11"
                                  disabled={forgotPasswordMutation.isPending}
                                >
                                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                                </Button>
                              </form>
                            </Form>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-base shadow-lg shadow-primary/25"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>

                    {/* Demo Credentials Hint */}
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-muted-foreground">
                      <p className="font-semibold mb-1">Demo Credentials:</p>
                      <p>Admin: admin / admin123</p>
                      <p>Technician: tech / tech123</p>
                      <p>Employee: user / user123</p>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="h-11 bg-slate-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} className="h-11 bg-slate-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} className="h-11 bg-slate-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} className="h-11 bg-slate-50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 text-base shadow-lg shadow-primary/25 mt-2"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
