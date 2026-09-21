import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import LandingV2 from "./pages/LandingV2";
import PrivacyV2 from "./pages/PrivacyV2";
import TermsV2 from "./pages/TermsV2";
import ContractView from "./pages/ContractView";

function RouteScrollReset() {
  const { pathname } = useLocation();
  // Changing a page must not inherit the footer's scroll position.
  // In-page menu actions do not change pathname, so this cannot bounce them back.
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [pathname]);
  return null;
}

export default function App() {
  return <BrowserRouter><RouteScrollReset /><Routes>
    <Route path="/" element={<LandingV2 />} />
    <Route path="/politica-de-privacidade" element={<PrivacyV2 />} />
    <Route path="/termos-de-uso" element={<TermsV2 />} />
    <Route path="/contrato/:token" element={<ContractView />} />
    <Route path="*" element={<LandingV2 />} />
  </Routes></BrowserRouter>;
}
