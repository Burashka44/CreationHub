import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { BotProvider } from "./contexts/BotContext";
import DashboardLayout from "./layouts/DashboardLayout";
import BotLayout from "./layouts/BotLayout";
import DashboardPage from "./pages/DashboardPage";
import BotDashboardPage from "./pages/bots/BotDashboardPage";
import BotListPage from "./pages/bots/BotListPage";
import BotDetailsPage from "./pages/bots/BotDetailsPage";
import LoginPage from "./pages/LoginPage";

import DataPage from "./pages/DataPage";
import NetworkPage from "./pages/NetworkPage";
import SecurityPage from "./pages/SecurityPage";
import BackupsPage from "./pages/BackupsPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import AdminsPage from "./pages/AdminsPage";
import MediaAnalyticsPage from "./pages/MediaAnalyticsPage";
import AIHubPage from "./pages/AIHubPage";
import VideoPipelinePage from "./pages/VideoPipelinePage";
import ServicesPage from "./pages/ServicesPage";
import NotFound from "./pages/NotFound";

import OfflineIndicator from "./components/common/OfflineIndicator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <BotProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  <Route element={<DashboardLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/media" element={<MediaAnalyticsPage />} />
                    <Route path="/admins" element={<AdminsPage />} />
                    <Route path="/data" element={<DataPage />} />
                    <Route path="/network" element={<NetworkPage />} />
                    <Route path="/security" element={<SecurityPage />} />
                    <Route path="/backups" element={<BackupsPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/ai-hub" element={<AIHubPage />} />
                    <Route path="/video-pipeline" element={<VideoPipelinePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>

                  {/* Bot Management Layout */}
                  <Route path="/bots" element={<BotLayout />}>
                    <Route index element={<BotDashboardPage />} />
                    <Route path="list" element={<BotListPage />} />
                    <Route path=":id" element={<BotDetailsPage />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </BotProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
