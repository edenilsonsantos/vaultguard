import { z } from "zod";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useLogin,
  useGetSettings,
  useVerifyTwoFactor,
  checkPasswordReset,
  setInitialPassword,
} from "@workspace/api-client-react";
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
import { Lock, Info, ShieldCheck, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const newPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(12, "Mínimo 12 caracteres")
    .regex(/[A-Z]/, "Precisa de maiúscula")
    .regex(/[a-z]/, "Precisa de minúscula")
    .regex(/[0-9]/, "Precisa de número")
    .regex(/[^A-Za-z0-9]/, "Precisa de caractere especial"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

const DEMO_USERS = [
  { label: "Admin", username: "demo_admin", password: 'DC9H"lz70O\\8aa', email: "demo_admin@local.com" },
  { label: "Usuário", username: "demo_user", password: 'DC9H"lz70O\\8aa', email: "demo_user@local.com" },
];

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [pendingUsername, setPendingUsername] = useState("");
  const [showNewPasswordDialog, setShowNewPasswordDialog] = useState(false);
  const [showTwoFactorStep, setShowTwoFactorStep] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: settings } = useGetSettings();
  const showDemoCredentials =
    settings?.find((s) => s.key === "show_demo_credentials")?.value !== "false";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const newPasswordForm = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const loginMutation = useLogin();
  const verifyTwoFactorMutation = useVerifyTwoFactor();

  async function handleUsernameBlur() {
    const username = form.getValues("username").trim();
    if (!username) return;
    try {
      const result = await checkPasswordReset({ username });
      if (result.requiresReset) {
        setPendingUsername(username);
        setShowNewPasswordDialog(true);
      }
    } catch {
      // Silently ignore
    }
  }

  async function onNewPasswordSubmit(data: NewPasswordFormValues) {
    try {
      const result = await setInitialPassword({ username: pendingUsername, newPassword: data.newPassword });
      login(result.token);
      toast({
        title: "Senha definida",
        description: "Sua nova senha foi salva. Bem-vindo ao VaultGuard.",
      });
      setShowNewPasswordDialog(false);
      setLocation("/");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err?.data?.error || "Não foi possível definir a senha.",
      });
    }
  }

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          if (res.requiresTwoFactor && res.tempToken) {
            setTempToken(res.tempToken);
            setShowTwoFactorStep(true);
            return;
          }
          if (res.token) {
            login(res.token);
            toast({ title: "Acesso concedido", description: "Bem-vindo ao VaultGuard." });
            setLocation("/");
          }
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

  function onVerifyOtp() {
    if (!otpValue || otpValue.length !== 6) {
      toast({ variant: "destructive", title: "Código inválido", description: "Digite o código de 6 dígitos." });
      return;
    }
    verifyTwoFactorMutation.mutate(
      { data: { tempToken, otp: otpValue } },
      {
        onSuccess: (res) => {
          login(res.token);
          toast({ title: "Acesso concedido", description: "Autenticação de dois fatores confirmada." });
          setShowTwoFactorStep(false);
          setLocation("/");
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Código inválido",
            description: (err.data as any)?.error || "Código OTP incorreto.",
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
            {!showTwoFactorStep ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="usuario"
                            {...field}
                            className="bg-input/50"
                            autoComplete="username"
                            onBlur={(e) => {
                              field.onBlur();
                              handleUsernameBlur();
                            }}
                          />
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
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="bg-input/50 pr-10"
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full mt-6" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Autenticando..." : "Autenticar"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Autenticação de dois fatores</p>
                  <p className="text-xs text-muted-foreground">
                    Digite o código de 6 dígitos do seu aplicativo autenticador
                  </p>
                </div>
                <Input
                  placeholder="000000"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest font-mono bg-input/50"
                  maxLength={6}
                  autoFocus
                />
                <Button
                  className="w-full"
                  onClick={onVerifyOtp}
                  disabled={verifyTwoFactorMutation.isPending || otpValue.length !== 6}
                >
                  {verifyTwoFactorMutation.isPending ? "Verificando..." : "Verificar"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => { setShowTwoFactorStep(false); setOtpValue(""); setTempToken(""); }}
                >
                  Voltar ao login
                </Button>
              </div>
            )}

          </CardContent>
        </Card>

        {showDemoCredentials && (
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
                          <span className="text-xs text-foreground/80 font-mono">
                            user: <span className="text-foreground">{u.username}</span>
                          </span>
                          <span className="text-xs text-foreground/80 font-mono">
                            pass: <span className="text-foreground">{u.password}</span>
                          </span>
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
        )}
      </div>

      {/* Dialog: set new password after admin reset */}
      <Dialog open={showNewPasswordDialog} onOpenChange={(open) => { if (!open) setShowNewPasswordDialog(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Redefinição de senha obrigatória
            </DialogTitle>
            <DialogDescription>
              A senha da conta <strong>@{pendingUsername}</strong> foi redefinida pelo administrador.
              Escolha uma nova senha forte para continuar.
            </DialogDescription>
          </DialogHeader>
          <Form {...newPasswordForm}>
            <form onSubmit={newPasswordForm.handleSubmit(onNewPasswordSubmit)} className="space-y-4">
              <FormField
                control={newPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Mínimo 12 caracteres, maiúscula, minúscula, número e caractere especial
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={newPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="w-full">
                  Definir nova senha
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
