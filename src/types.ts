export interface Professor {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

export interface Revista {
  id: string;
  nome: string;
  trimestre: string; // e.g. "1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"
  ano: number;
  editora?: string;
}

export interface Turma {
  id: string;
  nome: string;
  professorId: string; // Vincular ao ID do professor
  sala?: string;
  faixaEtaria?: string;
  revistaId: string; // Vincular ao ID da revista
  observacoes?: string;
}

export interface Aluno {
  id: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
  telefone: string;
  endereco?: string;
  turmaId: string; // Pertence a apenas uma turma
  observacoes?: string;
}

export interface FrequenciaEBD {
  id: string;
  turmaId: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  presencas: { [alunoId: string]: boolean }; // true = presente, false = ausente
}

export interface Membro {
  id: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
  telefone: string;
  turmaId?: string; // Turma da EBD (opcional)
  observacoes?: string;
}

export interface FrequenciaCulto {
  id: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  nomeCulto: string; // e.g. "Culto Solene de Domingo"
  presencas: { [membroId: string]: boolean }; // true = presente, false = ausente
}

export interface Usuario {
  id: string;
  uid: string;
  email: string;
  status: "pendente" | "aprovado";
  approved?: boolean;
  createdAt: string;
}
