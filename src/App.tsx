import { Route, Routes } from "react-router-dom";
import ScrollManager from "@/components/ScrollManager";
import ConfiguradorCloset from "@/pages/ConfiguradorCloset";
import ConfiguradorLibrero from "@/pages/ConfiguradorLibrero";
import ConfiguradorVestidor from "@/pages/ConfiguradorVestidor";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/closets/:modelo" element={<ConfiguradorCloset />} />
        <Route path="/librero-julieta" element={<ConfiguradorLibrero />} />
        <Route path="/vestidores" element={<ConfiguradorVestidor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
