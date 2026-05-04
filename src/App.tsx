import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { BabaProfile } from "./pages/BabaProfile";
import { Babas } from "./pages/Babas";
import { Cadastro } from "./pages/Cadastro";
import { Emergencia } from "./pages/Emergencia";
import { EstablishmentProfile } from "./pages/EstablishmentProfile";
import { EmBreve } from "./pages/EmBreve";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { ParadasPets } from "./pages/ParadasPets";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adocao" element={<EmBreve title="Adoção" />} />
        <Route path="/campanhas" element={<EmBreve title="Campanhas" />} />
        <Route path="/buscapet" element={<EmBreve title="BuscaPet" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/babas" element={<Babas />} />
        <Route path="/babas/:id" element={<BabaProfile />} />
        <Route path="/paradas-pets" element={<ParadasPets />} />
        <Route path="/emergencia" element={<Emergencia />} />
        <Route
          path="/estabelecimento/:id"
          element={<EstablishmentProfile />}
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
