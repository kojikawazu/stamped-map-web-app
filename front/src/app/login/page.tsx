import type { Metadata } from "next";
import LoginClient from "./client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ログイン - Stamped Map",
  description: "Stamped Map にログイン",
};

export default function LoginPage() {
  return <LoginClient />;
}
