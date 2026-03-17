"use client"

import { motion } from "framer-motion"
import { ArrowRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl bg-primary p-12 md:p-16 text-center text-white"
        >
          {/* Decoração de fundo */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Matrículas abertas 2024/2025
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Começa o teu futuro<br />no IPM Mayombe
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
              Junta-te a mais de 850 alunos que escolheram o Instituto Politécnico do Mayombe
              para construir uma carreira sólida e bem-sucedida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-8">
                Matricular agora <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8" asChild>
                <Link href="#cursos">Ver cursos</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
