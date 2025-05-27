import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata= {
  title:'Unidad Educativa Colegio Adventista "Libertador"'
}

export default function Home() {
  return (
    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
      <Link href="/auth">Ir a Autenticación</Link>
    </Button>
  );
}