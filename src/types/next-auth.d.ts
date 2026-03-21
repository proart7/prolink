import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PARTICULIER" | "PROFESSIONNEL";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PARTICULIER" | "PROFESSIONNEL";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "PARTICULIER" | "PROFESSIONNEL";
    id: string;
  }
}
