"use client";

import "./ListaVacinas.css";
import Titulo from "@/components/UI/Titulo/Titulo";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Vacina } from "@/types/vacina";

const API_BASE_URL = "http://localhost:3010";

export default function ListaVacinas() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [especieFiltro, setEspecieFiltro] = useState("");
  const [vacinaSelecionada, setVacinaSelecionada] = useState<any | null>(null);
  const [vacinas, setVacinas] = useState<any[]>([]);
  const [qtdVacina, setQtdVacina] = useState<number>(0);

  // Carrega os dados da API
  async function carregarDados() {
    try {
      const [resVacinas, resQtd] = await Promise.all([
        fetch(`${API_BASE_URL}/vacinas`),
        fetch(`${API_BASE_URL}/qtdvacinas`),
      ]);

      if (resVacinas.ok) {
        const dadosVacinas = await resVacinas.json();
        setVacinas(Array.isArray(dadosVacinas) ? dadosVacinas : []);
      }

      if (resQtd.ok) {
        const dadosQtd = await resQtd.json();
        setQtdVacina(dadosQtd.qtd || 0);
      }
    } catch (e) {
      console.error("Erro ao carregar vacinas do servidor:", e);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function calcularStatus(vacina: any) {
    if (!vacina.validade) {
      return (Number(vacina.quantidade) || 0) <= 5 ? "baixo" : "ok";
    }

    const hoje = new Date();
    const validade = new Date(vacina.validade);
    const diferencaDias = Math.ceil(
      (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diferencaDias < 0) return "vencida";
    if (diferencaDias <= 30) return "vencendo";
    if ((Number(vacina.quantidade) || 0) <= 5) return "baixo";

    return "ok";
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "ok":
        return "status-ok";
      case "baixo":
        return "status-baixo";
      case "vencendo":
        return "status-vencendo";
      case "vencida":
        return "status-vencida";
      default:
        return "";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "ok":
        return "Em Estoque";
      case "baixo":
        return "Estoque Baixo";
      case "vencendo":
        return "Vencendo";
      case "vencida":
        return "Vencida";
      default:
        return status;
    }
  }

  async function excluirVacina(id: number) {
    const confirmar = window.confirm("Deseja realmente excluir esta vacina?");
    if (!confirmar) return;

    try {
      const response = await fetch(`${API_BASE_URL}/vacinas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir vacina");
      }

      setVacinas((prev) => prev.filter((v) => (v.id ?? v.id_vacina) !== id));
      setQtdVacina((prev) => Math.max(0, prev - 1));
      setVacinaSelecionada(null);

      alert("Vacina excluída com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir vacina.");
    }
  }

  // Filtros protegidos contra campos nulos
  const filteredVacinas = vacinas.filter((vacina) => {
    const termo = search.toLowerCase();

    const matchSearch =
      (vacina.nome && vacina.nome.toLowerCase().includes(termo)) ||
      (vacina.fabricante && vacina.fabricante.toLowerCase().includes(termo)) ||
      (vacina.lote && vacina.lote.toLowerCase().includes(termo));

    const matchTipo =
      tipoFiltro === "" ||
      (vacina.tipo && vacina.tipo.toLowerCase() === tipoFiltro.toLowerCase());

    const matchEspecie =
      especieFiltro === "" ||
      (vacina.especie && vacina.especie.toLowerCase() === especieFiltro.toLowerCase());

    return matchSearch && matchTipo && matchEspecie;
  });

  return (
    <section className="lista-container">
      <Titulo
        titulo="Lista de Vacinas"
        descricao="Gerencie lotes, estoque e validade das vacinas cadastradas."
      />

      {/* CARDS INDICADORES */}
      <div className="cards-grid">
        <div className="info-card">
          <h3>Total de Vacinas</h3>
          <span>{qtdVacina}</span>
        </div>

        <div className="info-card">
          <h3>Total de Doses</h3>
          <span>
            {vacinas.reduce(
              (total, vacina) => total + (Number(vacina.quantidade) || 0),
              0
            )}
          </span>
        </div>

        <div className="info-card">
          <h3>Estoque Baixo</h3>
          <span>
            {vacinas.filter((v) => calcularStatus(v) === "baixo").length}
          </span>
        </div>

        <div className="info-card">
          <h3>Vencendo</h3>
          <span>
            {vacinas.filter((v) => calcularStatus(v) === "vencendo").length}
          </span>
        </div>

        <div className="info-card">
          <h3>Vencidas</h3>
          <span>
            {vacinas.filter((v) => calcularStatus(v) === "vencida").length}
          </span>
        </div>
      </div>

      {/* FILTROS */}
      <div className="filtro-container">
        <input
          type="text"
          placeholder="Buscar vacina, fabricante ou lote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="V8">V8</option>
          <option value="V10">V10</option>
          <option value="Antirrabica">Antirrábica</option>
          <option value="V4">V4</option>
          <option value="V3">V3</option>
        </select>

        <select
          value={especieFiltro}
          onChange={(e) => setEspecieFiltro(e.target.value)}
        >
          <option value="">Todas as espécies</option>
          <option value="cao">Cão</option>
          <option value="gato">Gato</option>
          <option value="ambos">Ambos</option>
        </select>
      </div>

      {/* TABELA */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Vacina</th>
              <th>Tipo</th>
              <th>Espécie</th>
              <th>Fabricante</th>
              <th>Lote</th>
              <th>Validade</th>
              <th>Quantidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredVacinas.map((vacina) => {
              const id = vacina.id ?? vacina.id_vacina;
              return (
                <tr key={id} className={calcularStatus(vacina)}>
                  <td>{vacina.nome || "-"}</td>
                  <td>{vacina.tipo || "-"}</td>
                  <td>{vacina.especie || "-"}</td>
                  <td>{vacina.fabricante || "-"}</td>
                  <td>{vacina.lote || "-"}</td>
                  <td>
                    {vacina.validade
                      ? new Date(vacina.validade).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td>{vacina.quantidade ?? 0}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(
                        calcularStatus(vacina)
                      )}`}
                    >
                      {getStatusText(calcularStatus(vacina))}
                    </span>
                  </td>
                  <td>
                    <div className="acoes">
                      <button onClick={() => setVacinaSelecionada(vacina)}>
                        Detalhes
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredVacinas.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "1.5rem" }}>
                  Nenhuma vacina encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALHES */}
      {vacinaSelecionada && (
        <div
          className="modal-overlay"
          onClick={() => setVacinaSelecionada(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Detalhes da Vacina</h2>

            <div className="detalhes-grid">
              <p><strong>Nome:</strong> {vacinaSelecionada.nome || "-"}</p>
              <p><strong>Tipo:</strong> {vacinaSelecionada.tipo || "-"}</p>
              <p><strong>Espécie:</strong> {vacinaSelecionada.especie || "-"}</p>
              <p><strong>Fabricante:</strong> {vacinaSelecionada.fabricante || "-"}</p>
              <p><strong>Lote:</strong> {vacinaSelecionada.lote || "-"}</p>
              <p>
                <strong>Data de Fabricação:</strong>{" "}
                {vacinaSelecionada.dataFabricacao
                  ? new Date(vacinaSelecionada.dataFabricacao).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
              <p>
                <strong>Validade:</strong>{" "}
                {vacinaSelecionada.validade
                  ? new Date(vacinaSelecionada.validade).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
              <p><strong>Quantidade:</strong> {vacinaSelecionada.quantidade ?? 0}</p>
              <p>
                <strong>Status:</strong>{" "}
                {getStatusText(calcularStatus(vacinaSelecionada))}
              </p>
              <p><strong>Fornecedor:</strong> {vacinaSelecionada.fornecedor || "-"}</p>
              <p><strong>Responsável:</strong> {vacinaSelecionada.responsavel || "-"}</p>
              <p>
                <strong>Data de Entrada:</strong>{" "}
                {vacinaSelecionada.dataEntrada
                  ? new Date(vacinaSelecionada.dataEntrada).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
              <p><strong>Nota Fiscal:</strong> {vacinaSelecionada.notaFiscal || "-"}</p>
              <p>
                <strong>Valor Unitário:</strong> R${" "}
                {Number(vacinaSelecionada.valorUnitario || 0).toFixed(2)}
              </p>
              <p>
                <strong>Valor Total:</strong> R${" "}
                {Number(vacinaSelecionada.valorTotal || 0).toFixed(2)}
              </p>
              <p><strong>Temperatura:</strong> {vacinaSelecionada.temperatura || "-"}</p>
              <p><strong>Armazenamento:</strong> {vacinaSelecionada.localArmazenamento || "-"}</p>
              <p>
                <strong>Refrigeração:</strong>{" "}
                {vacinaSelecionada.refrigeracao ? "Sim" : "Não"}
              </p>
              {vacinaSelecionada.descricao && (
                <p className="full-width">
                  <strong>Descrição:</strong> {vacinaSelecionada.descricao}
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="editar-btn"
                onClick={() => {
                  const id = vacinaSelecionada.id ?? vacinaSelecionada.id_vacina;
                  router.push(`/cadastro-vacinas?id=${id}`);
                }}
              >
                Editar
              </button>

              <button
                className="excluir-btn"
                onClick={() => {
                  const id = vacinaSelecionada.id ?? vacinaSelecionada.id_vacina;
                  excluirVacina(id);
                }}
              >
                Excluir
              </button>

              <button
                className="fechar-modal"
                onClick={() => setVacinaSelecionada(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}