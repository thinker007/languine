import { db } from "@/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, emailOTP, organization } from "better-auth/plugins";
import type { Context } from "hono";
import { Resend } from "resend";

export const setupAuth = (c: Context) => {
  const resend = new Resend(c.env.RESEND_API_KEY);

  return betterAuth({
    database: drizzleAdapter(db(c.env.DB), {
      provider: "sqlite",
      usePlural: true,
    }),
    secret: c.env.BETTER_AUTH_SECRET,
    trustedOrigins: c.env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
    // secondaryStorage: {
    //   get: async (key) => {
    //     return c.env.KV.get(`auth:${key}`);
    //   },
    //   set: (key, value, ttl) => {
    //     return c.env.KV.put(`auth:${key}`, value, { ttl });
    //   },
    //   delete: (key) => c.env.KV.delete(`auth:${key}`),
    // },
    plugins: [
      bearer(),
      organization(),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          await resend.emails.send({
            from: "hello@languine.ai",
            to: email,
            subject: "Languine - Email Verification",
            html: `<p>Your One Time Password is ${otp}</p>`,
          });
        },
      }),
    ],
  });
};
