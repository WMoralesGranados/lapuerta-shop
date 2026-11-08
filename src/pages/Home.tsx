import Catalogo from "@/components/home/Catalogo";
import ComoFunciona from "@/components/home/ComoFunciona";
import Hero from "@/components/home/Hero";
import Layout from "@/components/layout/Layout";

export default function Home() {
  return (
    <Layout>
      <Hero />
      <Catalogo />
      <ComoFunciona />
    </Layout>
  );
}
