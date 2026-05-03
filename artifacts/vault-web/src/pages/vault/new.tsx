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
import { Plus, Trash2, ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const entrySchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["credencial", "variavel_global"]),
  description: z.string().optional(),
  accessControl: z.enum(["all", "specific"]),
  allowedUserIds: z.array(z.number()).default([]),
  entries: z.array(entrySchema).min(1, "At least one entry is required"),
}).refine(data => {
  if (data.accessControl === "specific" && data.allowedUserIds.length === 0) {
    return false;
  }
  return true;
}, {
  message: "At least one user must be selected for specific access",
  path: ["allowedUserIds"],
});

type FormValues = z.infer<typeof formSchema>;

export default function VaultNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVaultItem();
  const { data: users } = useListUsers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "credencial",
      description: "",
      accessControl: "all",
      allowedUserIds: [],
      entries: [{ key: "", value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  const accessControl = form.watch("accessControl");

  function onSubmit(data: FormValues) {
    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultItemsQueryKey() });
          toast({
            title: "Secret created",
            description: "Vault item has been securely stored.",
          });
          setLocation("/vault");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Creation failed",
            description: "Could not save vault item.",
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
          <h1 className="text-3xl font-bold tracking-tight">New Secret</h1>
          <p className="text-muted-foreground">Store a new credential or global variable.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Production DB Password" {...field} />
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
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credencial">Credential</SelectItem>
                          <SelectItem value="variavel_global">Global Variable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Credentials values are masked by default.
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What is this used for?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Determine who can read and modify this item.</CardDescription>
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
                            <FormLabel className="font-normal cursor-pointer">
                              All Users
                            </FormLabel>
                            <FormDescription>
                              Everyone with access to the system can view this.
                            </FormDescription>
                          </div>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md">
                          <FormControl>
                            <RadioGroupItem value="specific" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal cursor-pointer">
                              Specific Users
                            </FormLabel>
                            <FormDescription>
                              Restrict access to selected individuals.
                            </FormDescription>
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
                        <FormLabel>Select Allowed Users</FormLabel>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-4 rounded-md max-h-60 overflow-y-auto">
                        {users?.map((user) => (
                          <FormField
                            key={user.id}
                            control={form.control}
                            name="allowedUserIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={user.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(user.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, user.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== user.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer text-sm">
                                    {user.username} ({user.fullName})
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Key-Value Entries</CardTitle>
                <CardDescription>The actual secret data.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ key: "", value: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
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
                          <Input placeholder="Key (e.g., API_KEY)" {...field} />
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
                          <Input placeholder="Value" {...field} type={form.watch("category") === "credencial" ? "password" : "text"} />
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
              <Link href="/vault">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Shield className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Storing..." : "Store Secret"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
