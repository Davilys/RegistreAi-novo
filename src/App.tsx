import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingV2 from "./pages/LandingV2";
import PrivacyV2 from "./pages/PrivacyV2";
import TermsV2 from "./pages/TermsV2";
import ContractView from "./pages/ContractView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingV2 />} />
        <Route path="/politica-de-privacidade" element={<PrivacyV2 />} />
        <Route path="/termos-de-uso" element={<TermsV2 />} />
        <Route path="/contrato/:token" element={<ContractView />} />
        <Route path="*" element={<LandingV2 />} />
      </Routes>
    </BrowserRouter>
  );
}
