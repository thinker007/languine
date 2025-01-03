import { emailOTPClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";

export const auth = createAuthClient({
  baseURL: "http://localhost:3002",
  basePath: "/auth",
  // fetchOptions: {
  //   auth: {
  //     type: "Bearer",
  //     token: () => localStorage.getItem("bearer_token") || "",
  //   },
  // },
  plugins: [emailOTPClient(), nextCookies()],
});
