"use client"

import { motion } from "framer-motion"
import { Wifi, BookOpen, Users, Award, Clock, Laptop } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    { icon: Award, title: "Certificação Reconhecida", desc: "Diplomas reconhecidos pelo Ministério da Educação de Angola." },
    { icon: Laptop, title: "Laboratórios Modernos", desc: "Equipamentos actualizados para aulas práticas de informática." },
    { icon: Users, title: "Turmas Reduzidas", desc: "Máximo de 30 alunos por turma para maior atenção individual." },
    { icon: BookOpen, title: "Currículo Actualizado", desc: "Programa alinhado com as exigências do mercado de trabalho actual." },
    { icon: Clock, title: "Horários Flexíveis", desc: "Turnos de manhã e tarde para conciliar estudo e trabalho." },
    { icon: Wifi, title: "Sistema Digital", desc: "Acesso online às notas e boletins através do SGN em qualquer dispositivo." },
  ]

  return (
    <section id="beneficios" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            Porquê escolher o IPM
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Vantagens de estudar connosco
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Oferecemos muito mais do que ensino — proporcionamos uma experiência académica
            completa que prepara os nossos alunos para o sucesso profissional.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <b.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
