import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import WhatsAppFloat from "@/components/WhatsAppFloat";

type LayoutProps = {
  children: ReactNode;
  showWhatsAppFloat?: boolean;
  stickyHeader?: boolean;
  mensajeWhatsApp?: string;
};

export default function Layout({ children, showWhatsAppFloat = true, stickyHeader = true, mensajeWhatsApp }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header sticky={stickyHeader} mensajeWhatsApp={mensajeWhatsApp} />
      <main className="flex-1">{children}</main>
      <Footer />
      {showWhatsAppFloat && <WhatsAppFloat />}
    </div>
  );
}
