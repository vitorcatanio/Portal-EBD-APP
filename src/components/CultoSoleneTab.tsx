import React, { useState, useEffect } from "react";
import { Membro, Turma, FrequenciaCulto } from "../types";
import { 
  getMembros, addMembro, updateMembro, deleteMembro,
  getFrequenciasCulto, saveFrequenciaCulto, deleteFrequenciaCulto
} from "../dbService";
import { 
  Plus, Edit, Trash2, Users, Check, X, AlertCircle, Save, 
  Search, Calendar, Clock, MapPin, Phone, Info, ClipboardCheck, ArrowLeft, Play, Eye
} from "lucide-react";

interface CultoSoleneTabProps {
  turmas: Turma[];
  onRefresh: () => void;
}

export default function CultoSoleneTab({ turmas, onRefresh }: CultoSoleneTabProps) {
  const [subTab, setSubTab] = useState<"membros" | "presenca">("membros");
  const [membros, setMembros] = useState<Membro[]>([]);
  const [frequencias, setFrequencias] = useState<FrequenciaCulto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Member State
  const [isEditingMembro, setIsEditingMembro] = useState<boolean>(false);
  const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null);
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState("");

  // Member Delete confirmation
  const [showMembroDeleteConfirm, setShowMembroDeleteConfirm] = useState<string | null>(null);

  // Active Worship Attendance State
  const [activeSession, setActiveSession] = useState<Omit<FrequenciaCulto, "id"> & { id?: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membrosList, frequenciasList] = await Promise.all([
        getMembros(),
        getFrequenciasCulto()
      ]);
      setMembros(membrosList);
      setFrequencias(frequenciasList);
    } catch (err: any) {
      setError("Erro ao carregar dados: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddMembro = () => {
    setSelectedMembro(null);
    setNome("");
    setDataNascimento("");
    setTelefone("");
    setTurmaId("");
    setObservacoes("");
    setError(null);
    setIsEditingMembro(true);
  };

  const openEditMembro = (m: Membro) => {
    setSelectedMembro(m);
    setNome(m.nome);
    setDataNascimento(m.dataNascimento || "");
    setTelefone(m.telefone || "");
    setTurmaId(m.turmaId || "");
    setObservacoes(m.observacoes || "");
    setError(null);
    setIsEditingMembro(true);
  };

  const handleSaveMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("O nome do membro é obrigatório.");
      return;
    }

    setLoading(true);
    try {
      if (selectedMembro) {
        await updateMembro(selectedMembro.id, {
          nome: nome.trim(),
          dataNascimento,
          telefone: telefone.trim(),
          turmaId: turmaId || "",
          observacoes: observacoes.trim() || undefined
        });
      } else {
        await addMembro({
          nome: nome.trim(),
          dataNascimento,
          telefone: telefone.trim(),
          turmaId: turmaId || "",
          observacoes: observacoes.trim() || undefined
        });
      }
      setIsEditingMembro(false);
      await loadData();
      onRefresh();
    } catch (err: any) {
      setError("Erro ao salvar membro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMembro = async (id: string) => {
    setLoading(true);
    try {
      await deleteMembro(id);
      setShowMembroDeleteConfirm(null);
      await loadData();
      onRefresh();
    } catch (err: any) {
      setError("Erro ao excluir membro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Active Worship Session helpers
  const startNewWorshipSession = () => {
    const today = new Date();
    const localDate = today.toISOString().split('T')[0];
    const localTime = today.toTimeString().split(' ')[0].slice(0, 5);

    // Default all members to absent (false)
    const initialPresencas: { [membroId: string]: boolean } = {};
    membros.forEach(m => {
      initialPresencas[m.id] = false;
    });

    setActiveSession({
      data: localDate,
      hora: localTime,
      nomeCulto: "Culto de Domingo Noite",
      presencas: initialPresencas
    });
    setError(null);
  };

  const handleEditWorshipSession = (record: FrequenciaCulto) => {
    const updatedPresencas = { ...record.presencas };
    membros.forEach(m => {
      if (updatedPresencas[m.id] === undefined) {
        updatedPresencas[m.id] = false;
      }
    });

    setActiveSession({
      id: record.id,
      data: record.data,
      hora: record.hora,
      nomeCulto: record.nomeCulto,
      presencas: updatedPresencas
    });
    setError(null);
  };

  const handleToggleWorshipPresenca = (membroId: string, isPresent: boolean) => {
    if (!activeSession) return;
    setActiveSession({
      ...activeSession,
      presencas: {
        ...activeSession.presencas,
        [membroId]: isPresent
      }
    });
  };

  const handleToggleAllWorship = (status: boolean) => {
    if (!activeSession) return;
    const updatedPresencas: { [membroId: string]: boolean } = {};
    membros.forEach(m => {
      updatedPresencas[m.id] = status;
    });
    setActiveSession({
      ...activeSession,
      presencas: updatedPresencas
    });
  };

  const handleSaveWorshipSession = async () => {
    if (!activeSession) return;
    if (!activeSession.nomeCulto.trim()) {
      setError("O nome do culto é obrigatório.");
      return;
    }
    setLoading(true);
    try {
      await saveFrequenciaCulto(activeSession);
      setActiveSession(null);
      await loadData();
      onRefresh();
    } catch (err: any) {
      setError("Erro ao salvar lista de presença do culto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorshipSession = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro de presença do culto?")) return;
    setLoading(true);
    try {
      await deleteFrequenciaCulto(id);
      await loadData();
      onRefresh();
    } catch (err: any) {
      setError("Erro ao excluir registro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filters members
  const filteredMembros = membros.filter(m => {
    return m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (m.telefone && m.telefone.includes(searchTerm));
  });

  return (
    <div id="culto-solene-container" className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Culto Solene</h2>
          <p className="text-sm text-slate-500">Gerenciamento de membros e controle de frequência nos cultos</p>
        </div>

        {/* Sub-tab navigation */}
        {!activeSession && !isEditingMembro && (
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              id="subtab-membros-btn"
              onClick={() => setSubTab("membros")}
              className={`px-4 py-2 rounded-md font-semibold transition-all cursor-pointer ${
                subTab === "membros" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Membros da Igreja
            </button>
            <button
              id="subtab-presenca-btn"
              onClick={() => setSubTab("presenca")}
              className={`px-4 py-2 rounded-md font-semibold transition-all cursor-pointer ${
                subTab === "presenca" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Presença dos Cultos
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

      {/* --- MEMBROS DIRECTORY VIEW --- */}
      {subTab === "membros" && !isEditingMembro && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="search-membros-input"
                type="text"
                placeholder="Pesquisar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              />
            </div>
            <button
              id="add-membro-btn"
              onClick={openAddMembro}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Cadastrar Membro
            </button>
          </div>

          {filteredMembros.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Nenhum membro encontrado</p>
              <p className="text-slate-400 text-xs mt-1">Adicione membros para realizar a chamada do Culto Solene.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4 border-b border-slate-100">Nome</th>
                      <th className="p-4 border-b border-slate-100">Nascimento</th>
                      <th className="p-4 border-b border-slate-100">Telefone</th>
                      <th className="p-4 border-b border-slate-100">Turma EBD</th>
                      <th className="p-4 border-b border-slate-100">Observações</th>
                      <th className="p-4 border-b border-slate-100 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredMembros.map((m) => {
                      const t = turmas.find((x) => x.id === m.turmaId);
                      return (
                        <tr id={`membro-row-${m.id}`} key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-semibold text-slate-800">{m.nome}</td>
                          <td className="p-4 text-slate-500 text-xs">{m.dataNascimento || "-"}</td>
                          <td className="p-4 text-slate-500 text-xs">{m.telefone || "-"}</td>
                          <td className="p-4">
                            {t ? (
                              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                {t.nome}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Não frequenta</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500 text-xs max-w-xs truncate">{m.observacoes || "-"}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                id={`edit-membro-${m.id}`}
                                onClick={() => openEditMembro(m)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {showMembroDeleteConfirm === m.id ? (
                                <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-100">
                                  <button
                                    id={`confirm-del-membro-${m.id}`}
                                    onClick={() => handleDeleteMembro(m.id)}
                                    className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[11px] font-semibold hover:bg-red-700 transition-all cursor-pointer"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    id={`cancel-del-membro-${m.id}`}
                                    onClick={() => setShowMembroDeleteConfirm(null)}
                                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-all cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`delete-membro-${m.id}`}
                                  onClick={() => setShowMembroDeleteConfirm(m.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                  title="Excluir"
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
      )}

      {/* --- MEMBRO FORM VIEW --- */}
      {subTab === "membros" && isEditingMembro && (
        <form id="membro-form" onSubmit={handleSaveMembro} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            {selectedMembro ? "Editar Membro" : "Cadastrar Novo Membro"}
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Nome Completo *</label>
            <input
              id="membro-nome-input"
              type="text"
              placeholder="Ex: Clara de Souza"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Data de Nascimento</label>
              <input
                id="membro-nasc-input"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Telefone</label>
              <input
                id="membro-tel-input"
                type="text"
                placeholder="Ex: (11) 98888-7777"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Turma da EBD (Opcional)</label>
            <select
              id="membro-turma-select"
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">-- Não Frequenta / Sem Turma --</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Observações (Opcional)</label>
            <textarea
              id="membro-obs-input"
              rows={3}
              placeholder="Ex: Membro ativo na liderança de música."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              id="cancel-membro-form-btn"
              type="button"
              onClick={() => setIsEditingMembro(false)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="submit-membro-form-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" /> {loading ? "Salvando..." : "Salvar Membro"}
            </button>
          </div>
        </form>
      )}

      {/* --- WORSHIP ATTENDANCE LIST & HISTORY --- */}
      {subTab === "presenca" && !activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls column */}
          <div className="lg:col-span-1 bg-white border border-slate-100 p-5 rounded-xl shadow-sm h-fit space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Novo Culto</h3>
            <p className="text-xs text-slate-500">Inicie uma nova lista de chamada para registrar as presenças do culto de hoje.</p>
            <button
              id="start-worship-attendance-btn"
              onClick={startNewWorshipSession}
              disabled={membros.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Iniciar Chamada de Culto
            </button>
            {membros.length === 0 && (
              <p className="text-xs text-red-500 text-center">Cadastre membros antes de iniciar a frequência.</p>
            )}
          </div>

          {/* History Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-slate-800 text-base leading-none">Histórico de Cultos Registrados</h3>

              {frequencias.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-medium">Nenhum culto registrado</p>
                  <p className="text-xs">As chamadas realizadas para os cultos solenes aparecerão aqui.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3 border-b border-slate-100">Culto</th>
                        <th className="p-3 border-b border-slate-100">Data / Hora</th>
                        <th className="p-3 border-b border-slate-100">Presentes</th>
                        <th className="p-3 border-b border-slate-100">Frequência %</th>
                        <th className="p-3 border-b border-slate-100 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {frequencias.map((record) => {
                        const studentIds = Object.keys(record.presencas);
                        const presentCount = studentIds.filter(id => record.presencas[id]).length;
                        const freqPercent = studentIds.length > 0 
                          ? Math.round((presentCount / studentIds.length) * 100)
                          : 0;

                        return (
                          <tr id={`worship-freq-row-${record.id}`} key={record.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <span className="font-semibold text-slate-800">{record.nomeCulto}</span>
                            </td>
                            <td className="p-3 text-xs text-slate-500">
                              <div>{record.data.split('-').reverse().join('/')}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{record.hora}</div>
                            </td>
                            <td className="p-3">
                              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                {presentCount} / {studentIds.length}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-xs">{freqPercent}%</span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  id={`edit-worship-freq-${record.id}`}
                                  onClick={() => handleEditWorshipSession(record)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                  title="Editar chamada"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  id={`delete-worship-freq-${record.id}`}
                                  onClick={() => handleDeleteWorshipSession(record.id)}
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                  title="Excluir chamada"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ACTIVE WORSHIP ATTENDANCE SESSION PANEL --- */}
      {subTab === "presenca" && activeSession && (
        <div id="worship-attendance-session-panel" className="bg-white border border-slate-100 rounded-xl shadow-md p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                id="back-to-worship-history-btn"
                onClick={() => setActiveSession(null)}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Presença do Culto Solene</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="worship-session-name-input"
                    type="text"
                    value={activeSession.nomeCulto}
                    onChange={(e) => setActiveSession({ ...activeSession, nomeCulto: e.target.value })}
                    className="font-bold text-lg text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent py-0.5 px-1 rounded"
                    placeholder="Ex: Culto de Domingo Noite"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date and Time Pickers */}
            <div className="flex gap-3">
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data</label>
                <input
                  id="worship-session-date-input"
                  type="date"
                  value={activeSession.data}
                  onChange={(e) => setActiveSession({ ...activeSession, data: e.target.value })}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Horário</label>
                <input
                  id="worship-session-time-input"
                  type="time"
                  value={activeSession.hora}
                  onChange={(e) => setActiveSession({ ...activeSession, hora: e.target.value })}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Quick toggle bar */}
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200/50">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span>Membros cadastrados: {membros.length}</span>
              <span>•</span>
              <span className="text-emerald-700">Presentes: {Object.values(activeSession.presencas).filter(Boolean).length}</span>
              <span>•</span>
              <span className="text-red-700">Ausentes: {Object.values(activeSession.presencas).filter(x => x === false).length}</span>
            </div>
            <div className="flex gap-2">
              <button
                id="worship-mark-all-present"
                onClick={() => handleToggleAllWorship(true)}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200 font-semibold cursor-pointer"
              >
                Todos Presentes
              </button>
              <button
                id="worship-mark-all-absent"
                onClick={() => handleToggleAllWorship(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-semibold cursor-pointer"
              >
                Limpar Todos
              </button>
            </div>
          </div>

          {/* Members Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {membros.map((membro) => {
              const isPresent = activeSession.presencas[membro.id] ?? false;
              const t = turmas.find(x => x.id === membro.turmaId);

              return (
                <div
                  id={`worship-checklist-member-${membro.id}`}
                  key={membro.id}
                  onClick={() => handleToggleWorshipPresenca(membro.id, !isPresent)}
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer select-none transition-all ${
                    isPresent 
                      ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50' 
                      : 'border-slate-100 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                      isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {membro.nome.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm leading-snug">{membro.nome}</h4>
                      {t && (
                        <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                          EBD: {t.nome}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Present / Absent Pills */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                      isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isPresent ? "Presente" : "Ausente"}
                    </span>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      isPresent ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                    }`}>
                      {isPresent && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="worship-cancel-session"
              type="button"
              onClick={() => setActiveSession(null)}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="worship-save-session"
              type="button"
              disabled={loading}
              onClick={handleSaveWorshipSession}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" /> {loading ? "Salvando..." : "Salvar Frequência"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Small inner component helper for Edit icon
function Edit3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
