import React, { useState, useEffect } from "react";
import { Turma, Aluno, FrequenciaEBD } from "../types";
import { getFrequenciasEBD, saveFrequenciaEBD, deleteFrequenciaEBD } from "../dbService";
import { 
  Calendar, Clock, Check, X, AlertCircle, Save, 
  Trash2, Plus, Edit3, ArrowLeft, ClipboardCheck, Users 
} from "lucide-react";

interface FrequenciaEBDTabProps {
  turmas: Turma[];
  alunos: Aluno[];
  onRefresh: () => void;
}

export default function FrequenciaEBDTab({ turmas, alunos, onRefresh }: FrequenciaEBDTabProps) {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [frequencias, setFrequencias] = useState<FrequenciaEBD[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active Session State (For taking/editing attendance)
  const [activeSession, setActiveSession] = useState<Omit<FrequenciaEBD, "id"> & { id?: string } | null>(null);

  // Load attendance records
  const loadFrequencias = async () => {
    setLoading(true);
    try {
      const records = await getFrequenciasEBD();
      setFrequencias(records);
    } catch (err: any) {
      setError("Erro ao carregar histórico: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFrequencias();
  }, []);

  // Filter students by selected class
  const classStudents = alunos.filter(a => a.turmaId === (selectedTurmaId || activeSession?.turmaId));

  // Initialize new attendance session
  const startNewSession = () => {
    if (!selectedTurmaId) return;

    // Default Date formatted to local date input (YYYY-MM-DD)
    const today = new Date();
    const localDate = today.toISOString().split('T')[0];
    
    // Default Hour (HH:MM)
    const localTime = today.toTimeString().split(' ')[0].slice(0, 5);

    // Default all students to present (true) or absent (false)
    // Let's default all students to absent (false) so teachers explicitly mark them present, or present, or whatever. Defaulting to present is nice but absent is safer. Let's default them to absent (false) or present (true). Let's set present (true) by default so they only uncheck the absents.
    const initialPresencas: { [alunoId: string]: boolean } = {};
    const studentsInClass = alunos.filter(a => a.turmaId === selectedTurmaId);
    studentsInClass.forEach(s => {
      initialPresencas[s.id] = false; // default to absent
    });

    setActiveSession({
      turmaId: selectedTurmaId,
      data: localDate,
      hora: localTime,
      presencas: initialPresencas
    });
    setError(null);
  };

  // Open existing session for editing
  const handleEditSession = (record: FrequenciaEBD) => {
    // Fill in any students that might have been added to the class after the session was created
    const updatedPresencas = { ...record.presencas };
    const studentsInClass = alunos.filter(a => a.turmaId === record.turmaId);
    studentsInClass.forEach(s => {
      if (updatedPresencas[s.id] === undefined) {
        updatedPresencas[s.id] = false; // default new students to absent
      }
    });

    setActiveSession({
      id: record.id,
      turmaId: record.turmaId,
      data: record.data,
      hora: record.hora,
      presencas: updatedPresencas
    });
    setError(null);
  };

  // Toggle present/absent for a single student
  const handleTogglePresenca = (alunoId: string, isPresent: boolean) => {
    if (!activeSession) return;
    setActiveSession({
      ...activeSession,
      presencas: {
        ...activeSession.presencas,
        [alunoId]: isPresent
      }
    });
  };

  // Toggle all students at once
  const handleToggleAll = (status: boolean) => {
    if (!activeSession) return;
    const updatedPresencas: { [alunoId: string]: boolean } = {};
    classStudents.forEach(s => {
      updatedPresencas[s.id] = status;
    });
    setActiveSession({
      ...activeSession,
      presencas: updatedPresencas
    });
  };

  // Save to Firestore
  const handleSaveSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      await saveFrequenciaEBD(activeSession);
      setActiveSession(null);
      await loadFrequencias();
      onRefresh();
    } catch (err: any) {
      setError("Erro ao salvar frequência: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro de frequência?")) return;
    setLoading(true);
    try {
      await deleteFrequenciaEBD(id);
      await loadFrequencias();
      onRefresh();
    } catch (err: any) {
      setError("Erro ao excluir registro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter existing records by selected class
  const filteredFrequencias = selectedTurmaId 
    ? frequencias.filter(f => f.turmaId === selectedTurmaId)
    : [];

  return (
    <div id="frequencia-ebd-container" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Frequência da EBD</h2>
          <p className="text-sm text-slate-500">Realize a chamada dominical e gerencie o histórico</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* --- NOT TAKING ATTENDANCE ACTIVE SESSION --- */}
      {!activeSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Turma Selection & Controls */}
          <div className="lg:col-span-1 bg-white border border-slate-100 p-5 rounded-xl shadow-sm h-fit space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Selecione uma Turma</h3>
            <div className="space-y-3">
              <select
                id="ebd-attendance-turma-select"
                value={selectedTurmaId}
                onChange={(e) => setSelectedTurmaId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">-- Escolha a Turma --</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>

              {selectedTurmaId && (
                <button
                  id="start-attendance-btn"
                  onClick={startNewSession}
                  disabled={alunos.filter(a => a.turmaId === selectedTurmaId).length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Iniciar Nova Frequência
                </button>
              )}

              {selectedTurmaId && alunos.filter(a => a.turmaId === selectedTurmaId).length === 0 && (
                <p className="text-xs text-red-500 text-center">Aviso: Esta turma não possui alunos cadastrados.</p>
              )}
            </div>
          </div>

          {/* Attendance History */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-slate-800 text-base leading-none">
                {selectedTurmaId 
                  ? `Histórico de Frequência - ${turmas.find(t => t.id === selectedTurmaId)?.nome}`
                  : "Selecione uma turma para ver o histórico"}
              </h3>

              {!selectedTurmaId ? (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-medium">Histórico não disponível</p>
                  <p className="text-xs">Escolha uma classe no menu lateral para visualizar os registros de chamadas passadas.</p>
                </div>
              ) : filteredFrequencias.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-medium">Nenhum registro encontrado</p>
                  <p className="text-xs">Ainda não foi realizada nenhuma chamada para esta turma.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3 border-b border-slate-100">Data / Hora</th>
                        <th className="p-3 border-b border-slate-100">Presentes</th>
                        <th className="p-3 border-b border-slate-100">Ausentes</th>
                        <th className="p-3 border-b border-slate-100">Frequência %</th>
                        <th className="p-3 border-b border-slate-100 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredFrequencias.map((record) => {
                        // Calculate stats
                        const studentIds = Object.keys(record.presencas);
                        const presentCount = studentIds.filter(id => record.presencas[id]).length;
                        const absentCount = studentIds.length - presentCount;
                        const freqPercent = studentIds.length > 0 
                          ? Math.round((presentCount / studentIds.length) * 100)
                          : 0;

                        return (
                          <tr id={`freq-row-${record.id}`} key={record.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">
                                {record.data.split('-').reverse().join('/')}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {record.hora}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                {presentCount}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="bg-red-50 text-red-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                {absentCount}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${freqPercent >= 70 ? 'bg-emerald-500' : freqPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                    style={{ width: `${freqPercent}%` }}
                                  />
                                </div>
                                <span className="font-bold text-xs">{freqPercent}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  id={`edit-freq-${record.id}`}
                                  onClick={() => handleEditSession(record)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                  title="Editar chamada"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  id={`delete-freq-${record.id}`}
                                  onClick={() => handleDeleteSession(record.id)}
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
      ) : (
        /* --- ACTIVE ATTENDANCE SESSION SCREEN --- */
        <div id="attendance-session-panel" className="bg-white border border-slate-100 rounded-xl shadow-md p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                id="back-to-history-btn"
                onClick={() => setActiveSession(null)}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Marcando Presença</span>
                <h3 className="text-xl font-bold text-slate-800 leading-tight">
                  {turmas.find(t => t.id === activeSession.turmaId)?.nome}
                </h3>
              </div>
            </div>

            {/* Date and Time Pickers */}
            <div className="flex gap-3">
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data</label>
                <input
                  id="session-date-input"
                  type="date"
                  value={activeSession.data}
                  onChange={(e) => setActiveSession({ ...activeSession, data: e.target.value })}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Horário</label>
                <input
                  id="session-time-input"
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
              <span>Alunos na classe: {classStudents.length}</span>
              <span>•</span>
              <span className="text-emerald-700">Presentes: {Object.values(activeSession.presencas).filter(Boolean).length}</span>
              <span>•</span>
              <span className="text-red-700">Ausentes: {Object.values(activeSession.presencas).filter(x => x === false).length}</span>
            </div>
            <div className="flex gap-2">
              <button
                id="mark-all-present-btn"
                onClick={() => handleToggleAll(true)}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200 font-semibold cursor-pointer"
              >
                Todos Presentes
              </button>
              <button
                id="mark-all-absent-btn"
                onClick={() => handleToggleAll(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded border border-slate-200 font-semibold cursor-pointer"
              >
                Limpar Todos
              </button>
            </div>
          </div>

          {/* Students Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classStudents.map((student) => {
              const isPresent = activeSession.presencas[student.id] ?? false;

              return (
                <div
                  id={`checklist-student-${student.id}`}
                  key={student.id}
                  onClick={() => handleTogglePresenca(student.id, !isPresent)}
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
                      {student.nome.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{student.nome}</h4>
                      {student.telefone && <span className="text-[10px] text-slate-400">{student.telefone}</span>}
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
              id="cancel-attendance-btn"
              type="button"
              onClick={() => setActiveSession(null)}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              id="save-attendance-btn"
              type="button"
              disabled={loading}
              onClick={handleSaveSession}
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
