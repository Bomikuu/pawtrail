"use client";
import dynamic from "next/dynamic";
import { PawPrint } from "lucide-react";
import { platformBridge } from "./platform-bridge";
const Neighborhood = dynamic(() => import("./app"), {
  ssr: false,
  loading: () => (
    <div
      className="grid h-dvh place-items-center bg-background text-foreground"
      role="status"
    >
      <div className="text-center">
        <PawPrint className="mx-auto mb-3 size-8 motion-safe:animate-pulse" />
        <p>Opening the neighborhood…</p>
      </div>
    </div>
  ),
});
export default function GameClient() {
  return <Neighborhood platform={platformBridge} />;
}
