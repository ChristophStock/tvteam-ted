import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import ControlPage from "./pages/ControlPage";
import VotePage from "./pages/VotePage";
import ResultPage from "./pages/ResultPage";
import { AppBar, Toolbar, Button, Container } from "@mui/material";




export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isVotePage = location.pathname === "/vote";
  const isResultPage = location.pathname === "/result";
  return (
    <>
      {!(isVotePage || isResultPage) && (
        <AppBar position="static" sx={{ background: "linear-gradient(90deg, #6a0572 0%, #ab218e 100%)", boxShadow: "0 4px 20px #ab218e88" }}>
          <Toolbar>
            <Button color="inherit" component={Link} to="/control">
              Kontrollseite
            </Button>
            <Button color="inherit" component={Link} to="/vote">
              Abstimmen
            </Button>
            <Button color="inherit" component={Link} to="/result">
              Ergebnisse
            </Button>
          </Toolbar>
        </AppBar>
      )}
      <Container maxWidth="lg" sx={{ mt: (isVotePage || isResultPage) ? 0 : 4, p: (isVotePage || isResultPage) ? 0 : 4, minWidth: (isVotePage || isResultPage) ? '100vw' : undefined, minHeight: (isVotePage || isResultPage) ? '100vh' : undefined, background: (isVotePage || isResultPage) ? 'none' : undefined, boxShadow: (isVotePage || isResultPage) ? 'none' : undefined, borderRadius: (isVotePage || isResultPage) ? 0 : undefined }}>
        <Routes>
          <Route path="/control" element={<ControlPage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="*" element={<VotePage />} />
        </Routes>
      </Container>
    </>
  );
}
