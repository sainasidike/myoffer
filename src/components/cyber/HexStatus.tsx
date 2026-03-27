import { cn } from "@/lib/utils";

interface HexStatusProps {
  status: "filled" | "empty" | "active";
}

export function HexStatus({ status }: HexStatusProps) {
  return (
    <div
      className={cn(
        "w-4 h-4 hexagon shrink-0",
        status === "filled" && "hex-glow-green",
        status === "empty" && "hex-glow-gray",
        status === "active" && "hex-glow-yellow"
      )}
    />
  );
}
