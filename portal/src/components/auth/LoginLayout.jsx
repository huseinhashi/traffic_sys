// LoginLayout.jsx - Updated for Traffic Jam System (Admin only)
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../theme/ThemeToggle";
import { AlertCircle, ShieldAlert, Car } from "lucide-react";

export const LoginLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Car className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Traffic Jam Management</h1>
            <p className="text-sm text-muted-foreground">Admin Management System</p>
          </div>

          {/* Content Area with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="rounded-xl border bg-card p-6 shadow-lg backdrop-blur-sm">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <div className="flex justify-center items-center">
              <ShieldAlert size={16} className="mr-1 text-primary" />
              <span>Admin access only. Unauthorized access is prohibited.</span>
            </div>
          </div>
          
          {/* Back to Home Button */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-block rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
