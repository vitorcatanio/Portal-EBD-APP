import React, { useState } from "react";
import { Aluno, Professor, Turma, Membro } from "../types";
import { Search, Users, User, School, ArrowRight, CornerDownRight, Check, Sparkles } from "lucide-react";

interface PesquisaGlobalProps {
  alunos: Aluno[];
  professores: Professor[];
  turmas: Turma[];
  membros: Membro[];
  onNavigateToTab: (tab: string) => void;
}

export default function PesquisaGlobal({ alunos, professores, turmas, membros, onNavigateToTab }: PesquisaGlobalProps) {
  const [query, setQuery] = useState("");

  const handleClear = () => {
    setQuery("");
  };

  const hasQuery = query.trim().length > 0;
  const cleanQuery = query.toLowerCase().trim();

  // Perform search across datasets
  const matchedAlunos = hasQuery 
    ? alunos.filter(a => a.nome.toLowerCase().includes(cleanQuery) || (a.telefone && a.telefone.includes(cleanQuery)))
    : [];

  const matchedProfessores = hasQuery 
    ? professores.filter(p => p.nome.toLowerCase().includes(cleanQuery) || (p.telefone && p.telefone.includes(cleanQuery)) || (p.email && p.email.toLowerCase().includes(cleanQuery)))
    : [];

  const matchedTurmas = hasQuery 
    ? turmas.filter(t => t.nome.toLowerCase().includes(cleanQuery) || (t.sala && t.sala.toLowerCase().includes(cleanQuery)))
    : [];

  const matchedMembros = hasQuery 
    ? membros.filter(m => m.nome.toLowerCase().includes(cleanQuery) || (m.telefone && m.telefone.includes(cleanQuery)))
    : [];

  const totalResults = matchedAlunos.length + matchedProfessores.length + matchedTurmas.length + matchedMembros.length;

  return (
    <div id="pesquisa-global-container" className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pesquisa Global</h2>
        <p className="text-sm text-slate-500">Localize alunos, professores, turmas ou membros de forma instantânea</p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          id="global-search-query"
          type="text"
          placeholder="Digite o nome, telefone, email ou sala..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner transition-all"
        />
        {hasQuery && (
          <button
            id="clear-global-search-btn"
            onClick={handleClear}
            className="absolute right-3 top-3 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-xs text-slate-600 transition-all font-semibold cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Results Workspace */}
      {!hasQuery ? (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <Search className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
          <p className="font-semibold text-slate-600">Aguardando termo de pesquisa...</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Digite um nome ou parte de um telefone acima para iniciar a busca em tempo real na base de dados.</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-slate-100 rounded-xl">
          <p className="font-bold text-slate-700 text-base">Nenhum resultado encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Verifique a grafia do termo procurado ou realize novos cadastros.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
            <span>Resultados encontrados: {totalResults}</span>
            <span className="text-blue-600">Busca concluída</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ALUNOS RESULTS */}
            {matchedAlunos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-blue-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Alunos ({matchedAlunos.length})
                </h4>
                <div className="space-y-2">
                  {matchedAlunos.map(a => {
                    const t = turmas.find(x => x.id === a.turmaId);
                    return (
                      <div
                        id={`search-result-aluno-${a.id}`}
                        key={a.id}
                        className="bg-slate-50/40 hover:bg-blue-50/30 p-3.5 rounded-xl border border-slate-100 transition-all group flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{a.nome}</p>
                          <div className="flex flex-wrap items-center gap-x-2 mt-1.5 text-[11px] text-slate-500">
                            {a.telefone && <span>Tel: {a.telefone}</span>}
                            {a.telefone && <span>•</span>}
                            <span>Turma: <span className="font-medium text-blue-700">{t ? t.nome : "Sem turma"}</span></span>
                          </div>
                        </div>
                        <button
                          id={`go-to-alunos-tab-${a.id}`}
                          onClick={() => onNavigateToTab("alunos")}
                          className="p-1.5 bg-white text-slate-400 hover:text-blue-600 rounded-lg shadow-sm border border-slate-100 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Ir para Alunos"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MEMBROS RESULTS */}
            {matchedMembros.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" /> Membros ({matchedMembros.length})
                </h4>
                <div className="space-y-2">
                  {matchedMembros.map(m => {
                    const t = turmas.find(x => x.id === m.turmaId);
                    return (
                      <div
                        id={`search-result-membro-${m.id}`}
                        key={m.id}
                        className="bg-slate-50/40 hover:bg-emerald-50/30 p-3.5 rounded-xl border border-slate-100 transition-all group flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{m.nome}</p>
                          <div className="flex flex-wrap items-center gap-x-2 mt-1.5 text-[11px] text-slate-500">
                            {m.telefone && <span>Tel: {m.telefone}</span>}
                            {m.telefone && <span>•</span>}
                            <span>Classe: <span className="font-medium text-emerald-700">{t ? t.nome : "Não frequenta EBD"}</span></span>
                          </div>
                        </div>
                        <button
                          id={`go-to-culto-tab-${m.id}`}
                          onClick={() => onNavigateToTab("culto")}
                          className="p-1.5 bg-white text-slate-400 hover:text-emerald-600 rounded-lg shadow-sm border border-slate-100 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Ir para Culto"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PROFESSORES RESULTS */}
            {matchedProfessores.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" /> Professores ({matchedProfessores.length})
                </h4>
                <div className="space-y-2">
                  {matchedProfessores.map(p => {
                    const linkedTurmas = turmas.filter(t => t.professorId === p.id);
                    return (
                      <div
                        id={`search-result-prof-${p.id}`}
                        key={p.id}
                        className="bg-slate-50/40 hover:bg-indigo-50/30 p-3.5 rounded-xl border border-slate-100 transition-all group flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{p.nome}</p>
                          <div className="flex flex-wrap items-center gap-x-2 mt-1.5 text-[11px] text-slate-500">
                            {p.telefone && <span>Tel: {p.telefone}</span>}
                            {linkedTurmas.length > 0 && <span>•</span>}
                            {linkedTurmas.length > 0 && (
                              <span>Turmas: <span className="font-medium">{linkedTurmas.map(t=>t.nome).join(', ')}</span></span>
                            )}
                          </div>
                        </div>
                        <button
                          id={`go-to-prof-tab-${p.id}`}
                          onClick={() => onNavigateToTab("professores")}
                          className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-100 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Ir para Professores"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TURMAS RESULTS */}
            {matchedTurmas.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-amber-700 flex items-center gap-2">
                  <School className="w-4 h-4 text-amber-600" /> Turmas ({matchedTurmas.length})
                </h4>
                <div className="space-y-2">
                  {matchedTurmas.map(t => {
                    const prof = professores.find(p => p.id === t.professorId);
                    return (
                      <div
                        id={`search-result-turma-${t.id}`}
                        key={t.id}
                        className="bg-slate-50/40 hover:bg-amber-50/30 p-3.5 rounded-xl border border-slate-100 transition-all group flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{t.nome}</p>
                          <div className="flex flex-wrap items-center gap-x-2 mt-1.5 text-[11px] text-slate-500">
                            {t.sala && <span>Sala: {t.sala}</span>}
                            {prof && <span>•</span>}
                            {prof && <span>Prof: {prof.nome}</span>}
                          </div>
                        </div>
                        <button
                          id={`go-to-turmas-tab-${t.id}`}
                          onClick={() => onNavigateToTab("turmas")}
                          className="p-1.5 bg-white text-slate-400 hover:text-amber-600 rounded-lg shadow-sm border border-slate-100 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Ir para Turmas"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
