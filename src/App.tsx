import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Entrar from "./pages/Entrar";
import Suscripcion from "./pages/Suscripcion";
import Admin from "./pages/admin/Admin";
import AdminSuscripcion from "./pages/admin/AdminSuscripcion";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/entrar" element={<Entrar />} />
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
