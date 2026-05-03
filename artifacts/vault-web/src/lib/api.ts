import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

export function configureApi() {
  // Read token from localStorage
  setAuthTokenGetter(() => {
    return localStorage.getItem("vault_token");
  });

  // Base URL is the origin for development
  setBaseUrl("");
}
