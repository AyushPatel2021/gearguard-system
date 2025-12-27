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
import { Redirect } from "wouter";
import { Wrench } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const onSubmit = (data: LoginValues) => {
    loginMutation.mutate(data);
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

      {/* Right Panel: Login Form */}
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl shadow-slate-200/50 border-slate-100">
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-2xl font-display font-bold">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base shadow-lg shadow-primary/25 mt-2" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Authenticating..." : "Sign In"}
                </Button>
                
                {/* Demo Credentials Hint */}
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">Demo Credentials:</p>
                  <p>Admin: admin / admin123</p>
                  <p>Technician: tech / tech123</p>
                  <p>Employee: user / user123</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
