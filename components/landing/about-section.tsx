"use client"

import { motion } from "framer-motion"
import { GraduationCap, Target, Eye, Heart } from "lucide-react"

export function AboutSection() {
  const values = [
    { icon: Target, title: "Missão", desc: "Formar profissionais competentes e éticos, preparados para os desafios do mercado de trabalho angolano e global." },
    { icon: Eye, title: "Visão", desc: "Ser a instituição politécnica de referência em Angola, reconhecida pela excelência académica e inovação pedagógica." },
    { icon: Heart, title: "Valores", desc: "Integridade, excelência, responsabilidade social e compromisso com o desenvolvimento da região do Mayombe." },
  ]

  return (
    <section id="sobre" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <GraduationCap className="w-4 h-4" />
              Sobre o IPM
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Formando líderes para o{" "}
              <span className="text-primary">futuro de Angola</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              O Instituto Politécnico do Mayombe é uma instituição de ensino técnico-profissional
              localizada em Cabinda, dedicada à formação de quadros qualificados nas áreas de
              Contabilidade e Informática de Gestão.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Com um corpo docente experiente e infraestruturas modernas, o IPM oferece um
              ambiente de aprendizagem que combina teoria e prática, preparando os nossos
              alunos para os desafios reais do mercado de trabalho.
            </p>
          </motion.div>

          {/* Cards de valores */}
          <div className="space-y-4">
            {values.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex gap-4 p-5 rounded-2xl bg-background border border-border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
