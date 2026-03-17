"use client"

import Link from "next/link"
import { GraduationCap, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer id="contato" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Instituto Politécnico</h3>
                <p className="text-sm text-background/60">do Mayombe</p>
              </div>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Formando profissionais qualificados para o desenvolvimento de Angola através do ensino técnico de
              excelência.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              {["Sobre Nós", "Cursos", "Inscrições", "Calendário", "Notícias"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-background/70 hover:text-primary transition-colors text-sm">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contactos</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-background/70 text-sm">Província do Cabinda, Mayombe, Angola</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-background/70 text-sm">+244 923 456 789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-background/70 text-sm">info@ipmayombe.ao</span>
              </li>
            </ul>
          </div>

          {/* Social & Access */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Acesso ao Sistema</h4>
            <div className="space-y-2 mb-6">
              <Link
                href="/login/aluno"
                className="block text-background/70 hover:text-primary transition-colors text-sm"
              >
                Portal do Aluno
              </Link>
              <Link
                href="/login/professor"
                className="block text-background/70 hover:text-primary transition-colors text-sm"
              >
                Portal do Professor
              </Link>
            </div>

            <h4 className="font-semibold text-lg mb-4">Redes Sociais</h4>
            <div className="flex gap-3">
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors group"
                >
                  <Icon className="w-5 h-5 text-background/70 group-hover:text-primary-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © 2025 Instituto Politécnico do Mayombe. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-background/50 hover:text-background text-sm">
              Política de Privacidade
            </Link>
            <Link href="#" className="text-background/50 hover:text-background text-sm">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
