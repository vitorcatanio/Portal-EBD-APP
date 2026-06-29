import React, { useState } from "react";
import { Professor, Turma } from "../types";
import { addProfessor, updateProfessor, deleteProfessor } from "../dbService";
import { Plus, Edit, Trash2, Mail, Phone, User, Check, X, AlertCircle } from "lucide-react";

interface ProfessoresTabProps {
  professores: Professor[];
  turmas: Turma[];
  onRefresh: () => void;
}

export default function ProfessoresTab({ professores, turmas, onRefresh }: ProfessoresTabProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedProf, setSelectedProf] = useState<Professor | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  
  // Validation / Loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setSelectedProf(null);
    setNome("");
    setTelefone("");
    setEmail("");
    setError(null);
    setIsEditing(true);
  };

  const openEdit = (prof: Professor) => {
    setSelectedProf(prof);
    setNome(prof.nome);
    setTelefone(prof.telefone);
    setEmail(prof.email || "");
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome do professor é obrigatório.");
      return;
    }
    if (!telefone.trim()) {
      setError("O telefone do professor é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedProf) {
        // Edit
        await updateProfessor(selectedProf.id, {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim() || undefined
        });
      } else {
        // Add
        await addProfessor({
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim() || undefined
        });
      }
      onRefresh();
      setIsEditing(false);
    } catch (err: any) {
      setError("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteProfessor(id);
      setShowDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      setError("Erro ao deletar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="professores-tab-container" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Professores</h2>
          <p className="text-sm text-slate-500">Gerencie o corpo docente da sua Escola Dominical</p>
        </div>
        {!isEditing && (
          <button
            id="add-professor-btn"
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Professor
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
        <form id="professor-form" onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            {selectedProf ? "Editar Professor" : "Cadastrar Novo Professor"}
          </h3>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Nome Completo *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="prof-nome-input"
                type="text"
                placeholder="Ex: João da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Telefone *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="prof-telefone-input"
                  type="text"
                  placeholder="Ex: (11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">E-mail (Opcional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="prof-email-input"
                  type="email"
                  placeholder="Ex: joao@ebd.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              id="cancel-prof-form-btn"
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="submit-prof-form-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {loading ? "Salvando..." : "Salvar Professor"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {professores.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Nenhum professor cadastrado</p>
              <p className="text-slate-400 text-xs mt-1">Cadastre professores para vinculá-los às turmas da EBD.</p>
              <button
                id="empty-add-prof-btn"
                onClick={openAdd}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cadastrar Primeiro
              </button>
            </div>
          ) : (
            professores.map((prof) => {
              // Find linked turmas for this professor
              const linkedTurmas = turmas.filter(t => t.professorId === prof.id);

              return (
                <div
                  id={`professor-card-${prof.id}`}
                  key={prof.id}
                  className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold uppercase text-base">
                          {prof.nome.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm leading-tight">{prof.nome}</h4>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                            {linkedTurmas.length === 1 
                              ? "1 Turma vinculada" 
                              : `${linkedTurmas.length} Turmas vinculadas`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prof.telefone}</span>
                      </div>
                      {prof.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{prof.email}</span>
                        </div>
                      )}
                    </div>

                    {linkedTurmas.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Turmas ministradas:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {linkedTurmas.map(t => (
                            <span key={t.id} className="bg-slate-50 border border-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">
                              {t.nome}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-slate-50">
                    <button
                      id={`edit-prof-${prof.id}`}
                      onClick={() => openEdit(prof)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {showDeleteConfirm === prof.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`confirm-del-prof-${prof.id}`}
                          onClick={() => handleDelete(prof.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-all cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          id={`cancel-del-prof-${prof.id}`}
                          onClick={() => setShowDeleteConfirm(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-prof-${prof.id}`}
                        onClick={() => setShowDeleteConfirm(prof.id)}
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
