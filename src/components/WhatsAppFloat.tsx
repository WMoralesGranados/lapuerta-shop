import { MessageCircle } from "lucide-react";
import WhatsAppLink from "@/components/WhatsAppLink";
import { MENSAJE_GENERAL } from "@/config/site";
import { cn, focusRing } from "@/lib/utils";

export default function WhatsAppFloat() {
  return (
    <WhatsAppLink
      mensaje={MENSAJE_GENERAL}
      aria-label="Contactar por WhatsApp"
      className={cn(
        "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevated",
        focusRing,
      )}
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </WhatsAppLink>
  );
}
