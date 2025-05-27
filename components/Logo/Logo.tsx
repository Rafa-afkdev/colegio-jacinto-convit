"use client";
import React from "react";

import Image from "next/image";
  import { useRouter } from "next/navigation";

export function Logo() {
    const router = useRouter()
  return (
    <div className="min-h-20 flex items-center px-6 border-b cursor-pointer gap-2"
    onClick={() => router.push("/dashboard")}>

        <Image src="/Logo.png" alt="Logo" width={70} height={30} priority/>  
      
    </div>
  )
}
