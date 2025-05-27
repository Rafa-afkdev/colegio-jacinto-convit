  "use client";
  import React from "react";

  import { useUser } from "@/hooks/use-user";
  import { Geist, Geist_Mono } from "next/font/google";
  import { redirect, usePathname } from "next/navigation";
  import { Toaster } from "react-hot-toast";
  import "./globals.css";

  const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    const user = useUser();
    const pathName = usePathname();

    const authRoutes = ["/", "/auth", "/forgot-password"];
    const isInAuthRoute = authRoutes.includes(pathName);

    if (user && isInAuthRoute) return redirect("/dashboard");

      // Restricción de rutas para DOCENTE
      if (user?.rol === "DOCENTE") {
        const allowedRoutes = [
          "/dashboard",
          "/dashboard/cargar-evaluaciones",
          "/dashboard/ver-evaluaciones",
          "/dashboard/asignar-notas",
          "/dashboard/ver-notas",
        ];
        const isAllowed =
          allowedRoutes.includes(pathName)
    
        if (!isAllowed) {
          return redirect("/dashboard");
        }
      }
    

    return (
      <html lang="en">
        <head />
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster />
        </body>
      </html>
    );
  }
