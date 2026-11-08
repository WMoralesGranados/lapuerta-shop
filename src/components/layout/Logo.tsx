import { Link } from "react-router-dom";
import { cn, focusRing } from "@/lib/utils";

export default function Logo({ siempreNombre = false }: { siempreNombre?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="La Puerta, ir al inicio"
      className={cn("flex items-center gap-2 rounded-md font-semibold", focusRing)}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        LP
      </span>
      <span className={siempreNombre ? undefined : "hidden sm:inline"}>La Puerta</span>
    </Link>
  );
}
