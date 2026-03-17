"use client"

import { motion } from "framer-motion"
import { BookOpen, Calculator, Monitor, Clock, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function CoursesSection() {
  const courses = [
    {
      icon: Calculator,
      title: "Contabilidade",
      sigla: "CONT",
      anos: "10º, 11º e 12º Ano",
      duracao: "3 anos",
      alunos: "~150 alunos",
      cor: "bg-blue-500/10 text-blue-600 border-blue-200",
      corIcon: "bg-blue-500/10",
      corIconText: "text-blue-600",
      disciplinas: ["Contabilidade Financeira", "Direito Comercial", "Matemática", "Economia", "Informática"],
      desc: "Forma profissionais aptos a gerir a contabilidade de empresas, instituições públicas e privadas, com sólidos conhecimentos em gestão financeira e fiscal.",
    },
    {
      icon: Monitor,
      title: "Informática de Gestão",
      sigla: "IG",
      anos: "10º, 11º e 12º Ano",
      duracao: "3 anos",
      alunos: "~180 alunos",
      cor: "bg-violet-500/10 text-violet-600 border-violet-200",
      corIcon: "bg-violet-500/10",
      corIconText: "text-violet-600",
      disciplinas: ["Programação", "Redes e Telecomunicações", "Sistemas de Computadores", "TIC", "Eletrotecnia"],
      desc: "Forma técnicos especializados em tecnologias de informação, programação e gestão de sistemas informáticos para o mercado digital angolano.",
    },
  ]

  return (
    <section id="cursos" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            Os nossos cursos
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Formação técnica de qualidade
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dois cursos técnico-profissionais desenhados para preparar os alunos com as
            competências exigidas pelo mercado de trabalho actual.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course, i) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="bg-background rounded-3xl border border-border p-8 hover:shadow-xl transition-all duration-300 group"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl ${course.corIcon} flex items-center justify-center shrink-0`}>
                  <course.icon className={`w-7 h-7 ${course.corIconText}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">{course.title}</h3>
                    <Badge variant="outline" className="text-xs">{course.sigla}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{course.anos}</p>
                </div>
              </div>

              {/* Descrição */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{course.desc}</p>

              {/* Info rápida */}
              <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {course.duracao}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  {course.alunos}
                </div>
              </div>

              {/* Disciplinas */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Principais disciplinas</p>
                <div className="flex flex-wrap gap-2">
                  {course.disciplinas.map(d => (
                    <span key={d} className={`text-xs px-3 py-1 rounded-full border ${course.cor}`}>{d}</span>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                Saber mais <ArrowRight className="w-4 h-4 ml-2"/>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
