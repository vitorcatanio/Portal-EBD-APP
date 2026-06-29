import React, { useState, useRef } from "react";
import { Aluno, Turma } from "../types";
import { addAluno, updateAluno, deleteAluno, addAlunosBatch } from "../dbService";
import { exportToExcel, readExcelFile } from "../utils/excel";
import { 
  Plus, Edit, Trash2, Users, Check, X, AlertCircle, 
  Download, Upload, ArrowLeftRight, Search, FileSpreadsheet, MapPin, Phone, Calendar 
} from "lucide-react";

interface AlunosTabProps {
  alunos: Aluno[];
  turmas: Turma[];
  onRefresh: () => void;
}

export default function AlunosTab({ alunos, turmas, onRefresh }: AlunosTabProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTurma, setFilterTurma] = useState("");

  // Validation / Loading
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [transferringAluno, setTransferringAluno] = useState<Aluno | null>(null);
  const [newTurmaId, setNewTurmaId] = useState("");

  // Excel Import State
  const [excelImportData, setExcelImportData] = useState<any[] | null>(null);
  const [mappedImportAlunos, setMappedImportAlunos] = useState<Omit<Aluno, "id">[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setSelectedAluno(null);
    setNome("");
    setDataNascimento("");
    setTelefone("");
    setEndereco("");
    setTurmaId(turmas[0]?.id || "");
    setObservacoes("");
    setError(null);
    setIsEditing(true);
  };

  const openEdit = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setNome(aluno.nome);
    setDataNascimento(aluno.dataNascimento || "");
    setTelefone(aluno.telefone || "");
    setEndereco(aluno.endereco || "");
    setTurmaId(aluno.turmaId);
    setObservacoes(aluno.observacoes || "");
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome completo é obrigatório.");
      return;
    }
    if (!turmaId) {
      setError("Selecione uma turma para o aluno. Se necessário, crie uma turma primeiro.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedAluno) {
        // Edit
        await updateAluno(selectedAluno.id, {
          nome: nome.trim(),
          dataNascimento,
          telefone: telefone.trim(),
          endereco: endereco.trim() || undefined,
          turmaId,
          observacoes: observacoes.trim() || undefined
        });
      } else {
        // Add
        await addAluno({
          nome: nome.trim(),
          dataNascimento,
          telefone: telefone.trim(),
          endereco: endereco.trim() || undefined,
          turmaId,
          observacoes: observacoes.trim() || undefined
        });
      }
      onRefresh();
      setIsEditing(false);
    } catch (err: any) {
      setError("Erro ao salvar aluno: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteAluno(id);
      setShowDeleteConfirm(null);
      onRefresh();
    } catch (err: any) {
      setError("Erro ao excluir aluno: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Transfer Function
  const handleQuickTransfer = async () => {
    if (!transferringAluno || !newTurmaId) return;
    setLoading(true);
    try {
      await updateAluno(transferringAluno.id, { turmaId: newTurmaId });
      setTransferringAluno(null);
      setNewTurmaId("");
      onRefresh();
    } catch (err: any) {
      setError("Erro ao transferir aluno: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Excel Export
  const handleExport = () => {
    if (alunos.length === 0) return;
    const exportData = alunos.map((aluno) => {
      const turma = turmas.find(t => t.id === aluno.turmaId);
      return {
        "Nome Completo": aluno.nome,
        "Data de Nascimento": aluno.dataNascimento || "Não informada",
        "Telefone": aluno.telefone || "Não informado",
        "Endereço": aluno.endereco || "",
        "Turma": turma ? turma.nome : "Sem turma",
        "Observações": aluno.observacoes || ""
      };
    });
    exportToExcel(exportData, "Alunos_Portal_EBD", "Alunos");
  };

  // Excel Import File Selection & Parsing
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const rows = await readExcelFile(file);
      if (rows.length === 0) {
        setError("O arquivo Excel selecionado está vazio.");
        return;
      }

      setExcelImportData(rows);

      // Map rows into real student schema
      const mapped: Omit<Aluno, "id">[] = rows.map((row: any) => {
        // Try to identify column headers
        const rowNome = row["Nome"] || row["Nome Completo"] || row["nome"] || "";
        const rowNasc = row["Data de nascimento"] || row["Data de Nascimento"] || row["nascimento"] || row["Nascimento"] || "";
        const rowTel = row["Telefone"] || row["telefone"] || row["Fone"] || "";
        const rowTurmaName = row["Turma"] || row["turma"] || row["Classe"] || "";

        // Find matching turma ID by name
        let matchedTurmaId = turmas[0]?.id || "";
        if (rowTurmaName) {
          const matched = turmas.find(
            (t) => t.nome.toLowerCase().trim() === String(rowTurmaName).toLowerCase().trim()
          );
          if (matched) {
            matchedTurmaId = matched.id;
          }
        }

        return {
          nome: String(rowNome).trim(),
          dataNascimento: String(rowNasc).trim(),
          telefone: String(rowTel).trim(),
          endereco: "",
          turmaId: matchedTurmaId,
          observacoes: "Importado via planilha Excel"
        };
      }).filter(aluno => aluno.nome.length > 0); // Skip empty rows

      setMappedImportAlunos(mapped);
    } catch (err: any) {
      setError("Erro ao ler planilha: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (mappedImportAlunos.length === 0) return;
    setLoading(true);
    try {
      await addAlunosBatch(mappedImportAlunos);
      setExcelImportData(null);
      setMappedImportAlunos([]);
      onRefresh();
    } catch (err: any) {
      setError("Erro ao salvar dados importados: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search computation
  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (aluno.telefone && aluno.telefone.includes(searchTerm));
    const matchesTurma = filterTurma ? aluno.turmaId === filterTurma : true;
    return matchesSearch && matchesTurma;
  });

  return (
    <div id="alunos-tab-container" className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Alunos</h2>
          <p className="text-sm text-slate-500">Cadastre e distribua alunos pelas classes</p>
        </div>
        {!isEditing && !excelImportData && (
          <div className="flex flex-wrap gap-2">
            <button
              id="export-alunos-btn"
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer"
              title="Exportar alunos para Excel"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button
              id="import-alunos-btn"
              onClick={handleImportClick}
              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer"
              title="Importar alunos do Excel"
            >
              <Upload className="w-4 h-4" /> Importar Excel
            </button>
            <input
              id="alunos-excel-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button
              id="add-aluno-btn"
              onClick={openAdd}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Novo Aluno
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* --- CONFIRMATION SCREEN FOR IMPORT --- */}
      {excelImportData && (
        <div id="excel-import-confirmation" className="bg-white border border-slate-100 rounded-xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-800">Confirmar Importação de Alunos</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {mappedImportAlunos.length} aluno(s) detectado(s) para importação
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-lg max-h-80">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-3 border-b border-slate-100">Nome</th>
                  <th className="p-3 border-b border-slate-100">Data de Nascimento</th>
                  <th className="p-3 border-b border-slate-100">Telefone</th>
                  <th className="p-3 border-b border-slate-100">Turma Designada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mappedImportAlunos.map((aluno, idx) => {
                  const t = turmas.find((x) => x.id === aluno.turmaId);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium">{aluno.nome}</td>
                      <td className="p-3 text-slate-500">{aluno.dataNascimento || "-"}</td>
                      <td className="p-3 text-slate-500">{aluno.telefone || "-"}</td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {t ? t.nome : "Primeira Turma"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              id="cancel-import-btn"
              type="button"
              onClick={() => {
                setExcelImportData(null);
                setMappedImportAlunos([]);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="confirm-save-import-btn"
              type="button"
              disabled={loading}
              onClick={handleConfirmImport}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" /> {loading ? "Importando..." : "Confirmar e Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* --- FORM FOR ADD / EDIT --- */}
      {isEditing ? (
        <form id="aluno-form" onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            {selectedAluno ? "Editar Aluno" : "Cadastrar Novo Aluno"}
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Nome Completo *</label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="aluno-nome-input"
                type="text"
                placeholder="Ex: Pedro Henrique"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Data de Nascimento</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="aluno-nasc-input"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Telefone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="aluno-tel-input"
                  type="text"
                  placeholder="Ex: (11) 98888-8888"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Turma Dominical *</label>
              <select
                id="aluno-turma-select"
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                required
              >
                <option value="">-- Selecione uma Turma --</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Endereço (Opcional)</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="aluno-end-input"
                  type="text"
                  placeholder="Rua, Número, Bairro"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Observações (Opcional)</label>
            <textarea
              id="aluno-obs-input"
              rows={3}
              placeholder="Ex: Aluno requer acompanhamento específico ou interesse em batismo."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              id="cancel-aluno-form-btn"
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="submit-aluno-form-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {loading ? "Salvando..." : "Salvar Aluno"}
            </button>
          </div>
        </form>
      ) : !excelImportData ? (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col md:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="search-alunos-input"
                type="text"
                placeholder="Pesquisar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                id="filter-turma-select"
                value={filterTurma}
                onChange={(e) => setFilterTurma(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Todas as Turmas</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LIST / TABLE */}
          {filteredAlunos.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Nenhum aluno encontrado</p>
              <p className="text-slate-400 text-xs mt-1">Insira alunos manualmente ou carregue uma planilha Excel (.xlsx).</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4 border-b border-slate-100">Aluno</th>
                      <th className="p-4 border-b border-slate-100">Nascimento</th>
                      <th className="p-4 border-b border-slate-100">Telefone</th>
                      <th className="p-4 border-b border-slate-100">Endereço</th>
                      <th className="p-4 border-b border-slate-100">Turma</th>
                      <th className="p-4 border-b border-slate-100 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAlunos.map((aluno) => {
                      const t = turmas.find((x) => x.id === aluno.turmaId);
                      return (
                        <tr id={`aluno-row-${aluno.id}`} key={aluno.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-slate-800 leading-tight">{aluno.nome}</p>
                              {aluno.observacoes && (
                                <p className="text-[11px] text-slate-400 italic max-w-xs truncate mt-0.5" title={aluno.observacoes}>
                                  {aluno.observacoes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 text-xs">{aluno.dataNascimento || "-"}</td>
                          <td className="p-4 text-slate-500 text-xs">{aluno.telefone || "-"}</td>
                          <td className="p-4 text-slate-500 text-xs max-w-xs truncate">{aluno.endereco || "-"}</td>
                          <td className="p-4">
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium inline-block">
                              {t ? t.nome : "Sem Turma"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-1">
                              <button
                                id={`quick-transfer-aluno-${aluno.id}`}
                                onClick={() => {
                                  setTransferringAluno(aluno);
                                  setNewTurmaId(aluno.turmaId);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                title="Transferir de Turma"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </button>
                              <button
                                id={`edit-aluno-${aluno.id}`}
                                onClick={() => openEdit(aluno)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                title="Editar Aluno"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {showDeleteConfirm === aluno.id ? (
                                <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-100">
                                  <button
                                    id={`confirm-del-aluno-${aluno.id}`}
                                    onClick={() => handleDelete(aluno.id)}
                                    className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[11px] font-semibold hover:bg-red-700 transition-all cursor-pointer"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    id={`cancel-del-aluno-${aluno.id}`}
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-all cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`delete-aluno-${aluno.id}`}
                                  onClick={() => setShowDeleteConfirm(aluno.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                  title="Excluir Aluno"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* --- QUICK TRANSFER MODAL / POPUP --- */}
      {transferringAluno && (
        <div id="transfer-modal-backdrop" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div id="transfer-modal-box" className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 max-w-sm w-full space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Transferir Aluno</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mude a turma de <span className="font-semibold text-slate-700">{transferringAluno.nome}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Selecione a Nova Turma</label>
              <select
                id="transfer-new-turma-select"
                value={newTurmaId}
                onChange={(e) => setNewTurmaId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                id="cancel-transfer-btn"
                type="button"
                onClick={() => {
                  setTransferringAluno(null);
                  setNewTurmaId("");
                }}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="confirm-transfer-btn"
                type="button"
                disabled={loading}
                onClick={handleQuickTransfer}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                {loading ? "Transferindo..." : "Confirmar Transferência"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
