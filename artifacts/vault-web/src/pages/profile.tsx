import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetMe,
  useChangePassword,
  useListApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useListCertificates,
  useGenerateCertificate,
  useRevokeCertificate,
  useSetupTwoFactor,
  useConfirmTwoFactor,
  useDisableTwoFactor,
  downloadCertificate,
  getListApiKeysQueryKey,
  getListCertificatesQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  KeyRound, Shield, Download, Trash2, Key, AlertTriangle, Copy, Check,
  QrCode, ShieldCheck, ShieldOff, Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d\S]{12,}$/;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().regex(passwordRegex, "Mínimo 12 caracteres com maiúscula, minúscula, número e caractere especial"),
});

const createApiKeySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

const createCertSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  validityDays: z.coerce.number().min(1).max(3650, "Máximo 10 anos"),
});

function PasswordStrengthIndicator({ password }: { password: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 12) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[a-z]/.test(password)) s += 1;
    if (/\d/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return s;
  }, [password]);

  const color = ["bg-destructive","bg-destructive","bg-orange-500","bg-yellow-500","bg-primary","bg-primary"][score];
  const label = ["Fraca","Fraca","Razoável","Boa","Forte","Muito forte"][score];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Força da senha</span>
        <span className={score >= 4 ? "text-primary" : "text-muted-foreground"}>{label}</span>
      </div>
      <div className="flex h-1 gap-1">
        {[1,2,3,4,5].map((level) => (
          <div key={level} className={`h-full flex-1 rounded-full ${score >= level ? color : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data: apiKeys } = useListApiKeys();
  const { data: certs } = useListCertificates();

  const changePasswordMutation = useChangePassword();
  const createApiKeyMutation = useCreateApiKey();
  const revokeApiKeyMutation = useRevokeApiKey();
  const generateCertMutation = useGenerateCertificate();
  const revokeCertMutation = useRevokeCertificate();
  const setupTwoFactorMutation = useSetupTwoFactor();
  const confirmTwoFactorMutation = useConfirmTwoFactor();
  const disableTwoFactorMutation = useDisableTwoFactor();

  const [isDownloadingCert, setIsDownloadingCert] = useState<number | null>(null);
  const [newApiKey, setNewApiKey] = useState<{ name: string; rawKey: string } | null>(null);
  const [newCert, setNewCert] = useState<{ name: string; pemBundle: string } | null>(null);
  const [copiedRawKey, setCopiedRawKey] = useState(false);
  const [copiedPem, setCopiedPem] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<number | null>(null);
  const [certToRevoke, setCertToRevoke] = useState<number | null>(null);

  // 2FA state
  const [setup2fa, setSetup2fa] = useState<{ secret: string; qrCodeUrl: string; otpauthUrl: string } | null>(null);
  const [otpConfirm, setOtpConfirm] = useState("");
  const [otpDisable, setOtpDisable] = useState("");
  const [showDisable2fa, setShowDisable2fa] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const apiKeyForm = useForm<z.infer<typeof createApiKeySchema>>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { name: "" },
  });

  const certForm = useForm<z.infer<typeof createCertSchema>>({
    resolver: zodResolver(createCertSchema),
    defaultValues: { name: "", validityDays: 365 },
  });

  const onPasswordSubmit = (data: z.infer<typeof changePasswordSchema>) => {
    changePasswordMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
        passwordForm.reset();
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Erro", description: (err.data as any)?.error || "Não foi possível alterar a senha." });
      },
    });
  };

  const onApiKeySubmit = (data: z.infer<typeof createApiKeySchema>) => {
    createApiKeyMutation.mutate({ data }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
        setNewApiKey({ name: res.name, rawKey: res.rawKey });
        apiKeyForm.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar a chave." });
      },
    });
  };

  const onCertSubmit = (data: z.infer<typeof createCertSchema>) => {
    generateCertMutation.mutate({ data }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
        setNewCert({ name: res.name, pemBundle: res.pemBundle });
        certForm.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível gerar o certificado." });
      },
    });
  };

  const handleRevokeApiKey = () => {
    if (!keyToRevoke) return;
    revokeApiKeyMutation.mutate({ id: keyToRevoke }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
        toast({ title: "Chave revogada", description: "A chave de API foi desativada." });
        setKeyToRevoke(null);
      },
    });
  };

  const handleRevokeCert = () => {
    if (!certToRevoke) return;
    revokeCertMutation.mutate({ id: certToRevoke }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
        toast({ title: "Certificado revogado" });
        setCertToRevoke(null);
      },
    });
  };

  const handleDownloadCert = async (id: number) => {
    setIsDownloadingCert(id);
    try {
      const res = await downloadCertificate(id);
      const blob = new Blob([res.pemBundle], { type: "application/x-pem-file" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${res.name}.pem`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível baixar o certificado." });
    } finally {
      setIsDownloadingCert(null);
    }
  };

  const copyRawKey = () => {
    if (!newApiKey) return;
    navigator.clipboard.writeText(newApiKey.rawKey);
    setCopiedRawKey(true);
    setTimeout(() => setCopiedRawKey(false), 2000);
  };

  const copyPem = () => {
    if (!newCert) return;
    navigator.clipboard.writeText(newCert.pemBundle);
    setCopiedPem(true);
    setTimeout(() => setCopiedPem(false), 2000);
  };

  // 2FA handlers
  const handleSetup2fa = () => {
    setupTwoFactorMutation.mutate(undefined, {
      onSuccess: (res) => {
        setSetup2fa(res);
        setOtpConfirm("");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível iniciar configuração do 2FA." });
      },
    });
  };

  const handleConfirm2fa = () => {
    if (!otpConfirm || otpConfirm.length !== 6) {
      toast({ variant: "destructive", title: "Código inválido", description: "Digite os 6 dígitos do seu aplicativo." });
      return;
    }
    confirmTwoFactorMutation.mutate({ data: { otp: otpConfirm } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "2FA ativado!", description: "Seu login agora requer verificação por aplicativo." });
        setSetup2fa(null);
        setOtpConfirm("");
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Código inválido", description: (err.data as any)?.error || "Tente novamente." });
      },
    });
  };

  const handleDisable2fa = () => {
    if (!otpDisable || otpDisable.length !== 6) {
      toast({ variant: "destructive", title: "Código inválido", description: "Digite os 6 dígitos do seu aplicativo." });
      return;
    }
    disableTwoFactorMutation.mutate({ data: { otp: otpDisable } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "2FA desativado", description: "Autenticação de dois fatores removida." });
        setShowDisable2fa(false);
        setOtpDisable("");
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Código inválido", description: (err.data as any)?.error || "Tente novamente." });
      },
    });
  };

  const copySecret = () => {
    if (!setup2fa) return;
    navigator.clipboard.writeText(setup2fa.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Identidade & Acesso</h1>
        <p className="text-muted-foreground">Gerencie seu perfil pessoal, credenciais e acesso à API.</p>
      </div>

      {user && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Informações do perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome completo</p>
                <p className="text-lg">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuário</p>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perfil</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                    {user.role}
                  </Badge>
                  {user.totpEnabled && (
                    <Badge variant="outline" className="text-primary border-primary/40 text-xs gap-1">
                      <ShieldCheck className="w-3 h-3" /> 2FA
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="2fa">2FA</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
        </TabsList>

        {/* Security tab */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alterar senha mestra</CardTitle>
              <CardDescription>Certifique-se de que sua nova senha atende aos requisitos de segurança.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha atual</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <PasswordStrengthIndicator password={passwordForm.watch("newPassword")} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? "Atualizando..." : "Atualizar senha"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA tab */}
        <TabsContent value="2fa" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <CardTitle>Autenticação de dois fatores (2FA)</CardTitle>
              </div>
              <CardDescription>
                Use um aplicativo autenticador (Google Authenticator, Authy, etc.) para aumentar a segurança do seu login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.totpEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-primary">2FA está ativado</p>
                      <p className="text-sm text-muted-foreground">
                        Seu login requer verificação por aplicativo autenticador.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDisable2fa(true)}
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Desativar 2FA
                  </Button>
                </div>
              ) : !setup2fa ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
                    <ShieldOff className="w-8 h-8 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">2FA não está ativado</p>
                      <p className="text-sm text-muted-foreground">
                        Ative o 2FA para proteger sua conta com uma camada extra de segurança.
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleSetup2fa} disabled={setupTwoFactorMutation.isPending}>
                    <QrCode className="w-4 h-4 mr-2" />
                    {setupTwoFactorMutation.isPending ? "Gerando QR Code..." : "Configurar 2FA"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="font-medium text-sm">1. Escaneie o QR Code</p>
                      <p className="text-xs text-muted-foreground">
                        Abra seu aplicativo autenticador e escaneie o código abaixo.
                      </p>
                      <div className="flex justify-center p-4 bg-white rounded-lg border border-border">
                        <img src={setup2fa.qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Ou insira o código manualmente:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 break-all">
                            {setup2fa.secret}
                          </code>
                          <Button variant="ghost" size="icon" onClick={copySecret}>
                            {copiedSecret ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="font-medium text-sm">2. Confirme o código</p>
                      <p className="text-xs text-muted-foreground">
                        Digite o código de 6 dígitos exibido no aplicativo para confirmar a configuração.
                      </p>
                      <Input
                        placeholder="000000"
                        value={otpConfirm}
                        onChange={(e) => setOtpConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="text-center text-xl tracking-widest font-mono"
                        maxLength={6}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirm2fa}
                          disabled={confirmTwoFactorMutation.isPending || otpConfirm.length !== 6}
                          className="flex-1"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          {confirmTwoFactorMutation.isPending ? "Verificando..." : "Ativar 2FA"}
                        </Button>
                        <Button variant="ghost" onClick={() => setSetup2fa(null)}>Cancelar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys tab */}
        <TabsContent value="api-keys" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Criar chave de API</CardTitle>
                  <CardDescription>Gere um token para acesso programático.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...apiKeyForm}>
                    <form onSubmit={apiKeyForm.handleSubmit(onApiKeySubmit)} className="space-y-4">
                      <FormField
                        control={apiKeyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do token</FormLabel>
                            <FormControl>
                              <Input placeholder="ex: CI/CD Pipeline" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createApiKeyMutation.isPending}>
                        <Key className="w-4 h-4 mr-2" />
                        {createApiKeyMutation.isPending ? "Gerando..." : "Gerar chave"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader><CardTitle>Chaves ativas</CardTitle></CardHeader>
                <CardContent>
                  {apiKeys?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">Nenhuma chave gerada ainda.</div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys?.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{key.name}</span>
                              {!key.isActive && <Badge variant="destructive">Revogada</Badge>}
                            </div>
                            <div className="text-sm font-mono text-muted-foreground mt-1">{key.keyPrefix}••••••••</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Criada: {format(new Date(key.createdAt), "dd/MM/yyyy")}
                              {key.lastUsedAt && ` · Último uso: ${format(new Date(key.lastUsedAt), "dd/MM/yyyy")}`}
                            </div>
                          </div>
                          {key.isActive && (
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setKeyToRevoke(key.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Certificates tab */}
        <TabsContent value="certificates" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Gerar certificado</CardTitle>
                  <CardDescription>Crie um certificado de cliente para autenticação mTLS.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...certForm}>
                    <form onSubmit={certForm.handleSubmit(onCertSubmit)} className="space-y-4">
                      <FormField
                        control={certForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do certificado</FormLabel>
                            <FormControl><Input placeholder="ex: K8s Runner" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={certForm.control}
                        name="validityDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validade (dias)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={generateCertMutation.isPending}>
                        <Shield className="w-4 h-4 mr-2" />
                        {generateCertMutation.isPending ? "Gerando..." : "Gerar certificado"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader><CardTitle>Certificados ativos</CardTitle></CardHeader>
                <CardContent>
                  {certs?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">Nenhum certificado gerado ainda.</div>
                  ) : (
                    <div className="space-y-4">
                      {certs?.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cert.name}</span>
                              {!cert.isActive && <Badge variant="destructive">Revogado</Badge>}
                              {cert.isActive && new Date(cert.expiresAt) < new Date() && <Badge variant="destructive">Expirado</Badge>}
                            </div>
                            <div className="text-sm font-mono text-muted-foreground mt-1 truncate max-w-xs">{cert.fingerprint}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Criado: {format(new Date(cert.createdAt), "dd/MM/yyyy")}
                              <br />
                              Expira: {format(new Date(cert.expiresAt), "dd/MM/yyyy")}
                            </div>
                          </div>
                          {cert.isActive && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleDownloadCert(cert.id)} disabled={isDownloadingCert === cert.id}>
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setCertToRevoke(cert.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* API Key reveal dialog */}
      <Dialog open={!!newApiKey} onOpenChange={(open) => !open && setNewApiKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Guarde sua chave de API
            </DialogTitle>
            <DialogDescription>
              Copie e armazene com segurança. <strong>Esta chave nunca será exibida novamente.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted border border-border rounded-md font-mono text-sm break-all relative">
            {newApiKey?.rawKey}
            <Button variant="secondary" size="sm" className="absolute top-2 right-2 h-8" onClick={copyRawKey}>
              {copiedRawKey ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedRawKey ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewApiKey(null)}>Já guardei com segurança</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate reveal dialog */}
      <Dialog open={!!newCert} onOpenChange={(open) => !open && setNewCert(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Certificado gerado</DialogTitle>
            <DialogDescription>
              Seu bundle (Cert + Chave privada) está pronto. Baixe ou copie agora.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden relative border border-border rounded-md">
            <pre className="text-xs font-mono p-4 overflow-auto h-full max-h-64">{newCert?.pemBundle}</pre>
            <Button variant="secondary" size="sm" className="absolute top-2 right-2" onClick={copyPem}>
              {copiedPem ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedPem ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewCert(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke API key confirmation */}
      <AlertDialog open={keyToRevoke !== null} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar chave de API</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeApiKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke cert confirmation */}
      <AlertDialog open={certToRevoke !== null} onOpenChange={(open) => !open && setCertToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar certificado</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeCert} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable 2FA dialog */}
      <Dialog open={showDisable2fa} onOpenChange={(open) => { setShowDisable2fa(open); if (!open) setOtpDisable(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-destructive" />
              Desativar 2FA
            </DialogTitle>
            <DialogDescription>
              Confirme com um código do seu aplicativo autenticador para desativar o 2FA.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="000000"
            value={otpDisable}
            onChange={(e) => setOtpDisable(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-xl tracking-widest font-mono"
            maxLength={6}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDisable2fa(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDisable2fa}
              disabled={disableTwoFactorMutation.isPending || otpDisable.length !== 6}
            >
              {disableTwoFactorMutation.isPending ? "Verificando..." : "Desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
