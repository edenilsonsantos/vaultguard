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
  downloadCertificate,
  getListApiKeysQueryKey,
  getListCertificatesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { KeyRound, Shield, Download, Trash2, Key, AlertTriangle, Copy, Check } from "lucide-react";
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

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().regex(passwordRegex, "Must be at least 12 characters, include upper/lower, number, and special character"),
});

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const createCertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  validityDays: z.coerce.number().min(1).max(3650, "Max validity is 10 years"),
});

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

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data: apiKeys } = useListApiKeys();
  const { data: certs } = useListCertificates();

  const changePasswordMutation = useChangePassword();
  const createApiKeyMutation = useCreateApiKey();
  const revokeApiKeyMutation = useRevokeApiKey();
  const [isDownloadingCert, setIsDownloadingCert] = useState<number | null>(null);
  const generateCertMutation = useGenerateCertificate();
  const revokeCertMutation = useRevokeCertificate();

  const [newApiKey, setNewApiKey] = useState<{ name: string; rawKey: string } | null>(null);
  const [newCert, setNewCert] = useState<{ name: string; pemBundle: string } | null>(null);
  
  const [copiedRawKey, setCopiedRawKey] = useState(false);
  const [copiedPem, setCopiedPem] = useState(false);
  
  const [keyToRevoke, setKeyToRevoke] = useState<number | null>(null);
  const [certToRevoke, setCertToRevoke] = useState<number | null>(null);

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const apiKeyForm = useForm<z.infer<typeof createApiKeySchema>>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
    },
  });

  const certForm = useForm<z.infer<typeof createCertSchema>>({
    resolver: zodResolver(createCertSchema),
    defaultValues: {
      name: "",
      validityDays: 365,
    },
  });

  const onPasswordSubmit = (data: z.infer<typeof changePasswordSchema>) => {
    changePasswordMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Password changed", description: "Your password has been successfully updated." });
          passwordForm.reset();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to change password." });
        }
      }
    );
  };

  const onApiKeySubmit = (data: z.infer<typeof createApiKeySchema>) => {
    createApiKeyMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
          setNewApiKey({ name: res.name, rawKey: res.rawKey });
          apiKeyForm.reset();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to create API Key." });
        }
      }
    );
  };

  const onCertSubmit = (data: z.infer<typeof createCertSchema>) => {
    generateCertMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
          setNewCert({ name: res.name, pemBundle: res.pemBundle });
          certForm.reset();
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to generate certificate." });
        }
      }
    );
  };

  const handleRevokeApiKey = () => {
    if (!keyToRevoke) return;
    revokeApiKeyMutation.mutate(
      { id: keyToRevoke },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApiKeysQueryKey() });
          toast({ title: "Key revoked", description: "API key has been revoked." });
          setKeyToRevoke(null);
        }
      }
    );
  };

  const handleRevokeCert = () => {
    if (!certToRevoke) return;
    revokeCertMutation.mutate(
      { id: certToRevoke },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
          toast({ title: "Certificate revoked", description: "Certificate has been revoked." });
          setCertToRevoke(null);
        }
      }
    );
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
      toast({ variant: "destructive", title: "Download failed", description: "Could not download certificate." });
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Identity & Access</h1>
        <p className="text-muted-foreground">Manage your personal profile, credentials, and API access.</p>
      </div>

      {user && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-lg">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant={user.role === 'admin' ? "destructive" : "secondary"} className="mt-1">
                  {user.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Master Password</CardTitle>
              <CardDescription>
                Ensure your new password meets the security requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <PasswordStrengthIndicator password={passwordForm.watch("newPassword")} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Create API Key</CardTitle>
                  <CardDescription>Generate a new token for programmatic access.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...apiKeyForm}>
                    <form onSubmit={apiKeyForm.handleSubmit(onApiKeySubmit)} className="space-y-4">
                      <FormField
                        control={apiKeyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., CI/CD Pipeline" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createApiKeyMutation.isPending}>
                        <Key className="w-4 h-4 mr-2" />
                        {createApiKeyMutation.isPending ? "Generating..." : "Generate Key"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Active API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  {apiKeys?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No API keys generated yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys?.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{key.name}</span>
                              {!key.isActive && <Badge variant="destructive">Revoked</Badge>}
                            </div>
                            <div className="text-sm font-mono text-muted-foreground mt-1">
                              {key.keyPrefix}••••••••
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Created: {format(new Date(key.createdAt), 'MMM d, yyyy')}
                              {key.lastUsedAt && ` • Last used: ${format(new Date(key.lastUsedAt), 'MMM d, yyyy')}`}
                            </div>
                          </div>
                          {key.isActive && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setKeyToRevoke(key.id)}
                            >
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

        <TabsContent value="certificates" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Certificate</CardTitle>
                  <CardDescription>Create a client certificate for mTLS auth.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...certForm}>
                    <form onSubmit={certForm.handleSubmit(onCertSubmit)} className="space-y-4">
                      <FormField
                        control={certForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certificate Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., K8s Runner" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={certForm.control}
                        name="validityDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validity (Days)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={generateCertMutation.isPending}>
                        <Shield className="w-4 h-4 mr-2" />
                        {generateCertMutation.isPending ? "Generating..." : "Generate Certificate"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Active Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  {certs?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No certificates generated yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {certs?.map(cert => (
                        <div key={cert.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cert.name}</span>
                              {!cert.isActive && <Badge variant="destructive">Revoked</Badge>}
                              {cert.isActive && new Date(cert.expiresAt) < new Date() && <Badge variant="destructive">Expired</Badge>}
                            </div>
                            <div className="text-sm font-mono text-muted-foreground mt-1 truncate max-w-xs">
                              {cert.fingerprint}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Created: {format(new Date(cert.createdAt), 'MMM d, yyyy')}
                              <br />
                              Expires: {format(new Date(cert.expiresAt), 'MMM d, yyyy')}
                            </div>
                          </div>
                          {cert.isActive && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleDownloadCert(cert.id)}
                                disabled={isDownloadingCert === cert.id}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => setCertToRevoke(cert.id)}
                              >
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

      {/* Modals */}
      <Dialog open={!!newApiKey} onOpenChange={(open) => !open && setNewApiKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Save Your API Key
            </DialogTitle>
            <DialogDescription>
              Please copy this API key and store it securely. For security reasons, <strong>it will never be shown again</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted border border-border rounded-md font-mono text-sm break-all relative">
            {newApiKey?.rawKey}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 h-8"
              onClick={copyRawKey}
            >
              {copiedRawKey ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedRawKey ? "Copied" : "Copy"}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewApiKey(null)}>I have saved it safely</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newCert} onOpenChange={(open) => !open && setNewCert(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Certificate Generated</DialogTitle>
            <DialogDescription>
              Your certificate bundle (Client Cert + Private Key) is ready. Download or copy it now.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden relative border border-border rounded-md">
            <pre className="p-4 text-xs font-mono overflow-auto h-full bg-muted/50">
              {newCert?.pemBundle}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 h-8 shadow-md"
              onClick={copyPem}
            >
              {copiedPem ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedPem ? "Copied" : "Copy"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCert(null)}>Close</Button>
            <Button onClick={() => {
              if (newCert) {
                const blob = new Blob([newCert.pemBundle], { type: "application/x-pem-file" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${newCert.name}.pem`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }
            }}>
              <Download className="w-4 h-4 mr-2" />
              Download .pem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={keyToRevoke !== null} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? Any applications currently using it will instantly lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeApiKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={certToRevoke !== null} onOpenChange={(open) => !open && setCertToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Certificate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this certificate? Clients authenticating with it will be rejected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeCert} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke Certificate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
