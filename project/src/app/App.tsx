import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AppProvider>
  );
}