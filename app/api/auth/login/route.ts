import { type NextRequest, NextResponse } from "next/server"

// Temporary in-memory database for demo
// In production, use actual database with prepared statements

export async function POST(request: NextRequest) {
  try {
    const { email, password, tipo } = await request.json()

    // Validate input
    if (!email || !password || !tipo) {
      return NextResponse.json({ error: "Email, password, and type are required" }, { status: 400 })
    }

    // This is a placeholder - connect to actual database
    // For now, validate against demo accounts
    const demoAccounts = {
      aluno: {
        email: "joao.silva@aluno.ipmayombe.ao",
        password: "aluno123",
        id: "ALU001",
        nome: "João Manuel da Silva",
        tipo: "aluno",
        curso: "Informática de Gestão",
        ano: 3,
      },
      professor: {
        email: "maria.santos@ipmayombe.ao",
        password: "prof123",
        id: "PROF001",
        nome: "Profª. Maria dos Santos",
        tipo: "professor",
        departamento: "Ciências e Tecnologia",
      },
      admin: {
        email: "admin@ipmayombe.ao",
        password: "admin123",
        id: "ADM001",
        nome: "António Ferreira",
        tipo: "admin",
      },
    }

    const account = demoAccounts[tipo as keyof typeof demoAccounts]

    if (!account || account.email !== email || account.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // In production, use secure session management
    const response = NextResponse.json({ success: true, user: account }, { status: 200 })

    return response
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
