"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Image from "next/image"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-card/95 backdrop-blur-md shadow-lg border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <Image src="/images/ipm-logo.png" alt="IPM Logo" fill className="object-contain" priority />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-foreground text-sm md:text-base">Instituto Politécnico</h1>
              <p className="text-xs text-muted-foreground">do Mayombe</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#sobre" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Sobre</Link>
            <Link href="#cursos" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Cursos</Link>
            <Link href="#beneficios" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Benefícios</Link>
            <Link href="#contato" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Contato</Link>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login/aluno">Aluno</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login/professor">Professor</Link>
            </Button>
            <Button asChild>
              <Link href="/login/admin">Admin</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-t border-border pb-4"
          >
            <nav className="flex flex-col gap-4 pt-4">
              <Link href="#sobre" className="text-sm font-medium text-foreground/80 px-4 py-2">Sobre</Link>
              <Link href="#cursos" className="text-sm font-medium text-foreground/80 px-4 py-2">Cursos</Link>
              <Link href="#beneficios" className="text-sm font-medium text-foreground/80 px-4 py-2">Benefícios</Link>
              <Link href="#contato" className="text-sm font-medium text-foreground/80 px-4 py-2">Contato</Link>
              <div className="flex flex-col gap-2 px-4 pt-2">
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/login/aluno">Aluno — Iniciar Sessão</Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/login/professor">Professor — Iniciar Sessão</Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/login/encarregado">Encarregado — Iniciar Sessão</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/login/admin">Admin — Iniciar Sessão</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}