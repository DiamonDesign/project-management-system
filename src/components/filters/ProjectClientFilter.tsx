import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, User } from 'lucide-react';
import { FilterTrigger } from './FilterTrigger';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ProjectClientFilterProps {
  clients: Client[];
  selectedClientIds: string[];
  onChange: (clientIds: string[]) => void;
  className?: string;
}

export function ProjectClientFilter({ clients, selectedClientIds, onChange, className }: ProjectClientFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleClient = (clientId: string) => {
    const newClientIds = selectedClientIds.includes(clientId)
      ? selectedClientIds.filter(id => id !== clientId)
      : [...selectedClientIds, clientId];
    onChange(newClientIds);
  };

  const clearAll = () => {
    onChange([]);
  };

  const hasSelection = selectedClientIds.length > 0;
  const hasClients = clients.length > 0;

  if (!hasClients) {
    return null; // Don't render if no clients
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <FilterTrigger
          label="Cliente"
          icon={User}
          selectedCount={selectedClientIds.length}
          isActive={hasSelection}
          className={className}
          aria-label="Filtrar por cliente asignado"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Cliente Asignado</h4>
            {hasSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          
          <ScrollArea className="max-h-48">
            <div className="space-y-1">
              {clients.map((client) => (
                <label
                  key={client.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                >
                  <Checkbox
                    checked={selectedClientIds.includes(client.id)}
                    onCheckedChange={() => toggleClient(client.id)}
                  />
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{client.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}