// App.jsx - Updated for traffic jam system
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { LoginPage } from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Toaster } from "@/components/ui/toaster";
import { UserManagementPage } from "@/pages/admin/UsersPage";
import { JamPostsPage } from "./pages/admin/JamPostsPage";
import { JamPostDetailsPage } from "./pages/admin/jamPostDetails";
import { ConversationsPage } from "./pages/admin/ConversationsPage";
import { ConversationDetailsPage } from "./pages/admin/ConversationDetailsPage";

function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Root route - Login Page */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              
              {/* Admin Dashboard Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <DashboardLayout>
                      <Routes>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<UserManagementPage />} />
                        <Route path="jams" element={<JamPostsPage />} />
                        <Route path="jam-posts/:id" element={<JamPostDetailsPage />} />
                        <Route path="conversations" element={<ConversationsPage />} />
                        <Route path="conversations/:id" element={<ConversationDetailsPage />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
  );
}

export default App;