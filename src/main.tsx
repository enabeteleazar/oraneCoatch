import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { definirFuseau } from "../shared/rdv";

definirFuseau(import.meta.env.VITE_BOOKING_TIME_ZONE as string | undefined);

createRoot(document.getElementById("root")!).render(<App />);
