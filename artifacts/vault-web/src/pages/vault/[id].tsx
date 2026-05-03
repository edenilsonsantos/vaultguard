import { useState } from "react";
import { useGetVaultItem, useUpdateVaultItem, useDeleteVaultItem, getListVaultItemsQueryKey, getGetVaultItemQueryKey, getListAuditLogsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Eye, EyeOff, Trash2, ArrowLeft, Edit, Save, X, KeyRound, Globe, User, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function VaultDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useGetVaultItem(id, {
    query: {
      enabled: !!id,
      queryKey: getGetVaultItemQueryKey(id)
    }
  });

  const updateMutation = useUpdateVaultItem();
  const deleteMutation = useDeleteVaultItem();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  if (isLoading || !item) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isCredential = item.category === "credencial";

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Value has been copied securely.",
      duration: 2000,
    });
  };

  const toggleReveal = (key: string) => {
    setRevealedKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartEdit = () => {
    const values: Record<string, string> = {};
    item.entries.forEach(entry => {
      values[entry.key] = entry.value;
    });
    setEditValues(values);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newEntries = Object.entries(editValues).map(([key, value]) => ({ key, value }));
    
    updateMutation.mutate(
      { id, data: { entries: newEntries } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetVaultItemQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListAuditLogsQueryKey() });
          setIsEditing(false);
          toast({ title: "Updated successfully", description: "Values have been saved." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Update failed", description: "Could not save values." });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultItemsQueryKey() });
          toast({ title: "Deleted", description: "Vault item removed." });
          setLocation("/vault");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Deletion failed" });
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vault">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center space-x-3">
            {isCredential ? (
              <KeyRound className="h-6 w-6 text-primary" />
            ) : (
              <Globe className="h-6 w-6 text-secondary-foreground" />
            )}
            <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
            <Badge variant={isCredential ? "default" : "secondary"}>
              {isCredential ? "Credential" : "Global Var"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleStartEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Values
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the vault item and all its secret values.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, delete item
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Secret Entries</CardTitle>
              <CardDescription>
                {isCredential ? "Values are masked to prevent shoulder surfing." : "Global variables are visible by default."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.entries.map((entry) => (
                <div key={entry.key} className="flex flex-col space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono font-medium text-foreground">{entry.key}</span>
                    <div className="flex space-x-2">
                      {isCredential && !isEditing && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toggleReveal(entry.key)}
                        >
                          {revealedKeys[entry.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                      {!isEditing && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8"
                          onClick={() => handleCopy(entry.key, entry.value)}
                        >
                          {copiedKey === entry.key ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                          {copiedKey === entry.key ? "Copied" : "Copy"}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <Input 
                      value={editValues[entry.key]} 
                      onChange={(e) => setEditValues({...editValues, [entry.key]: e.target.value})}
                      className="font-mono text-sm bg-background"
                      type={isCredential ? "password" : "text"}
                    />
                  ) : (
                    <div className="font-mono text-sm bg-background p-2 rounded border border-border overflow-x-auto">
                      {isCredential && !revealedKeys[entry.key] ? "••••••••••••••••" : entry.value}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><User className="h-3 w-3 mr-1"/> Created By</span>
                <span className="font-medium">{item.createdByUsername}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1"/> Created At</span>
                <span>{format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1"/> Updated At</span>
                <span>{format(new Date(item.updatedAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground">Access Control</span>
                <Badge variant="outline" className="w-fit mt-1">
                  {item.accessControl === "all" ? "All Users" : "Restricted"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {item.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
