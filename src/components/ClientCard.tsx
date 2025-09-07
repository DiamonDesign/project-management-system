import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Client } from "@/context/ClientContext";
import { Mail, Phone, Building } from "lucide-react";

interface ClientCardProps {
  client: Client;
}

export const ClientCard = ({ client }: ClientCardProps) => {
  return (
    <Link to={`/clients/${client.id}`} className="block">
      <Card className="w-full max-w-sm hover:shadow-lg transition-shadow h-full flex flex-col">
        <CardHeader className="flex-grow">
          <CardTitle>{client.name}</CardTitle>
          {client.company && <CardDescription className="flex items-center gap-1"><Building className="h-4 w-4 text-muted-foreground" /> {client.company}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" /> {client.phone}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};