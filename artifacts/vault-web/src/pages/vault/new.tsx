import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateVaultItem, useListUsers, getListVaultItemsQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ArrowLeft, Shield, Server, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const entrySchema = z.object({
  key: z.string().min(1, "Chave é obrigatória"),
  value: z.string().min(1, "Valor é obrigatório"),
});

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.enum(["credencial", "variavel_global"]),
  description: z.string().optional(),
  accessControl: z.enum(["all", "specific"]),
  allowedUserIds: z.array(z.number()).default([]),
  allowedHostsMode: z.enum(["all", "specific"]).default("all"),
  allowedHosts: z.array(z.string()).default([]),
  entries: z.array(entrySchema).min(1, "Pelo menos uma entrada é obrigatória"),
}).refine(data => {
  if (data.accessControl === "specific" && data.allowedUserIds.length === 0) return false;
  return true;
}, {
  message: "Selecione pelo menos um usuário para acesso específico",
  path: ["allowedUserIds"],
}).refine(data => {
  if (data.allowedHostsMode === "specific" && data.allowedHosts.length === 0) return false;
  return true;
}, {
  message: "Adicione pelo menos um host permitido",
  path: ["allowedHosts"],
});

type FormValues = z.infer<typeof formSchema>;

export default function VaultNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVaultItem();
  const { data: users } = useListUsers();
  const [hostInput, setHostInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "credencial",
      description: "",
      accessControl: "all",
      allowedUserIds: [],
      allowedHostsMode: "all",
      allowedHosts: [],
      entries: [{ key: "", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  const accessControl = form.watch("accessControl");
  const allowedHostsMode = form.watch("allowedHostsMode");
  const allowedHosts = form.watch("allowedHosts");
  const category = form.watch("category");

  function addHost() {
    const host = hostInput.trim();
    if (!host) return;
    if (!allowedHosts.includes(host)) {
      form.setValue("allowedHosts", [...allowedHosts, host]);
    }
    setHostInput("");
  }

  function removeHost(h: string) {
    form.setValue("allowedHosts", allowedHosts.filter((x) => x !== h));
  }

  function onSubmit(data: FormValues) {
    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultItemsQueryKey() });
          toast({
            title: "Segredo criado",
            description: "Item do vault armazenado com segurança.",
          });
          setLocation("/vault");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro ao criar",
            description: "Não foi possível salvar o item do vault.",
          });
        },
      }
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vault">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Segredo</h1>
          <p className="text-muted-foreground">Armazene uma nova credencial ou variável global.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Banco de Dados Produção" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credencial">Credencial</SelectItem>
                          <SelectItem value="variavel_global">Variável Global</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {category === "credencial"
                          ? "Valores de credenciais nunca são exibidos no browser."
                          : "Variáveis globais são exibidas normalmente."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Para que é usado?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* User Access Control */}
          <Card>
            <CardHeader>
              <CardTitle>Controle de Acesso por Usuário</CardTitle>
              <CardDescription>Defina quais usuários podem consultar este item via browser e API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="accessControl"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                          <FormControl>
                            <RadioGroupItem value="all" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal cursor-pointer">Todos os Usuários</FormLabel>
                            <FormDescription>Qualquer usuário com acesso ao sistema pode consultar.</FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                          <FormControl>
                            <RadioGroupItem value="specific" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal cursor-pointer">Usuários Específicos</FormLabel>
                            <FormDescription>Restrinja o acesso a usuários selecionados.</FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {accessControl === "specific" && (
                <FormField
                  control={form.control}
                  name="allowedUserIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Selecione os Usuários Permitidos</FormLabel>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-4 rounded-md max-h-60 overflow-y-auto">
                        {users?.map((user) => (
                          <FormField
                            key={user.id}
                            control={form.control}
                            name="allowedUserIds"
                            render={({ field }) => (
                              <FormItem key={user.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(user.id)}
                                    onCheckedChange={(checked) =>
                                      checked
                                        ? field.onChange([...field.value, user.id])
                                        : field.onChange(field.value?.filter((v) => v !== user.id))
                                    }
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-sm">
                                  {user.username} ({user.fullName})
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* VM/Host API Restriction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Restrição de Acesso via API por VM/Host
              </CardTitle>
              <CardDescription>
                Defina quais endereços IP ou hostnames podem consultar este item via API key. Acesso via browser (JWT) não é afetado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="allowedHostsMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                          <FormControl>
                            <RadioGroupItem value="all" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal cursor-pointer">Todos os Hosts</FormLabel>
                            <FormDescription>Qualquer VM ou servidor pode consultar via API key.</FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                          <FormControl>
                            <RadioGroupItem value="specific" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal cursor-pointer">Hosts Específicos</FormLabel>
                            <FormDescription>Somente os IPs/hostnames listados podem consultar via API.</FormDescription>
                          </div>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {allowedHostsMode === "specific" && (
                <FormField
                  control={form.control}
                  name="allowedHosts"
                  render={() => (
                    <FormItem>
                      <FormLabel>IPs / Hostnames Permitidos</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="ex: 192.168.1.10 ou vm-prod-01"
                          value={hostInput}
                          onChange={(e) => setHostInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); addHost(); }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addHost}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {allowedHosts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {allowedHosts.map((h) => (
                            <Badge key={h} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                              <Server className="h-3 w-3" />
                              {h}
                              <button type="button" onClick={() => removeHost(h)} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Key-Value Entries */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Entradas Chave-Valor</CardTitle>
                <CardDescription>
                  {category === "credencial"
                    ? "Valores de credenciais são criptografados e nunca exibidos no browser."
                    : "Os dados do segredo."}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ key: "", value: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-4">
                  <FormField
                    control={form.control}
                    name={`entries.${index}.key`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Chave (ex: DB_PASSWORD)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`entries.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Valor"
                            {...field}
                            type={category === "credencial" ? "password" : "text"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" asChild>
              <Link href="/vault">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Shield className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Salvando..." : "Armazenar Segredo"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
