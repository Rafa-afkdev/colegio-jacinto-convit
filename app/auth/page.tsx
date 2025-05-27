import AuthPage from "./auth-page";
import React from "react"; // <-- Agrega esto
// Configuración de `metadata` como server component
export const metadata = {
  title: "Iniciar Sesión - UECAL",
};

export default function Page() {
  return <AuthPage/>;
}
