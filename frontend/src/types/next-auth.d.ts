// Extends NextAuth session types for better TypeScript support.

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role?: "user" | "admin";
    };
  }
}
