import React, { useState } from "react";
import { Turma, Professor, Revista } from "../types";
import { addTurma, updateTurma, deleteTurma } from "../dbService";
import { Plus, Edit, Trash2, School, Check, X, AlertCircle, Info, Calendar } from "lucide-react";

interface TurmasTabProps {
  turmas: Turma[];
  professores: Professor[];
  revistas: Revista[];
  onRefresh: () => void;
}

export default function TurmasTab({ turmas, professores, revistas, onRefresh }: TurmasTabProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [sala, setSala] = useState("");
  const [faixaEtaria, setFaixaEtaria] = useState("");
  const [revistaId, setRevistaId] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Validation / Loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setSelectedTurma(null);
    setNome("");
    setProfessorId(professores[0]?.id || "");
    setSala("");
    setFaixaEtaria("");
    setRevistaId(revistas[0]?.id || "");
    setObservacoes("");
    setError(null);
    setIsEditing(true);
  };

  const openEdit = (turma: Turma) => {
    setSelectedTurma(turma);
    setNome(turma.nome);
    setProfessorId(turma.professorId);
    setSala(turma.sala || "");
    setFaixaEtaria(turma.faixaEtaria || "");
    setRevistaId(turma.revistaId);
    setObservacoes(turma.observacoes || "");
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome da turma é obrigatório.");
      return;
    }
    if (!professorId) {
      setError("Selecione um professor responsável. Se necessário, cadastre um professor primeiro.");
      return;
    }
    if (!revistaId) {
      setError("Selecione a revista que esta turma utilizará. Se necessário, cadastre uma revista primeiro.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedTurma) {
        // Edit
        await updateTurma(selectedTurma.id, {
          nome: nome.trim(),
          professorId,
          sala: sala.trim() || undefined,
          faixaEtaria: faixaEtaria.trim() || undefined,
          revistaId,
          observacoes: observacoes.trim() || undefined
        });
      } else {
        // Add
        await addTurma({
          nome: nome.trim(),
          professorId,
          sala: sala.trim() || undefined,
          faixaEtaria: faixaEtaria.trim() || undefined,
          revistaId,
          observacoes: observacoes.trim() || undefined
        });
      }
      onRefresh();
      setIsEditing(false);
    } catch (err: any) {
      setError("Erro ao salvar turma: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteTurma(id);
      setShowDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      setError("Erro ao excluir turma: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="turmas-tab-container" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Turmas</h2>
          <p className="text-sm text-slate-500">Gerencie as classes da Escola Dominical</p>
        </div>
        {!isEditing && (
          <button
            id="add-turma-btn"
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Turma
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isEditing ? (
        <form id="turma-form" onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            {selectedTurma ? "Editar Turma" : "Cadastrar Nova Turma"}
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Nome da Turma *</label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="turma-nome-input"
                type="text"
                placeholder="Ex: Jovens, Adultos, Infantil"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Professor Responsável *</label>
              <select
                id="turma-prof-select"
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                required
              >
                <option value="">-- Selecione um Professor --</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              {professores.length === 0 && (
                <span className="text-[10px] text-red-500">Aviso: Cadastre um professor primeiro.</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Revista / Material *</label>
              <select
                id="turma-revista-select"
                value={revistaId}
                onChange={(e) => setRevistaId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                required
              >
                <option value="">-- Selecione uma Revista --</option>
                {revistas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome} ({r.trimestre} - {r.ano})
                  </option>
                ))}
              </select>
              {revistas.length === 0 && (
                <span className="text-[10px] text-red-500">Aviso: Cadastre uma revista primeiro.</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Sala (Opcional)</label>
              <input
                id="turma-sala-input"
                type="text"
                placeholder="Ex: Sala 03, Templo, etc."
                value={sala}
                onChange={(e) => setSala(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Faixa Etária (Opcional)</label>
              <input
                id="turma-faixa-input"
                type="text"
                placeholder="Ex: 18 a 35 anos, Infantil"
                value={faixaEtaria}
                onChange={(e) => setFaixaEtaria(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Observações (Opcional)</label>
            <textarea
              id="turma-obs-input"
              rows={3}
              placeholder="Ex: Turma focada em dinâmicas em grupo."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              id="cancel-turma-form-btn"
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="submit-turma-form-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {loading ? "Salvando..." : "Salvar Turma"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Nenhuma turma cadastrada</p>
              <p className="text-slate-400 text-xs mt-1">Configure suas classes da Escola Dominical agora mesmo.</p>
              <button
                id="empty-add-turma-btn"
                onClick={openAdd}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Criar Primeira Turma
              </button>
            </div>
          ) : (
            turmas.map((turma) => {
              const prof = professores.find((p) => p.id === turma.professorId);
              const revista = revistas.find((r) => r.id === turma.revistaId);

              return (
                <div
                  id={`turma-card-${turma.id}`}
                  key={turma.id}
                  className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <School className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base leading-tight">{turma.nome}</h4>
                        {turma.faixaEtaria && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                            {turma.faixaEtaria}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-50">
                      <div>
                        <span className="font-semibold text-slate-400 block uppercase text-[9px] tracking-wider">Professor Responsável:</span>
                        <span className="font-medium text-slate-800">{prof ? prof.nome : "Não vinculado"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 block uppercase text-[9px] tracking-wider">Revista Utilizada:</span>
                        <span className="font-medium text-slate-800">{revista ? `${revista.nome} (${revista.trimestre}/${revista.ano})` : "Não vinculada"}</span>
                      </div>
                      {turma.sala && (
                        <div>
                          <span className="font-semibold text-slate-400 block uppercase text-[9px] tracking-wider">Sala de Aula:</span>
                          <span className="font-medium text-slate-800">{turma.sala}</span>
                        </div>
                      )}
                    </div>

                    {turma.observacoes && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex gap-2 items-start">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 leading-relaxed italic">{turma.observacoes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-slate-50">
                    <button
                      id={`edit-turma-${turma.id}`}
                      onClick={() => openEdit(turma)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {showDeleteConfirm === turma.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`confirm-del-turma-${turma.id}`}
                          onClick={() => handleDelete(turma.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-all cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          id={`cancel-del-turma-${turma.id}`}
                          onClick={() => setShowDeleteConfirm(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-turma-${turma.id}`}
                        onClick={() => setShowDeleteConfirm(turma.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
