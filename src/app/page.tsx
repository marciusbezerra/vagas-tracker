"use client";

import { Prisma } from "@/generated/prisma/client";
import React from "react";

interface Link {
  id: number;
  url: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [links, setLinks] = React.useState("");
  // tipo de links do prisma

  const [submittedLinks, setSubmittedLinks] = React.useState<Link[]>([]);
  const [analyzedJobs, setAnalyzedJobs] = React.useState<
    Prisma.JobsCreateInput[]
  >([]);

  // ler os links incluídos usando a api route /api/links
  React.useEffect(() => {
    fetch("/api/links")
      .then((response) => response.json())
      .then((data) => {
        // Aqui você pode atualizar o estado com os links recebidos
        console.log("Links recebidos:", data);
        setSubmittedLinks(data.links);
      })
      .catch((error) => {
        console.error("Erro ao buscar links:", error);
      });
  }, []);

  React.useEffect(() => {
    fetch("/api/jobs")
      .then((response) => response.json())
      .then((data) => {
        console.log("Vagas analisadas recebidas:", data);
        setAnalyzedJobs(data.jobs);
      })
      .catch((error) => {
        console.error("Erro ao buscar vagas analisadas:", error);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const linksArray = links
      .split("\n")
      .map((link) => link.trim())
      .filter((link) => link.length > 0);

    const response = await fetch("/api/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ links: linksArray }),
    });
    const data = await response.json();
    console.log("Success:", data);
    setLinks("");
    setSubmittedLinks((prev) => [...prev, ...data.createdLinks]);
  }

  async function handleAnalyze(link: Link) {
    try {
      // exemplo de chamada para rota de análise; ajuste conforme a API do projeto
      const res = await fetch(`/api/links/${link.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, url: link.url }),
      });
      const data = await res.json();
      console.log("Análise iniciada:", data);

      setSubmittedLinks((prev) => prev.filter((l) => l.id !== link.id));
      fetch("/api/jobs")
        .then((response) => response.json())
        .then((data) => {
          console.log("Vagas analisadas recebidas:", data);
          setAnalyzedJobs(data.jobs);
        })
        .catch((error) => {
          console.error("Erro ao buscar vagas analisadas:", error);
        });
    } catch (err) {
      console.error("Erro ao iniciar análise:", err);
    }
  }

  return (
    <div>
      <h1>Vagas Tracker</h1>
      <p>Cole os links das vagas do LinkedIn que deseja rastrear:</p>
      <form method="POST" onSubmit={handleSubmit}>
        <textarea
          name="links"
          rows={10}
          cols={50}
          placeholder="Cole os links aqui, um por linha"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
        ></textarea>
        <br />
        <button type="submit">Enviar Links</button>
      </form>
      {/* tabela de links com botão Analisar */}
      <div>
        <h2>Links Enviados:</h2>
        {submittedLinks.length === 0 ? (
          <p>Nenhum link enviado ainda.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  URL
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Data de Inclusão
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {submittedLinks.map((link) => (
                <tr key={link.id}>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.url}
                    </a>
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {new Date(link.createdAt).toLocaleString()}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    <button
                      onClick={() => handleAnalyze(link)}
                      style={{ padding: "6px 12px", cursor: "pointer" }}
                    >
                      Analisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* tabela de Jobs com o botão Ir Para */}
      <div>
        <h2>Vagas Analisadas:</h2>
        {analyzedJobs.length === 0 ? (
          <p>Nenhuma vaga analisada ainda.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Data da Vaga
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Título
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Empresa
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Localização
                </th>
                {/* seniority, type, status */}
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Tipo
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Senioridade
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #ccc",
                    padding: "8px",
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {analyzedJobs.map((job, index) => (
                <tr key={index}>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {job.jobDate
                      ? new Date(job.jobDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {job.title}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {job.company}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {job.location}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {job.type || "N/A"}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {job.seniority || "N/A"}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    {job.status || "N/A"}
                  </td>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #eee" }}
                  >
                    <a
                      href={job.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: "6px 12px", cursor: "pointer" }}
                    >
                      Ir Para
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
