"use client"

import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Users, GraduationCap, BookOpen, Trophy } from "lucide-react"

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1500
        const steps = 60
        const increment = target / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= target) {
            setCount(target)
            clearInterval(timer)
          } else {
            setCount(Math.floor(current))
          }
        }, duration / steps)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

export function StatsSection() {
  const stats = [
    { icon: Users, value: 850, suffix: "+", label: "Alunos Matriculados" },
    { icon: GraduationCap, value: 1200, suffix: "+", label: "Diplomados" },
    { icon: BookOpen, value: 12, suffix: "", label: "Anos de Experiência" },
    { icon: Trophy, value: 95, suffix: "%", label: "Taxa de Empregabilidade" },
  ]

  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center text-white"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <s.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-4xl font-bold mb-1">
                <CountUp target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-white/80 text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
