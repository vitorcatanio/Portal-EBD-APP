import React, { useState } from "react";
import { Revista, Turma } from "../types";
import { addRevista, updateRevista, deleteRevista } from "../dbService";
import { Plus, Edit, Trash2, BookOpen, Check, X, AlertCircle } from "lucide-react";

interface RevistasTabProps {
  revistas: Revista[];
  turmas: Turma[];
  onRefresh: () => void;
}

export default function RevistasTab({ revistas, turmas, onRefresh }: RevistasTabProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedRevista, setSelectedRevista] = useState<Revista | null>(null);

  // Form state
  const [nome, setNome] = useState("");
  const [trimestre, setTrimestre] = useState("1º Trimestre");
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [editora, setEditora] = useState("");

  // Validation / Loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setSelectedRevista(null);
    setNome("");
    setTrimestre("1º Trimestre");
    setAno(new Date().getFullYear());
    setEditora("");
    setError(null);
    setIsEditing(true);
  };

  const openEdit = (rev: Revista) => {
    setSelectedRevista(rev);
    setNome(rev.nome);
    setTrimestre(rev.trimestre);
    setAno(rev.ano);
    setEditora(rev.editora || "");
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome da revista é obrigatório.");
      return;
    }
    if (!ano) {
      setError("O ano da revista é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedRevista) {
        // Edit
        await updateRevista(selectedRevista.id, {
          nome: nome.trim(),
          trimestre,
          ano: Number(ano),
          editora: editora.trim() || undefined
        });
      } else {
        // Add
        await addRevista({
          nome: nome.trim(),
          trimestre,
          ano: Number(ano),
          editora: editora.trim() || undefined
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
      await deleteRevista(id);
      setShowDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      setError("Erro ao excluir revista: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="revistas-tab-container" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Revistas</h2>
          <p className="text-sm text-slate-500">Gerencie as revistas e materiais utilizados nas aulas</p>
        </div>
        {!isEditing && (
          <button
            id="add-revista-btn"
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Revista
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
        <form id="revista-form" onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            {selectedRevista ? "Editar Revista" : "Cadastrar Nova Revista"}
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Nome da Revista *</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="rev-nome-input"
                type="text"
                placeholder="Ex: Vida Cristã / Lições da Bíblia"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Trimestre *</label>
              <select
                id="rev-trimestre-select"
                value={trimestre}
                onChange={(e) => setTrimestre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="1º Trimestre">1º Trimestre</option>
                <option value="2º Trimestre">2º Trimestre</option>
                <option value="3º Trimestre">3º Trimestre</option>
                <option value="4º Trimestre">4º Trimestre</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Ano *</label>
              <input
                id="rev-ano-input"
                type="number"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Editora (Opcional)</label>
            <input
              id="rev-editora-input"
              type="text"
              placeholder="Ex: CPAD, Editora Cristã Evangélica, etc."
              value={editora}
              onChange={(e) => setEditora(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              id="cancel-rev-form-btn"
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="submit-rev-form-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {loading ? "Salvando..." : "Salvar Revista"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {revistas.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Nenhuma revista cadastrada</p>
              <p className="text-slate-400 text-xs mt-1">Cadastre revistas para vinculá-las às turmas da EBD.</p>
              <button
                id="empty-add-rev-btn"
                onClick={openAdd}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cadastrar Primeira
              </button>
            </div>
          ) : (
            revistas.map((rev) => {
              // Find classes linked to this magazine
              const linkedTurmas = turmas.filter(t => t.revistaId === rev.id);

              return (
                <div
                  id={`revista-card-${rev.id}`}
                  key={rev.id}
                  className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm leading-tight">{rev.nome}</h4>
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block uppercase">
                            {rev.trimestre} - {rev.ano}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-50">
                      {rev.editora && (
                        <div>
                          <span className="font-medium text-slate-400">Editora: </span>
                          <span>{rev.editora}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-slate-400">Turmas usando: </span>
                        <span>{linkedTurmas.length}</span>
                      </div>
                    </div>

                    {linkedTurmas.length > 0 && (
                      <div className="pt-1">
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
                      id={`edit-rev-${rev.id}`}
                      onClick={() => openEdit(rev)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {showDeleteConfirm === rev.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`confirm-del-rev-${rev.id}`}
                          onClick={() => handleDelete(rev.id)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-all cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          id={`cancel-del-rev-${rev.id}`}
                          onClick={() => setShowDeleteConfirm(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-rev-${rev.id}`}
                        onClick={() => setShowDeleteConfirm(rev.id)}
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
