import React, { useState, useEffect } from "react";
import { Turma, Aluno, FrequenciaEBD, Membro, FrequenciaCulto, Professor } from "../types";
import { getFrequenciasEBD, getFrequenciasCulto } from "../dbService";
import { exportToExcel } from "../utils/excel";
import { 
  BarChart3, FileSpreadsheet, Download, Calendar, Users, 
  School, HelpCircle, Check, Percent, ArrowUpRight, TrendingUp 
} from "lucide-react";

interface RelatoriosTabProps {
  turmas: Turma[];
  alunos: Aluno[];
  membros: Membro[];
  professores: Professor[];
}

export default function RelatoriosTab({ turmas, alunos, membros, professores }: RelatoriosTabProps) {
  const [frequenciasEBD, setFrequenciasEBD] = useState<FrequenciaEBD[]>([]);
  const [frequenciasCulto, setFrequenciasCulto] = useState<FrequenciaCulto[]>([]);
  const [loading, setLoading] = useState(false);

  // Period filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ebd, culto] = await Promise.all([
        getFrequenciasEBD(),
        getFrequenciasCulto()
      ]);
      setEBDRecords(ebd);
      setCultoRecords(culto);
    } catch (err) {
      console.error("Erro ao carregar frequencias em relatorios:", err);
    } finally {
      setLoading(false);
    }
  };

  const setEBDRecords = (ebd: FrequenciaEBD[]) => {
    setFrequenciasEBD(ebd);
  };

  const setCultoRecords = (culto: FrequenciaCulto[]) => {
    setFrequenciasCulto(culto);
  };

  useEffect(() => {
    loadData();
  }, [alunos, membros]);

  // --- EBD STATS COMPUTATION ---
  const totalEBDStudents = alunos.length;
  
  // Calculate total presents/absents over all EBD sessions
  let totalEBDPresentCount = 0;
  let totalEBDAbsentCount = 0;

  frequenciasEBD.forEach(session => {
    Object.values(session.presencas).forEach(isPresent => {
      if (isPresent) totalEBDPresentCount++;
      else totalEBDAbsentCount++;
    });
  });

  const totalEBDActions = totalEBDPresentCount + totalEBDAbsentCount;
  const overallEBDFrequency = totalEBDActions > 0 
    ? Math.round((totalEBDPresentCount / totalEBDActions) * 100) 
    : 0;

  // Compute presence per class (Turma)
  const turmaStats = turmas.map(t => {
    const classSessions = frequenciasEBD.filter(f => f.turmaId === t.id);
    let classPresents = 0;
    let classAbsents = 0;

    classSessions.forEach(session => {
      Object.keys(session.presencas).forEach(alunoId => {
        // Only count if student belongs to this class or was marked there
        const isPresent = session.presencas[alunoId];
        if (isPresent) classPresents++;
        else classAbsents++;
      });
    });

    const classTotal = classPresents + classAbsents;
    const frequency = classTotal > 0 ? Math.round((classPresents / classTotal) * 100) : 0;
    const studentCount = alunos.filter(a => a.turmaId === t.id).length;

    return {
      id: t.id,
      nome: t.nome,
      studentCount,
      sessionsCount: classSessions.length,
      frequency,
      present: classPresents,
      absent: classAbsents
    };
  });

  // Compute presence per individual EBD student
  const studentStats = alunos.map(aluno => {
    const classSessions = frequenciasEBD.filter(f => f.turmaId === aluno.turmaId);
    let sessionsPresent = 0;
    let totalSessionsAvailable = 0;

    classSessions.forEach(session => {
      if (session.presencas[aluno.id] !== undefined) {
        totalSessionsAvailable++;
        if (session.presencas[aluno.id]) {
          sessionsPresent++;
        }
      }
    });

    const frequency = totalSessionsAvailable > 0 
      ? Math.round((sessionsPresent / totalSessionsAvailable) * 100) 
      : 0;

    const t = turmas.find(x => x.id === aluno.turmaId);

    return {
      nome: aluno.nome,
      turmaNome: t ? t.nome : "Sem turma",
      presentCount: sessionsPresent,
      sessionsCount: totalSessionsAvailable,
      frequency
    };
  }).sort((a, b) => b.frequency - a.frequency); // Sort by highest attendance rate


  // --- WORSHIP STATS COMPUTATION ---
  const totalWorshipServices = frequenciasCulto.length;
  const totalMembrosCount = membros.length;

  // Worship individual member frequency
  const memberWorshipStats = membros.map(m => {
    let presentCount = 0;
    let totalWorshipsChecked = 0;

    frequenciasCulto.forEach(session => {
      if (session.presencas[m.id] !== undefined) {
        totalWorshipsChecked++;
        if (session.presencas[m.id]) {
          presentCount++;
        }
      }
    });

    const freqPercent = totalWorshipsChecked > 0 
      ? Math.round((presentCount / totalWorshipsChecked) * 100) 
      : 0;

    return {
      nome: m.nome,
      presentCount,
      totalCount: totalWorshipsChecked,
      frequency: freqPercent
    };
  }).sort((a, b) => b.frequency - a.frequency);

  // Group worships by Month (YYYY-MM)
  const monthlyWorshipStats: { [month: string]: { presents: number, total: number, count: number } } = {};
  frequenciasCulto.forEach(session => {
    // Extract YYYY-MM
    const monthKey = session.data.slice(0, 7); // YYYY-MM
    const sessionPresents = Object.values(session.presencas).filter(Boolean).length;
    const sessionTotal = Object.keys(session.presencas).length;

    if (!monthlyWorshipStats[monthKey]) {
      monthlyWorshipStats[monthKey] = { presents: 0, total: 0, count: 0 };
    }
    monthlyWorshipStats[monthKey].presents += sessionPresents;
    monthlyWorshipStats[monthKey].total += sessionTotal;
    monthlyWorshipStats[monthKey].count += 1;
  });

  const formattedMonthlyStats = Object.keys(monthlyWorshipStats).map(key => {
    const { presents, total, count } = monthlyWorshipStats[key];
    const avgFrequency = total > 0 ? Math.round((presents / total) * 100) : 0;
    
    // Convert YYYY-MM to Portuguese Month name
    const [year, month] = key.split('-');
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthName = monthNames[parseInt(month) - 1] || month;

    return {
      label: `${monthName} / ${year}`,
      avgFrequency,
      servicesCount: count
    };
  }).reverse(); // Most recent first

  // Group by year
  const annualWorshipStats: { [year: string]: { presents: number, total: number } } = {};
  frequenciasCulto.forEach(session => {
    const yearKey = session.data.slice(0, 4);
    const sessionPresents = Object.values(session.presencas).filter(Boolean).length;
    const sessionTotal = Object.keys(session.presencas).length;

    if (!annualWorshipStats[yearKey]) {
      annualWorshipStats[yearKey] = { presents: 0, total: 0 };
    }
    annualWorshipStats[yearKey].presents += sessionPresents;
    annualWorshipStats[yearKey].total += sessionTotal;
  });

  const formattedAnnualStats = Object.keys(annualWorshipStats).map(key => {
    const { presents, total } = annualWorshipStats[key];
    const avgFrequency = total > 0 ? Math.round((presents / total) * 100) : 0;
    return {
      label: key,
      avgFrequency
    };
  });


  // --- EXPORT TRIGGERS ---

  // Export 1: Lista de presença da EBD
  const exportEBDAttendance = () => {
    if (frequenciasEBD.length === 0) return;
    const data: any[] = [];
    frequenciasEBD.forEach(session => {
      const turma = turmas.find(t => t.id === session.turmaId);
      const classStudents = alunos.filter(a => a.turmaId === session.turmaId);

      classStudents.forEach(student => {
        const isPresent = session.presencas[student.id];
        data.push({
          "Data": session.data.split('-').reverse().join('/'),
          "Horário": session.hora,
          "Turma": turma ? turma.nome : "Sem turma",
          "Nome do Aluno": student.nome,
          "Status": isPresent === undefined ? "Não cadastrado à época" : (isPresent ? "Presente" : "Ausente")
        });
      });
    });
    exportToExcel(data, "Lista_Presenca_EBD", "Frequência EBD");
  };

  // Export 2: Lista de presença do culto
  const exportWorshipAttendance = () => {
    if (frequenciasCulto.length === 0) return;
    const data: any[] = [];
    frequenciasCulto.forEach(session => {
      membros.forEach(m => {
        const isPresent = session.presencas[m.id];
        data.push({
          "Data": session.data.split('-').reverse().join('/'),
          "Horário": session.hora,
          "Culto": session.nomeCulto,
          "Nome do Membro": m.nome,
          "Status": isPresent === undefined ? "Não registrado" : (isPresent ? "Presente" : "Ausente")
        });
      });
    });
    exportToExcel(data, "Lista_Presenca_Culto_Solene", "Frequência Culto");
  };

  // Export 3: Relatórios por turma
  const exportTurmasSummary = () => {
    const data = turmaStats.map(stat => {
      const classObj = turmas.find(t => t.id === stat.id);
      const prof = classObj ? professores.find(p => p.id === classObj.professorId) : null;
      return {
        "Nome da Turma": stat.nome,
        "Professor Responsável": prof ? prof.nome : "Não cadastrado",
        "Total de Alunos Matriculados": stat.studentCount,
        "Total de Chamadas Realizadas": stat.sessionsCount,
        "Presenças Totais": stat.present,
        "Ausências Totais": stat.absent,
        "Média de Frequência (%)": stat.frequency + "%"
      };
    });
    exportToExcel(data, "Relatorio_Presenca_Por_Turma", "Resumo de Classes");
  };

  // Export 4: Relatórios por período (Custom period filter)
  const exportPeriodSummary = () => {
    if (!startDate || !endDate) {
      alert("Por favor, selecione as datas de Início e Fim para exportar.");
      return;
    }

    // Filter sessions within period
    const filteredEBD = frequenciasEBD.filter(f => f.data >= startDate && f.data <= endDate);
    const filteredCulto = frequenciasCulto.filter(f => f.data >= startDate && f.data <= endDate);

    const ebdSummary = filteredEBD.map(session => {
      const t = turmas.find(x => x.id === session.turmaId);
      const studentIds = Object.keys(session.presencas);
      const presentCount = studentIds.filter(id => session.presencas[id]).length;
      return {
        "Tipo": "EBD (Escola Dominical)",
        "Data": session.data.split('-').reverse().join('/'),
        "Nome da Turma/Culto": t ? t.nome : "Sem turma",
        "Total Alunos/Membros": studentIds.length,
        "Presentes": presentCount,
        "Ausentes": studentIds.length - presentCount,
        "Frequência %": studentIds.length > 0 ? Math.round((presentCount / studentIds.length) * 100) + "%" : "0%"
      };
    });

    const cultoSummary = filteredCulto.map(session => {
      const studentIds = Object.keys(session.presencas);
      const presentCount = studentIds.filter(id => session.presencas[id]).length;
      return {
        "Tipo": "Culto Solene",
        "Data": session.data.split('-').reverse().join('/'),
        "Nome da Turma/Culto": session.nomeCulto,
        "Total Alunos/Membros": studentIds.length,
        "Presentes": presentCount,
        "Ausentes": studentIds.length - presentCount,
        "Frequência %": studentIds.length > 0 ? Math.round((presentCount / studentIds.length) * 100) + "%" : "0%"
      };
    });

    const finalReport = [...ebdSummary, ...cultoSummary];
    exportToExcel(
      finalReport, 
      `Relatorio_Periodo_${startDate}_a_${endDate}`, 
      "Relatório por Período"
    );
  };

  return (
    <div id="relatorios-container" className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Painel de Relatórios</h2>
        <p className="text-sm text-slate-500">Indicadores gerais de assiduidade e exportações oficiais</p>
      </div>

      {/* --- DASHBOARD STATISTICS OVERVIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frequência Geral EBD</span>
            <span className="text-3xl font-extrabold text-blue-600 mt-1 block">{overallEBDFrequency}%</span>
            <span className="text-xs text-slate-400 mt-1 block">Presença média global</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Chamadas EBD</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block">{frequenciasEBD.length}</span>
            <span className="text-xs text-slate-400 mt-1 block">Domingos letivos</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Alunos EBD</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-1 block">{totalEBDStudents}</span>
            <span className="text-xs text-slate-400 mt-1 block">Matriculados ativos</span>
          </div>
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Cultos Solenes</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">{totalWorshipServices}</span>
            <span className="text-xs text-slate-400 mt-1 block">Registrados no sistema</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- EBD CHART & STUDENT STATS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presença por turma (Visual Progress) */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Frequência por Turma</h3>
            <p className="text-xs text-slate-400">Média de presenças acumulada para cada classe</p>
          </div>

          <div className="space-y-4">
            {turmaStats.map(stat => (
              <div key={stat.id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate">{stat.nome}</span>
                  <span>{stat.frequency}% ({stat.studentCount} aluno(s))</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${stat.frequency}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{stat.sessionsCount} chamada(s) realizada(s)</span>
                  <span>Presenças: {stat.present} | Ausências: {stat.absent}</span>
                </div>
              </div>
            ))}
            {turmaStats.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Nenhuma turma cadastrada no momento.</p>
            )}
          </div>
        </div>

        {/* Frequência por aluno */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Alunos Mais Assíduos (EBD)</h3>
            <p className="text-xs text-slate-400">Lista dos alunos com maior assiduidade nas lições</p>
          </div>

          <div className="overflow-x-auto flex-1 max-h-64 mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-2 border-b border-slate-100">Aluno</th>
                  <th className="p-2 border-b border-slate-100">Turma</th>
                  <th className="p-2 border-b border-slate-100 text-center">Frequência %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentStats.slice(0, 8).map((student, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2 font-medium">{student.nome}</td>
                    <td className="p-2 text-slate-500">{student.turmaNome}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        student.frequency >= 80 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : student.frequency >= 50 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-red-50 text-red-700'
                      }`}>
                        {student.frequency}%
                      </span>
                    </td>
                  </tr>
                ))}
                {studentStats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">Nenhum aluno cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- WORSHIP STATS SHOWING MONTHLY / MEMBER STATS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequência mensal do Culto Solene */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Frequência Mensal (Culto Solene)</h3>
            <p className="text-xs text-slate-400">Taxa de frequência consolidada agrupada por mês</p>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto">
            {formattedMonthlyStats.map((month, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{month.label}</span>
                  <span>{month.avgFrequency}% de frequência</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full" 
                    style={{ width: `${month.avgFrequency}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">{month.servicesCount} culto(s) registrado(s) no mês</p>
              </div>
            ))}
            {formattedMonthlyStats.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum culto registrado no momento.</p>
            )}
          </div>
        </div>

        {/* Frequência individual dos membros do culto */}
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Assiduidade Individual (Membros)</h3>
            <p className="text-xs text-slate-400">Consolidado de presença individual dos membros no templo</p>
          </div>

          <div className="overflow-x-auto flex-1 max-h-64 mt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-2 border-b border-slate-100">Membro</th>
                  <th className="p-2 border-b border-slate-100 text-center">Presenças / Cultos</th>
                  <th className="p-2 border-b border-slate-100 text-center">Frequência %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {memberWorshipStats.slice(0, 8).map((memb, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2 font-medium">{memb.nome}</td>
                    <td className="p-2 text-center text-slate-500">{memb.presentCount} / {memb.totalCount}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        memb.frequency >= 80 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : memb.frequency >= 50 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-red-50 text-red-700'
                      }`}>
                        {memb.frequency}%
                      </span>
                    </td>
                  </tr>
                ))}
                {memberWorshipStats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">Nenhum membro cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ADVANCED EXPORTS CENTRE --- */}
      <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Exportações Avançadas (Excel)</h3>
          <p className="text-xs text-slate-400">Gere e baixe arquivos Excel para relatórios internos e secretaria da igreja</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/40">
            <h4 className="font-semibold text-slate-800 text-sm">Frequência Geral EBD</h4>
            <p className="text-xs text-slate-500 leading-normal">Planilha completa contendo todas as chamadas por data, turma e status individual de cada aluno.</p>
            <button
              id="export-ebd-all-btn"
              onClick={exportEBDAttendance}
              disabled={frequenciasEBD.length === 0}
              className="flex items-center gap-1.5 w-full justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Chamadas EBD
            </button>
          </div>

          <div className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/40">
            <h4 className="font-semibold text-slate-800 text-sm">Frequência Geral Culto</h4>
            <p className="text-xs text-slate-500 leading-normal">Histórico de assiduidade de todos os cultos solenes, indicando data, nome do culto e presença de membros.</p>
            <button
              id="export-culto-all-btn"
              onClick={exportWorshipAttendance}
              disabled={frequenciasCulto.length === 0}
              className="flex items-center gap-1.5 w-full justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Chamadas Cultos
            </button>
          </div>

          <div className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/40">
            <h4 className="font-semibold text-slate-800 text-sm">Relatórios Consolidado</h4>
            <p className="text-xs text-slate-500 leading-normal">Visão de secretaria contendo a lista das turmas, professores titulares, total de alunos e médias de presença.</p>
            <button
              id="export-turmas-sum-btn"
              onClick={exportTurmasSummary}
              disabled={turmas.length === 0}
              className="flex items-center gap-1.5 w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Relatório Turmas
            </button>
          </div>
        </div>

        {/* PERIOD EXPORT BAR */}
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/70 flex flex-col md:flex-row items-end gap-4 justify-between">
          <div className="space-y-1 w-full md:w-auto">
            <h4 className="font-semibold text-slate-800 text-sm">Relatórios por Período</h4>
            <p className="text-xs text-slate-500 leading-normal">Defina uma data de início e fim para consolidar os dados filtrados deste intervalo.</p>
          </div>

          <div className="flex flex-wrap gap-3 items-end w-full md:w-auto">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Início</label>
              <input
                id="export-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Fim</label>
              <input
                id="export-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              id="export-period-btn"
              onClick={exportPeriodSummary}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer h-[32px]"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Período
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
