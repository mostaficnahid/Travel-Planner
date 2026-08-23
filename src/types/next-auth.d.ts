import NextAuth from "next-auth";

/**
 * Extends NextAuth Session and JWT types to include `id` and `provider`
 * so we can access session.user.id without casting to `any`.
 *
 * Place this file at the root of src/ or the project root.
 * TypeScript will automatically pick it up via the `types` field in tsconfig.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
    };
  }

  interface User {
    id: string;
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
  }
}
