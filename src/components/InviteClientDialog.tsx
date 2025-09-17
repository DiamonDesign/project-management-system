"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, Share2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/context/ClientContext";

const inviteClientFormSchema = z.object({
  clientEmail: z.string().email("Por favor, introduce un email válido."),
});

interface InviteClientDialogProps {
  client: Client;
}

export const InviteClientDialog = ({ client }: InviteClientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const form = useForm<z.infer<typeof inviteClientFormSchema>>({
    resolver: zodResolver(inviteClientFormSchema),
    defaultValues: {
      clientEmail: client.email || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof inviteClientFormSchema>) => {
    setIsInviting(true);
    setInvitationLink(null);
    setTemporaryPassword(null);
    try {
      const { data, error } = await supabase.functions.invoke('invite-client', {
        body: {
          clientId: client.id,
          clientEmail: values.clientEmail,
        },
      });

      if (error) throw error;

      showSuccess("Invitación enviada exitosamente.");
      setInvitationLink(data.portalUrl);
      setTemporaryPassword(data.temporaryPassword);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showError("Error al enviar la invitación: " + errorMessage);
      console.error("Error inviting client:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      showSuccess("Enlace copiado al portapapeles.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) { // Reset state when dialog closes
        setInvitationLink(null);
        setTemporaryPassword(null);
        form.reset({ clientEmail: client.email || "" });
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 relative pl-9 pr-3">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
          <span>Invitar al Portal</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invitar Cliente al Portal</DialogTitle>
          <DialogDescription>
            Envía un enlace de acceso al cliente para que pueda ver sus proyectos y tareas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Cliente</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full relative pl-9 pr-3" disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin flex-shrink-0 pointer-events-none" />
                  <span>Enviando invitación...</span>
                </>
              ) : (
                "Enviar Invitación"
              )}
            </Button>
          </form>
        </Form>

        {invitationLink && (
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <p className="text-sm font-medium mb-2">Enlace de Invitación Generado:</p>
            <div className="flex items-center space-x-2">
              <Input value={invitationLink} readOnly className="flex-1" />
              <Button variant="secondary" size="sm" onClick={handleCopyLink} className="relative pl-9 pr-3">
                <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
                <span>Copiar</span>
              </Button>
            </div>
            {temporaryPassword && (
              <p className="text-sm text-muted-foreground mt-2">
                Contraseña temporal (si es un nuevo usuario): <span className="font-semibold">{temporaryPassword}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Comparte este enlace y la contraseña temporal (si aplica) con tu cliente.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};