import { Route, Routes } from "react-router-dom";
import ScrollManager from "@/components/ScrollManager";
import Home from "@/pages/Home";
import ModeloTemporal from "@/pages/ModeloTemporal";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/closets/:modelo" element={<ModeloTemporal />} />
        <Route path="/librero-julieta" element={<ModeloTemporal slug="librero-julieta" />} />
        <Route path="/vestidores" element={<ModeloTemporal slug="vestidor" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
