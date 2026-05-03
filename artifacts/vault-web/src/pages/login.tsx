import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
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
import { Lock, Info } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_USERS = [
  { label: "Admin", username: "master", password: "Otopodomundo182*", email: "master@local.com" },
  { label: "Usuário", username: "demo", password: 'DC9H"lz70O\\8aa', email: "demo@local.com" },
];

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useLogin();

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token);
          toast({
            title: "Acesso concedido",
            description: "Bem-vindo ao VaultGuard.",
          });
          setLocation("/");
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Acesso negado",
            description: (err.data as any)?.error || "Credenciais inválidas.",
          });
        },
      }
    );
  }

  function fillDemo(username: string, password: string) {
    form.setValue("username", username);
    form.setValue("password", password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <Card className="border-border shadow-2xl bg-card">
          <CardHeader className="space-y-1 items-center pb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              VaultGuard
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Insira suas credenciais para acessar o cofre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="usuario" {...field} className="bg-input/50" autoComplete="username" />
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="bg-input/50" autoComplete="current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Autenticando..." : "Autenticar"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Solicitar acesso
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary/70" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Credenciais de demonstração
              </span>
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => fillDemo(u.username, u.password)}
                  className="w-full text-left rounded-md border border-border/40 bg-background/50 px-3 py-2 hover:bg-primary/5 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">{u.label}</span>
                        <span className="text-xs text-muted-foreground font-mono">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-foreground/80 font-mono">user: <span className="text-foreground">{u.username}</span></span>
                        <span className="text-xs text-foreground/80 font-mono">pass: <span className="text-foreground">{u.password}</span></span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                      Preencher →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
