import type { ReactNode } from "react";
import { whatsappUrl } from "@/config/site";

type WhatsAppLinkProps = {
  mensaje: string;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
};

export default function WhatsAppLink({ mensaje, children, ...props }: WhatsAppLinkProps) {
  return (
    <a href={whatsappUrl(mensaje)} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
