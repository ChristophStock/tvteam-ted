
import { createRoot } from "react-dom/client";
import App from "./App";
import { fetchRuntimeConfig } from "./runtimeConfig";

fetchRuntimeConfig().then(cfg => {
	if (cfg && cfg.title) document.title = cfg.title;
	createRoot(document.getElementById("app")).render(<App title={cfg && cfg.title ? cfg.title : undefined} />);
});
