import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ControlPage from "./pages/ControlPage";
import VotePage from "./pages/VotePage";
import ResultPage from "./pages/ResultPage";
import { AppBar, Toolbar, Button, Container } from "@mui/material";

export default function App() {
  return (
    <BrowserRouter>
      <AppBar position="static">
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/control" element={<ControlPage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="*" element={<VotePage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
