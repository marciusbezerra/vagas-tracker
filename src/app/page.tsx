"use client";

import { Prisma } from "@/generated/prisma/client";
import React from "react";
import { JobStatus } from "@/generated/prisma/enums";

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
    Prisma.JobsUncheckedCreateInput[]
  >([]);
  // selected job for details view
  const [selectedJob, setSelectedJob] =
    React.useState<Prisma.JobsUncheckedCreateInput | null>(null);
  const [localizations, setLocalizations] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<JobStatus>(JobStatus.NEW);
  const [note, setNote] = React.useState<string>("");
  const [sameCompanyJobs, setSameCompanyJobs] = React.useState<
    Prisma.JobsUncheckedCreateInput[]
  >([]);

  const [filterStatus, setFilterStatus] = React.useState<JobStatus>(
    JobStatus.NEW
  );
  const [filterTitle, setFilterTitle] = React.useState<string>("");
  const [filterSortJobDate, setFilterSortJobDate] =
    React.useState<string>("desc");
  const [filterLocation, setFilterLocation] = React.useState<string>("");

  const statusOptions = Object.values(JobStatus);

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
    fetch(
      `/api/jobs?status=${filterStatus}&title=${filterTitle}&sortJobDate=${filterSortJobDate}&location=${filterLocation}`
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Vagas analisadas recebidas:", data);
        setAnalyzedJobs(data.jobs);
        const uniqueLocations: string[] = Array.from(
          new Set(
            data.jobs.map(
              (job: Prisma.JobsUncheckedCreateInput) => job.location
            )
          )
        );
        // every all locations, independent of filter
        if (localizations.length === 0) {
          setLocalizations(uniqueLocations);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar vagas analisadas:", error);
      });
  }, [
    filterStatus,
    filterTitle,
    filterSortJobDate,
    filterLocation,
    localizations.length,
  ]);

  async function handleLinksSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  async function handleSelectJob(job: Prisma.JobsUncheckedCreateInput) {
    setNote(job.note || "");
    setStatus(job.status || JobStatus.NEW);
    setSelectedJob(job);
    // fetch other jobs from the same company
    fetch(`/api/jobs?company=${encodeURIComponent(job.company)}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Outras vagas da mesma empresa:", data);
        setSameCompanyJobs(data.jobs || []);
      })
      .catch((error) => {
        console.error("Erro ao buscar outras vagas da mesma empresa:", error);
      });
  }

  async function handleLinkAnalyze(link: Link) {
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

  async function handleJobUpdate(
    jobId: number,
    status: JobStatus,
    note: string
  ) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const data = await res.json();
      console.log("Vaga atualizada:", data);

      setAnalyzedJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, status: status, note: note } : job
        )
      );

      setSelectedJob(null);
    } catch (err) {
      console.error("Erro ao atualizar vaga:", err);
    }
  }

  return (
    <div>
      <h1>Vagas Tracker</h1>
      <p>Cole os links das vagas do LinkedIn que deseja rastrear:</p>
      <form method="POST" onSubmit={handleLinksSubmit}>
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
                      onClick={() => handleLinkAnalyze(link)}
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
      <div>
        <h2>Vagas Analisadas:</h2>
        <div style={{ marginBottom: "16px" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as JobStatus)}
            style={{ marginRight: "8px" }}
          >
            <option value="">Filtrar por status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filtrar por título"
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            style={{ marginRight: "8px" }}
          />
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value as string)}
            style={{ marginRight: "8px" }}
          >
            <option value="">Filtrar por localização</option>
            {localizations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <select
            value={filterSortJobDate}
            onChange={(e) => setFilterSortJobDate(e.target.value)}
          >
            <option value="">Ordenar por data</option>
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </div>
        {!analyzedJobs || analyzedJobs.length === 0 ? (
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
                <tr
                  key={index}
                  className={`cursor-pointer hover:bg-blue-800 ${
                    selectedJob?.id === job.id ? "bg-blue-900 text-white" : ""
                  }`}
                  onClick={() => handleSelectJob(job)}
                >
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
                    {job.title}{" "}
                    {job.note && (
                      <>
                        <br />
                        <small className="text-red-500">Nota: {job.note}</small>
                      </>
                    )}
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
      {selectedJob && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            style={{
              backgroundColor: "blue",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "300px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Detalhes da Vaga</h2>
            <p>
              <strong>Título:</strong> {selectedJob.title}{" "}
              {selectedJob.note && (
                <small className="text-red-500">
                  <br />
                  Nota: {selectedJob.note}
                </small>
              )}
            </p>
            <p>
              <strong>Empresa:</strong> {selectedJob.company}
            </p>
            <p>
              <strong>Localização:</strong> {selectedJob.location}
            </p>
            <p>
              <strong>Tipo:</strong> {selectedJob.type || "N/A"}
            </p>
            <p>
              <strong>Senioridade:</strong> {selectedJob.seniority || "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {selectedJob.status || "N/A"}
            </p>
            <p>
              <strong>URL:</strong>{" "}
              <a
                href={selectedJob.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedJob.url}
              </a>
            </p>
            {/* lista de jobs da mesma company (jogDate, title, status) */}
            <div style={{ marginTop: "16px" }}>
              <h3>Outras Vagas na {selectedJob.company}:</h3>
              {sameCompanyJobs.length === 0 && (
                <p>Nenhuma outra vaga encontrada.</p>
              )}
              <ul>
                {sameCompanyJobs
                  .filter(
                    (job) =>
                      job.company === selectedJob.company &&
                      job.id !== selectedJob.id
                  )
                  .map((job) => (
                    <li key={job.id}>
                      {job.title} -{" "}
                      {job.jobDate
                        ? new Date(job.jobDate).toLocaleDateString()
                        : "N/A"}{" "}
                      - {job.status}
                    </li>
                  ))}
              </ul>
            </div>
            <form
              style={{ marginTop: "16px" }}
              method="POST"
              onSubmit={(e) => {
                e.preventDefault();
                handleJobUpdate(selectedJob.id!, status, note);
              }}
            >
              <label>
                Status:
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  style={{ marginLeft: "8px" }}
                >
                  <option value="">Selecione o status</option>
                  {statusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </label>
              <br />
              <label style={{ marginTop: "8px", display: "block" }}>
                Nota:
                <br />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  cols={40}
                  style={{ marginTop: "4px" }}
                ></textarea>
              </label>
              <br />
              <button
                type="submit"
                style={{
                  marginTop: "8px",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Salvar
              </button>
            </form>
            <button
              onClick={() => setSelectedJob(null)}
              style={{
                marginTop: "16px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
