import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";

export default function App() {
  const basename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <AppProvider>
      <BrowserRouter basename={basename}>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AppProvider>
  );
}
