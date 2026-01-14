import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Pay from "./pages/Pay";
import AIChat from "./pages/AIChat";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import { AgentAuthorizationManager } from "./components/AgentAuthorizationModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <div className="flex-1 pb-100">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pay" element={<Pay />} />
              <Route path="/ai" element={<AIChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <BottomNav />
          <AgentAuthorizationManager />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
