import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import { useMemo } from "react";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().regex(passwordRegex, "Must be at least 12 characters, include upper/lower, number, and special character"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 12) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[a-z]/.test(password)) s += 1;
    if (/\d/.test(password)) s += 1;
    if (/[@$!%*?&]/.test(password)) s += 1;
    return s;
  }, [password]);

  const strengthColor = [
    "bg-destructive",
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-primary",
    "bg-primary"
  ][score];

  const strengthLabel = [
    "Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Very Strong"
  ][score];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className={score >= 4 ? "text-primary" : "text-muted-foreground"}>{strengthLabel}</span>
      </div>
      <div className="flex h-1 gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-full flex-1 rounded-full ${score >= level ? strengthColor : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useRegister();
  const password = form.watch("password");

  function onSubmit(data: RegisterFormValues) {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token);
          toast({
            title: "Identity registered",
            description: "Welcome to VaultGuard.",
          });
          setLocation("/");
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: err.data?.error || "Could not create account.",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border shadow-2xl bg-card">
        <CardHeader className="space-y-1 items-center pb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Initialize Identity
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create a secure VaultGuard profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="bg-input/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} className="bg-input/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} className="bg-input/50" />
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
                    <FormLabel>Master Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-input/50" />
                    </FormControl>
                    <PasswordStrengthIndicator password={password} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Generating keys..." : "Register Identity"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an identity? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Authenticate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
