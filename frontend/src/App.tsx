import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { FarmProvider } from "@/contexts/FarmContext";
import { GlobalFilterProvider } from "@/contexts/GlobalFilterContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { AppLayout } from "@/components/layouts/AppLayout";

// Pages
import Login from "./pages/Login";
import Farm from "./pages/Farm";
import PlotDetail from "./pages/PlotDetail";
import Analytics from "./pages/Analytics";
import EventLog from "./pages/EventLog";
import Heatmap from "./pages/Heatmap";
import NotFound from "./pages/NotFound";

// Admin Pages
import { 
  AdminDashboard, 
  Organizations, 
  SensorTypes,
  Sensors, 
  Superusers 
} from "./pages/admin";

// Settings Pages
import {
  SettingsLayout,
  ProfileSettings,
  FarmsSettings,
  PlotsSettings,
  UsersSettings,
} from "./pages/settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Admin routes (superuser only) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireSuperuser>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="sensors" element={<Sensors />} />
              <Route path="sensor-types" element={<SensorTypes />} />
              <Route path="superusers" element={<Superusers />} />
            </Route>

            {/* App routes (authenticated users) */}
            <Route
              element={
                <ProtectedRoute>
                  <OrganizationProvider>
                    <FarmProvider>
                      <GlobalFilterProvider>
                        <AppLayout />
                      </GlobalFilterProvider>
                    </FarmProvider>
                  </OrganizationProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/farm" element={<Farm />} />
              <Route path="/plot/:id" element={<PlotDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/events" element={<EventLog />} />
              <Route path="/heatmap" element={<Heatmap />} />
              
              {/* Settings routes */}
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="farms" element={<FarmsSettings />} />
                <Route path="plots" element={<PlotsSettings />} />
                <Route path="users" element={<UsersSettings />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
