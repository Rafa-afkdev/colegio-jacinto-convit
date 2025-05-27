/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { deleteDocument, getCollection } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { CirclePlus, Search } from "lucide-react";
import { orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import React from "react";

import { Students } from "@/interfaces/students.interface";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Importamos el componente Input de shadcn/ui
import { Skeleton } from "@/components/ui/skeleton"; // Importamos el componente Skeleton
import type { Materias } from "@/interfaces/materias.interface";
import { CreateUpdateMaterias } from "./create-update-materias";
import { TableMateriaView } from "./table-view-materias";

const Materias = () => {
  const user = useUser();
  const [materias, setMaterias] = useState<Materias[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchType, setSearchType] = useState<"id_materia" | "nombre">("id_materia");

  const getMaterias = async () => {
    const path = `materias`;
    const query = [orderBy("id_materia", "asc")];
    setIsLoading(true);
    try {
      const res = await getCollection(path, query) as Materias[];
      setMaterias(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) getMaterias();
  }, [user]);

  const filteredMateria = materias.filter((materia) => {
    if (searchType === "id_materia") {
      return materia.id_materia.toString().includes(searchQuery);
    } else {
      return materia.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const deleteMateria = async (materia: Materias) => {
    const path = `materias/${materia.id}`;
    setIsLoading(true);
    try {
      await deleteDocument(path);
      toast.success("La materia fue eliminada exitosamente");
      const newMaterias = materias.filter((i) => i.id !== materia.id);
      setMaterias(newMaterias);
    } catch (error: any) {
      toast.error(error.message, { duration: 2500 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
        <CardTitle className="text-2xl">Materias</CardTitle>
        <CreateUpdateMaterias getMaterias={getMaterias}>
            <Button variant="outline">
              Registrar Materia
              <CirclePlus className="ml-2 w-5" />
            </Button>
          </CreateUpdateMaterias>
        </div>
        <CardDescription>
          <div className="flex items-center mt-4 gap-4">
            <Select
              value={searchType}
              onValueChange={(value: "id_materia" | "nombre") => setSearchType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id_materia">ID de la Materia</SelectItem>
                <SelectItem value="nombre">Nombre de la Materia</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <TableMateriaView
            deleteMateria={deleteMateria}
            getMaterias={getMaterias}
            materias={filteredMateria}
            isLoading={isLoading}
          />
        )}
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default Materias;