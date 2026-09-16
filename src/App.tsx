import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Entrar from "./pages/Entrar";
import Posicion from "./pages/Posicion";
import Reporte from "./pages/Reporte";
import Alta from "./pages/Alta";
import Suscripcion from "./pages/Suscripcion";
import Admin from "./pages/admin/Admin";
import AdminSuscripcion from "./pages/admin/AdminSuscripcion";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      {/* pedidos desde la landing: la demo del Narra ID y el reporte, sin login */}
      <Route path="/posicion" element={<Posicion />} />
      <Route path="/reporte" element={<Reporte />} />
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/alta/:codigo" element={<Alta />} />
      <Route path="/suscripcion/:codigo" element={<Suscripcion />} />
      {/* la misma pantalla si escriben la ruta con tilde */}
      <Route path="/suscripción/:codigo" element={<Suscripcion />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/suscripcion/:id" element={<AdminSuscripcion />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
