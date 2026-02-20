/**
 * 🤖 FLOATING AGENT BUTTON
 * Modal flotante disponible globalmente en cualquier página
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AgentChat } from '@/components/agent/AgentChat';
import { Bot, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingAgentButtonProps {
  userId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  showBadge?: boolean;
}

export function FloatingAgentButton({
  userId,
  position = 'bottom-right',
  className,
  showBadge = true
}: FloatingAgentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className={cn(
              'fixed z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
              'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
              'border-2 border-white',
              positionClasses[position],
              className
            )}
            size="icon"
            aria-label="Abrir Asesor Técnico DAO"
          >
            <div className="relative">
              <Bot className="h-6 w-6 text-white" />
              {showBadge && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border border-white animate-pulse" />
              )}
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent 
          className="max-w-4xl w-full h-[80vh] p-0 gap-0"
          onEscapeKeyDown={() => setIsOpen(false)}
        >
          {/* Header personalizado */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Asesor Técnico-Operativo CryptoGift
                </h2>
                <p className="text-sm text-gray-600">
                  Especialista en Aragon OSx, EAS, EIP-712 y arquitectura DAO
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Contenido del chat */}
          <div className="flex-1 overflow-hidden">
            <AgentChat
              userId={userId}
              initialMode="technical"
              maxHeight="h-full"
              showHeader={false}
              showModeSelector={true}
              className="border-0 shadow-none h-full"
            />
          </div>

          {/* Footer con info rápida */}
          <div className="p-2 border-t bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              💡 <strong>Tip:</strong> Pregunta sobre contratos desplegados, propuestas DAO, o arquitectura técnica
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tooltip hover cuando está cerrado */}
      {!isOpen && (
        <div className={cn(
          'fixed z-40 pointer-events-none opacity-0 hover:opacity-100 transition-opacity',
          'bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap',
          position === 'bottom-right' ? 'bottom-20 right-4' :
          position === 'bottom-left' ? 'bottom-20 left-4' :
          position === 'top-right' ? 'top-20 right-4' : 'top-20 left-4'
        )}>
          🤖 Asesor Técnico DAO
          <div className={cn(
            'absolute w-2 h-2 bg-gray-900 rotate-45',
            position.includes('bottom') ? '-bottom-1' : '-top-1',
            position.includes('right') ? 'right-4' : 'left-4'
          )} />
        </div>
      )}
    </>
  );
}