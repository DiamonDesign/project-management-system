import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/context/SessionContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

const Profile = () => {
  const { session, user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Ajustes de Usuario</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.email || "User"} />
            <AvatarFallback>
              <User className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{user.user_metadata?.first_name || user.email}</CardTitle>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Aquí podrás gestionar la configuración de tu perfil, como tu nombre, avatar y otros detalles.
            (Funcionalidad de edición por implementar).
          </p>
          {/* Futuros campos de edición de perfil */}
        </CardContent>
      </Card>

      <MadeWithDyad />
    </div>
  );
};

export default Profile;