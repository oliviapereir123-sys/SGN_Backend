"use client"

/**
 * API Client — SGN (Sistema de Gestão de Notas)
 * IPM Mayombe
 *
 * Envia automaticamente o token JWT no header Authorization: Bearer <token>
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost/sgn/backend/api"
const TOKEN_KEY = "sgn_ipm_token"

/** Lê o token do localStorage */
function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

/** Fetch genérico com token automático e tratamento de erros */
export async function apiFetch<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  const data = await res.json().catch(() => ({ error: "Resposta inválida do servidor" }))

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem("sgn_ipm_user")
    window.location.href = "/"
    throw new Error("Sessão expirada. Por favor faça login novamente.")
  }

  if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`)
  return data as T
}

// ─── Auth ────────────────────────────────────────────────────

export interface LoginPayload {
  email?: string
  numeroAluno?: string
  password: string
  type: "aluno" | "professor" | "admin" | "encarregado"
}

export async function apiLogin(payload: LoginPayload) {
  return apiFetch("/auth/login.php", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// ─── Turmas do professor ──────────────────────────────────────

export interface TurmaProfessor {
  turma_id: number
  turma_nome: string
  disciplina_id: number
  disciplina_nome: string
  total_alunos: number
}

export async function getTurmasProfessor(professorId: number): Promise<{ success: boolean; data: TurmaProfessor[] }> {
  return apiFetch(`/turmas/professor.php?professorId=${professorId}`)
}

// ─── Alunos de uma turma ─────────────────────────────────────

export interface AlunoTurma {
  id: number
  numero: string
  nome: string
  foto?: string
  p1: number | null
  p2: number | null
  trabalho: number | null
  exame: number | null
  media: number | null
  estado: string
  nota_id: number | null
  feedback: string | null
}

export async function getAlunosTurma(
  turmaId: number,
  disciplinaId: number,
  trimestreId: number
): Promise<{ success: boolean; data: AlunoTurma[] }> {
  return apiFetch(`/turmas/alunos.php?turmaId=${turmaId}&disciplinaId=${disciplinaId}&trimestreId=${trimestreId}`)
}

// ─── Trimestres ───────────────────────────────────────────────

export interface Trimestre {
  id: number
  nome: string
  estado: string
}

export async function getTrimestres(): Promise<{ success: boolean; data: Trimestre[] }> {
  return apiFetch("/trimestres/get.php")
}

// ─── Notas ───────────────────────────────────────────────────

export interface NotaPayload {
  alunoId: number
  disciplinaId: number
  professorId: number
  trimestreId: number
  p1: number | null
  p2: number | null
  trabalho: number | null
  exame: number | null
  feedback?: string | null
}

export async function submitNotas(data: NotaPayload[]) {
  return apiFetch("/notas/submit.php", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export interface NotaAluno {
  id: number
  disciplina_id: number
  disciplina_nome: string
  sigla: string
  professor_nome: string
  trimestre_id: number
  trimestre_nome: string
  p1: number | null
  p2: number | null
  trabalho: number | null
  exame: number | null
  media: number | null
  estado: string
  observacoes: string | null
  feedback: string | null
}

export async function getNotasAluno(
  alunoId: number,
  trimestreId?: number
): Promise<{ success: boolean; data: NotaAluno[] }> {
  const query = trimestreId ? `&trimestreId=${trimestreId}` : ""
  return apiFetch(`/notas/get.php?alunoId=${alunoId}${query}`)
}

export interface NotaPendente {
  id: number
  aluno_id: number
  disciplina_id: number
  trimestre_id: number
  turma_id: number | null
  p1: number | null
  p2: number | null
  trabalho: number | null
  exame: number | null
  media: number | null
  estado: string
  observacoes: string | null
  data_lancamento: string
  aluno_nome: string
  aluno_numero: string
  disciplina_nome: string
  turma_nome: string
  professor_nome: string
  trimestre_nome: string
}

export async function getNotasPendentes(trimestreId?: number): Promise<{ success: boolean; data: NotaPendente[] }> {
  const query = trimestreId ? `?trimestreId=${trimestreId}` : ""
  return apiFetch(`/notas/pendentes.php${query}`)
}

export async function validarNota(
  notaId: number,
  estado: "Aprovado" | "Rejeitado",
  adminId: number,
  observacoes?: string
) {
  return apiFetch("/notas/validar.php", {
    method: "POST",
    body: JSON.stringify({ notaId, estado, adminId, observacoes }),
  })
}

export async function getRelatorioNotas(params?: {
  turmaId?: string
  disciplinaId?: string
  trimestre?: string
}) {
  const query = new URLSearchParams(params as Record<string, string>).toString()
  return apiFetch(`/notas/relatorio.php${query ? `?${query}` : ""}`)
}

export interface ResultadoLote {
  success: boolean
  aprovadas: number
  emails_enviados: number
  emails_falhados: number
  detalhes_enviados: { aluno: string; encarregado: string; email: string }[]
  detalhes_falhados: { aluno: string; email: string; erro: string }[]
  message: string
}

export async function validarLote(
  turmaId: number,
  disciplinaId: number,
  trimestreId: number
): Promise<ResultadoLote> {
  return apiFetch("/notas/validar-lote.php", {
    method: "POST",
    body: JSON.stringify({ turmaId, disciplinaId, trimestreId }),
  })
}

export interface ResultadoReenvio {
  success: boolean
  message: string
  destinatario: { nome: string; email: string }
}

export async function reenviarBoletim(
  alunoId: number,
  trimestreId: number
): Promise<ResultadoReenvio> {
  return apiFetch("/notas/reenviar-boletim.php", {
    method: "POST",
    body: JSON.stringify({ alunoId, trimestreId }),
  })
}

// ─── Admin: Alunos ───────────────────────────────────────────

export interface AlunoAdmin {
  id: number
  numero: string
  nome: string
  email: string
  telefone: string | null
  data_nascimento: string | null
  turma_id: number | null
  turma_nome: string | null
  curso_nome: string | null
  estado: "Activo" | "Inactivo" | "Suspenso"
  foto: string | null
  criado_em: string
}

export interface AlunosResponse {
  success: boolean
  data: AlunoAdmin[]
  total: number
  pagina: number
  paginas: number
}

export async function getAdminAlunos(params?: {
  search?: string
  turmaId?: number
  estado?: string
  pagina?: number
  limite?: number
}): Promise<AlunosResponse> {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
    )
  ).toString()
  return apiFetch(`/admin/alunos.php${query ? `?${query}` : ""}`)
}

export async function createAluno(data: Partial<AlunoAdmin> & { password?: string; enc_nome?: string; enc_email?: string }) {
  return apiFetch("/admin/alunos.php", { method: "POST", body: JSON.stringify(data) })
}

export async function updateAluno(data: Partial<AlunoAdmin> & { id: number }) {
  return apiFetch("/admin/alunos.php", { method: "PUT", body: JSON.stringify(data) })
}

// ─── Admin: Turmas ───────────────────────────────────────────

export interface TurmaAdmin {
  id: number
  nome: string
  ano: number
  turno: string | null
  periodo: string | null
  sala: string | null
  capacidade: number
  estado: string
  curso_id: number
  curso_nome: string
  total_alunos: number
  total_disciplinas: number
  disciplinas_preview: string[]
}

export interface TurmasResponse {
  success: boolean
  data: TurmaAdmin[]
  stats: { total_turmas: number; total_alunos: number; total_disciplinas_vinculadas: number }
}

export async function getAdminTurmas(params?: { search?: string; ano?: number }): Promise<TurmasResponse> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch(`/admin/turmas.php${query ? `?${query}` : ""}`)
}

// ─── Admin: Disciplinas ──────────────────────────────────────

export interface DisciplinaAdmin {
  id: number
  nome: string
  sigla: string | null
  codigo: string | null
  ano: number
  carga_horaria: number | null
  curso_id: number
  curso_nome: string
  professor_id: number | null
  professor_nome: string | null
  professor_foto: string | null
  status: "Ativa" | "Pendente"
}

export interface DisciplinasResponse {
  success: boolean
  data: DisciplinaAdmin[]
  stats: { total: number; ativas: number; sem_professor: number; professores_vinculados: number }
}

export async function getAdminDisciplinas(params?: {
  search?: string
  cursoId?: number
  status?: string
}): Promise<DisciplinasResponse> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch(`/admin/disciplinas.php${query ? `?${query}` : ""}`)
}

export async function associarProfessor(disciplinaId: number, professorId: number) {
  return apiFetch("/admin/disciplinas.php", {
    method: "POST",
    body: JSON.stringify({ action: "associar_professor", disciplina_id: disciplinaId, professor_id: professorId }),
  })
}

// ─── Aluno: Histórico Académico ──────────────────────────────

export interface HistoricoAno {
  ano_lectivo_id: number
  ano_lectivo: string
  turma_nome: string | null
  curso_nome: string | null
  media_geral: number | null
  total_disciplinas: number
  aprovadas: number
  reprovadas: number
  status: "Aprovado" | "Reprovado" | "Em Curso"
}

export async function getHistoricoAluno(alunoId: number): Promise<{
  success: boolean
  aluno: { id: number; nome: string; numero: string }
  data: HistoricoAno[]
  notas_actuais: NotaAluno[]
}> {
  return apiFetch(`/aluno/historico.php?alunoId=${alunoId}`)
}

// ─── Professor: Avaliações ───────────────────────────────────

export interface Avaliacao {
  id: number
  nome: string
  tipo: "Prova" | "Trabalho" | "Seminario" | "Projecto" | "Exame" | "Outro"
  disciplina_id: number
  disciplina_nome: string
  turma_id: number
  turma_nome: string
  trimestre_id: number
  trimestre_nome: string
  professor_nome: string
  peso: number
  data_entrega: string | null
  descricao: string | null
  estado: "Activa" | "Encerrada"
}

export interface AvaliacoesResponse {
  success: boolean
  data: Avaliacao[]
  stats: { total: number; pendentes_config: number; total_turmas: number | null }
}

export async function getAvaliacoes(params?: {
  disciplinaId?: number
  turmaId?: number
  trimestreId?: number
  search?: string
}): Promise<AvaliacoesResponse> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch(`/professor/avaliacoes.php${query ? `?${query}` : ""}`)
}

export async function createAvaliacao(data: {
  nome: string
  tipo: string
  disciplina_id: number
  turma_id: number
  trimestre_id: number
  peso: number
  data_entrega?: string
  descricao?: string
}) {
  return apiFetch("/professor/avaliacoes.php", { method: "POST", body: JSON.stringify(data) })
}

export async function updateAvaliacao(data: Partial<Avaliacao> & { id: number }) {
  return apiFetch("/professor/avaliacoes.php", { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteAvaliacao(id: number) {
  return apiFetch(`/professor/avaliacoes.php?id=${id}`, { method: "DELETE" })
}

// ─── Frequências / Presenças ─────────────────────────────────

export interface PresencaItem {
  id?: number
  aluno_id: number
  data: string
  presente: number
  justificada: number
  observacao?: string | null
}

export async function getFrequenciasList(params: {
  turmaId: number
  data?: string
  dataInicio?: string
  dataFim?: string
}): Promise<{ success: boolean; data: PresencaItem[]; alunos: { id: number; numero: string; nome: string }[] }> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch(`/frequencias/list.php?${query}`)
}

export async function registarFrequencias(payload: {
  data: string
  turmaId: number
  presencas: { alunoId: number; presente: number; justificada?: number; observacao?: string }[]
}) {
  return apiFetch("/frequencias/registar.php", { method: "POST", body: JSON.stringify(payload) })
}

export interface FrequenciasRelatorioAluno {
  total_dias: number
  presentes: number
  faltas: number
  justificadas: number
  percentagem_presencas: number
}

export async function getFrequenciasRelatorio(params: {
  alunoId?: number
  turmaId?: number
  dataInicio: string
  dataFim: string
}): Promise<{
  success: boolean
  tipo: "aluno" | "turma"
  aluno?: { id: number; numero: string; nome: string; turma_nome: string | null }
  turma_id?: number
  turma_nome?: string
  dataInicio: string
  dataFim: string
  resumo: FrequenciasRelatorioAluno | Array<{ aluno_id: number; numero: string; nome: string; total: number; presentes: number; faltas: number; justificadas: number; percentagem: number }>
  dados?: { data: string; presente: number; justificada: number; observacao: string | null }[]
  alunos?: { id: number; numero: string; nome: string }[]
}> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch(`/frequencias/relatorio.php?${query}`)
}

// ─── Horários ────────────────────────────────────────────────

export interface HorarioItem {
  id: number
  turma_id: number
  disciplina_id: number
  professor_id: number
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  sala: string | null
  disciplina_nome: string
  disciplina_sigla: string
  turma_nome: string
  professor_nome: string
}

export async function getHorarios(params: {
  turmaId?: number
  professorId?: number
  anoLectivoId?: number
}): Promise<{ success: boolean; data: HorarioItem[] }> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch(`/horarios/list.php?${query}`)
}

export async function saveHorario(data: {
  id?: number
  turma_id: number
  disciplina_id: number
  professor_id: number
  ano_lectivo_id: number
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  sala?: string | null
}) {
  const isPut = data.id != null && data.id > 0
  return apiFetch("/horarios/save.php", {
    method: isPut ? "PUT" : "POST",
    body: JSON.stringify(data),
  })
}

export async function deleteHorario(id: number) {
  return apiFetch(`/horarios/save.php?id=${id}`, { method: "DELETE" })
}

export interface AnoLectivo {
  id: number
  nome: string
  inicio: string
  fim: string
  estado: string
}

export async function getAnosLectivos(): Promise<{ success: boolean; data: AnoLectivo[] }> {
  return apiFetch("/anos_lectivos/get.php")
}

export async function getAdminProfessores(): Promise<{ success: boolean; data: { id: number; nome: string; email: string }[] }> {
  return apiFetch("/admin/utilizadores.php?tipo=professores")
}

export async function getAdminDisciplinasList(): Promise<{ success: boolean; data: { id: number; nome: string; sigla: string }[] }> {
  const r = await getAdminDisciplinas()
  return { success: true, data: (r.data || []).map((d) => ({ id: d.id, nome: d.nome, sigla: d.sigla || "" })) }
}

// ─── Calendário académico ────────────────────────────────────

export interface CalendarioEvento {
  id: number
  titulo: string
  tipo: string
  data_inicio: string
  data_fim: string | null
  descricao: string | null
  ano_lectivo_id: number | null
  criado_em: string
}

export async function getCalendario(params?: {
  anoLectivoId?: number
  dataInicio?: string
  dataFim?: string
}): Promise<{ success: boolean; data: CalendarioEvento[] }> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch(`/calendario/list.php${query ? `?${query}` : ""}`)
}

export async function saveCalendarioEvento(data: {
  id?: number
  titulo: string
  tipo: string
  data_inicio: string
  data_fim?: string | null
  descricao?: string | null
  ano_lectivo_id?: number | null
}) {
  const isPut = data.id != null && data.id > 0
  return apiFetch("/calendario/save.php", { method: isPut ? "PUT" : "POST", body: JSON.stringify(data) })
}

export async function deleteCalendarioEvento(id: number) {
  return apiFetch(`/calendario/save.php?id=${id}`, { method: "DELETE" })
}