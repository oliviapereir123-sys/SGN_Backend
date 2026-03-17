"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, Award } from "lucide-react"
import Link from "next/link"

function FloatingShape({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay }}
    />
  )
}

// Posições fixas — evita hydration mismatch causado por Math.random() no servidor
const PARTICLES = [
  { left: 12.4, top: 34.2, duration: 3.4, delay: 0.2 },
  { left: 87.1, top: 61.8, duration: 4.1, delay: 0.8 },
  { left: 45.6, top: 22.3, duration: 3.7, delay: 1.1 },
  { left: 73.2, top: 78.5, duration: 4.4, delay: 0.4 },
  { left: 28.9, top: 91.0, duration: 3.2, delay: 1.5 },
  { left: 61.3, top: 14.7, duration: 4.8, delay: 0.6 },
  { left: 5.8,  top: 47.3, duration: 3.6, delay: 1.9 },
  { left: 93.4, top: 38.1, duration: 4.2, delay: 0.1 },
  { left: 38.7, top: 65.4, duration: 3.9, delay: 1.3 },
  { left: 52.1, top: 83.6, duration: 4.6, delay: 0.9 },
  { left: 19.5, top: 11.2, duration: 3.3, delay: 1.7 },
  { left: 79.8, top: 55.9, duration: 4.0, delay: 0.3 },
  { left: 35.2, top: 29.7, duration: 3.8, delay: 1.0 },
  { left: 66.7, top: 72.4, duration: 4.3, delay: 0.7 },
  { left: 8.3,  top: 88.1, duration: 3.5, delay: 1.4 },
  { left: 48.9, top: 43.6, duration: 4.7, delay: 0.5 },
  { left: 82.4, top: 19.8, duration: 3.1, delay: 1.8 },
  { left: 24.6, top: 57.3, duration: 4.5, delay: 0.2 },
  { left: 57.3, top: 96.1, duration: 3.6, delay: 1.6 },
  { left: 91.7, top: 32.4, duration: 4.9, delay: 1.2 },
]

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary/20 rounded-full"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, repeat: Number.POSITIVE_INFINITY, delay: p.delay }}
        />
      ))}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background pt-20">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingShape
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"
          delay={0}
        />
        <FloatingShape
          className="absolute top-40 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed"
          delay={0.3}
        />
        <FloatingShape
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float-slow"
          delay={0.6}
        />
      </div>

      {/* Particle Field */}
      <ParticleField />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,110,253,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(13,110,253,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8"
          >
            <Award className="w-4 h-4" />
            <span>Ensino de Excelência em Angola</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance"
          >
            Instituto Politécnico{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">do Mayombe</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty"
          >
            Excelência no ensino técnico e profissional. Formando os líderes e profissionais
            do futuro de Angola com tecnologia e inovação.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="group text-lg px-8 py-6" asChild>
              <Link href="#inscricao">
                Inscreva-se Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent" asChild>
              <Link href="#cursos">Ver Cursos</Link>
            </Button>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
          >
            {[
              { icon: Users, value: "850+", label: "Alunos" },
              { icon: BookOpen, value: "2", label: "Cursos" },
              { icon: Award, value: "95%", label: "Empregabilidade" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}
