import Catalogo from "@/components/home/Catalogo";
import ComoFunciona from "@/components/home/ComoFunciona";
import Hero from "@/components/home/Hero";
import Layout from "@/components/layout/Layout";
import { useTituloPagina } from "@/lib/useTituloPagina";

export default function Home() {
  useTituloPagina("La Puerta | Closets, libreros y vestidores a tu medida");
  return (
    <Layout>
      <Hero />
      <Catalogo />
      <ComoFunciona />
    </Layout>
  );
}
