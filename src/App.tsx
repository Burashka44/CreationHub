import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ChannelsPage from "./pages/ChannelsPage";
import DataPage from "./pages/DataPage";
import NetworkPage from "./pages/NetworkPage";
import SecurityPage from "./pages/SecurityPage";
import BackupsPage from "./pages/BackupsPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import AdminsPage from "./pages/AdminsPage";
import MediaAnalyticsPage from "./pages/MediaAnalyticsPage";
import AIHubPage from "./pages/AIHubPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/media" element={<MediaAnalyticsPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/admins" element={<AdminsPage />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/backups" element={<BackupsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/ai-hub" element={<AIHubPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
