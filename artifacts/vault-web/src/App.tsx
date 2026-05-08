import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import VaultList from "@/pages/vault/index";
import VaultNew from "@/pages/vault/new";
import VaultDetail from "@/pages/vault/[id]";
import VaultTrash from "@/pages/vault/trash";
import Profile from "@/pages/profile";
import Users from "@/pages/users";
import Logs from "@/pages/logs";
import Settings from "@/pages/settings";
import Manual from "@/pages/manual";
import ApiManual from "@/pages/api-manual";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/manual" component={Manual} />
      <Route path="/api-manual" component={ApiManual} />

      <Route path="/">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/vault">
        <ProtectedRoute><VaultList /></ProtectedRoute>
      </Route>
      <Route path="/vault/new">
        <ProtectedRoute><VaultNew /></ProtectedRoute>
      </Route>
      <Route path="/vault/trash">
        <ProtectedRoute><VaultTrash /></ProtectedRoute>
      </Route>
      <Route path="/vault/:id">
        <ProtectedRoute><VaultDetail /></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute><Users /></ProtectedRoute>
      </Route>
      <Route path="/logs">
        <ProtectedRoute><Logs /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
