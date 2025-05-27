"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import SignInForm from "./components/sign-in.form";
import React from "react"; // <-- Agrega esto
const AuthPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

    return (
      <>
        <div className="relative flex items-center justify-center h-screen overflow-hidden">
          {/* Imagen de fondo desenfocada */}
        

          {/* Contenedor principal */}
          <div className="relative z-10 flex flex-col items-center justify-between w-full max-w-screen-lg p-4 space-y-8 md:p-8 md:flex-row md:space-y-0">
            {/* Logo con animación */}
            <div
              className={`flex items-center justify-center transition-all duration-700 ${
                isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
              }`}
            >
              <Image
                src="/Logo.png"
                alt="Logo"
                width={300}
                height={150}
                className="object-cover"
                priority
              />
            </div>

            {/* Formulario de inicio de sesión */}
            <div
              className={`w-full max-w-xs transition-all duration-700 ${
                isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
              }`}
            >
              <SignInForm />
            </div>
          </div>
          <div 
        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320"
          className="w-full h-auto"
        >
          <path 
            fill="#002F76FF" 
            fillOpacity="1" 
            d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,250.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
        </div>
      </>
    );
};

export default AuthPage;
