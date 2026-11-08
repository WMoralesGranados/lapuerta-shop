import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import WhatsAppFloat from "@/components/WhatsAppFloat";

type LayoutProps = {
  children: ReactNode;
  showWhatsAppFloat?: boolean;
};

export default function Layout({ children, showWhatsAppFloat = true }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {showWhatsAppFloat && <WhatsAppFloat />}
    </div>
  );
}
