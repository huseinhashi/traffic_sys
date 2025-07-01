import { LoginLayout } from "@/components/auth/LoginLayout";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export const LoginPage = () => {
  return (
    <LoginLayout>
      <AdminLoginForm />
    </LoginLayout>
  );
};