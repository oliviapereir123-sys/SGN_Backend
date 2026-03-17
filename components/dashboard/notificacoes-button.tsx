"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Notificacao {
  id: number
  titulo: string
  mensagem: string
  tipo: "info" | "aviso" | "sucesso" | "erro"
  lida: boolean
  criado_em: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost/sgn/backend/api"

const tipoStyles: Record<string, string> = {
  info:    "border-l-4 border-blue-400",
  aviso:   "border-l-4 border-amber-400",
  sucesso: "border-l-4 border-green-400",
  erro:    "border-l-4 border-red-400",
}

export function NotificacoesButton() {
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [open, setOpen] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const token = localStorage.getItem("sgn_token")
      const res = await fetch(`${API_BASE}/notificacoes/index.php`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifs(data.data || [])
      setNaoLidas(data.nao_lidas || 0)
    } catch {
      // silencioso — notificações não são críticas
    }
  }, [])

  useEffect(() => {
    carregar()
    // Polling a cada 60 segundos
    const interval = setInterval(carregar, 60_000)
    return () => clearInterval(interval)
  }, [carregar])

  const marcarLida = async (id: number) => {
    try {
      const token = localStorage.getItem("sgn_token")
      await fetch(`${API_BASE}/notificacoes/index.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id }),
      })
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n))
      setNaoLidas((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const marcarTodasLidas = async () => {
    try {
      const token = localStorage.getItem("sgn_token")
      await fetch(`${API_BASE}/notificacoes/index.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ todos: true }),
      })
      setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })))
      setNaoLidas(0)
    } catch {}
  }

  const formatarData = (dt: string) => {
    const d = new Date(dt)
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-0"
            >
              {naoLidas > 9 ? "9+" : naoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold">Notificações</span>
          {naoLidas > 0 && (
            <button
              onClick={marcarTodasLidas}
              className="text-xs text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {notifs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sem notificações
            </div>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors",
                  tipoStyles[n.tipo],
                  !n.lida && "bg-muted/20"
                )}
                onClick={() => !n.lida && marcarLida(n.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm font-medium", !n.lida && "font-semibold")}>
                    {n.titulo}
                  </p>
                  {!n.lida && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensagem}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatarData(n.criado_em)}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
