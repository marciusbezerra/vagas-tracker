"use client";

import { Prisma } from "@/generated/prisma/client";
import React from "react";
import { JobStatus } from "@/generated/prisma/enums";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  TextArea,
  Select,
  Modal,
  ModalFooter,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Checkbox,
} from "@/components/ui";
import { set } from "zod";

interface Link {
  id: number;
  url: string;
  done: boolean;
  simpleApply: boolean;
  applied: boolean;
  createdAt: string;
  updatedAt: string;
}

enum LinkIncludeType {
  DEFAULT = "default",
  APPLIED = "applied",
  WITH_SIMPLE_APPLY = "with_simple_apply",
}

export default function Home() {
  const [links, setLinks] = React.useState("");
  const [linkIncludeType, setLinkIncludeType] = React.useState<LinkIncludeType>(
    LinkIncludeType.DEFAULT,
  );
  // const [appliedLink, setAppliedLink] = React.useState<string | null>(null);
  // const [simpleApply, setSimpleApply] = React.useState(false);
  const [submittedLinks, setSubmittedLinks] = React.useState<Link[]>([]);
  const [analyzedJobs, setAnalyzedJobs] = React.useState<
    Prisma.JobsUncheckedCreateInput[]
  >([]);
  const [selectedJob, setSelectedJob] =
    React.useState<Prisma.JobsUncheckedCreateInput | null>(null);
  const [localizations, setLocalizations] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<JobStatus>(JobStatus.NEW);
  const [note, setNote] = React.useState<string>("");
  const [recruiterNotified, setRecruiterNotified] =
    React.useState<boolean>(false);
  const [sameCompanyJobs, setSameCompanyJobs] = React.useState<
    Prisma.JobsUncheckedCreateInput[]
  >([]);

  // Filters
  const [filterStatus, setFilterStatus] = React.useState<JobStatus>(
    JobStatus.NEW,
  );
  const [filterSearch, setFilterSearch] = React.useState<string>("");
  const [filterSortJobDate, setFilterSortJobDate] =
    React.useState<string>("job_desc");
  const [filterLocation, setFilterLocation] = React.useState<string>("");
  const [filterSimpleApply, setFilterSimpleApply] = React.useState<string>("");

  // Pagination
  const [linksPage, setLinksPage] = React.useState(1);
  const [jobsPage, setJobsPage] = React.useState(1);
  const linksPerPage = 10;
  const jobsPerPage = 20;

  const statusOptions = Object.values(JobStatus);

  React.useEffect(() => {
    fetch("/api/links")
      .then((response) => response.json())
      .then((data) => {
        setSubmittedLinks(data.links);
      })
      .catch((error) => {
        console.error("Erro ao buscar links:", error);
      });
  }, []);

  React.useEffect(() => {
    fetch(
      `/api/jobs?status=${filterStatus}&search=${filterSearch}&sortJobDate=${filterSortJobDate}&location=${filterLocation}&simpleApply=${filterSimpleApply}`,
    )
      .then((response) => response.json())
      .then((data) => {
        setAnalyzedJobs(data.jobs);
        const uniqueLocations: string[] = Array.from(
          new Set(
            data.jobs?.map(
              (job: Prisma.JobsUncheckedCreateInput) => job.location,
            ),
          ),
        );
        if (localizations.length === 0) {
          setLocalizations(uniqueLocations);
        }
        // Reset to first page when filters change
        setJobsPage(1);
      })
      .catch((error) => {
        console.error("Erro ao buscar vagas analisadas:", error);
      });
  }, [
    filterStatus,
    filterSearch,
    filterSortJobDate,
    filterLocation,
    filterSimpleApply,
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
      body: JSON.stringify({
        links: linksArray,
        simpleApply: linkIncludeType === LinkIncludeType.WITH_SIMPLE_APPLY,
        applied: linkIncludeType === LinkIncludeType.APPLIED,
      }),
    });
    const data = await response.json();
    setLinks("");
    setSubmittedLinks((prev) => [...prev, ...data.createdLinks]);
  }

  async function handleSelectJob(job: Prisma.JobsUncheckedCreateInput) {
    setNote(job.note || "");
    setStatus(job.status || JobStatus.NEW);
    setRecruiterNotified(job.recruiterNotified || false);
    setSelectedJob(job);

    fetch(`/api/jobs?company=${encodeURIComponent(job.company)}`)
      .then((response) => response.json())
      .then((data) => {
        setSameCompanyJobs(data.jobs || []);
      })
      .catch((error) => {
        console.error("Erro ao buscar outras vagas da mesma empresa:", error);
      });
  }

  async function handleLinkAnalyze(link: Link) {
    try {
      const res = await fetch(`/api/links/${link.id}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, url: link.url }),
      });
      await res.json();

      setSubmittedLinks((prev) => prev.filter((l) => l.id !== link.id));

      const jobsRes = await fetch("/api/jobs");
      const jobsData = await jobsRes.json();
      setAnalyzedJobs(jobsData.jobs);
    } catch (err) {
      console.error("Erro ao iniciar análise:", err);
    }
  }

  async function handleJobUpdate(
    jobId: number,
    status: JobStatus,
    note: string,
    recruiterNotified: boolean,
  ) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note, recruiterNotified }),
      });
      await res.json();

      setAnalyzedJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: status,
                note: note,
                recruiterNotified: recruiterNotified,
              }
            : job,
        ),
      );

      setSelectedJob(null);
    } catch (err) {
      console.error("Erro ao atualizar vaga:", err);
    }
  }

  function recruiterMustBeNotified(
    applyDate: Date | null,
    status: JobStatus,
    recruiterNotified: boolean,
  ): boolean {
    if (status === JobStatus.APPLIED && !recruiterNotified && applyDate) {
      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - applyDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffInDays <= 7;
    }
    return false;
  }

  const getStatusLabel = (status: JobStatus): string => {
    const labels: Record<JobStatus, string> = {
      [JobStatus.NEW]: "Nova",
      [JobStatus.APPLIED]: "Candidatado",
      [JobStatus.INTERVIEWING]: "Entrevista",
      [JobStatus.IN_CONTACT]: "Em Contato",
      [JobStatus.SEE_LATER]: "Ver Depois",
      [JobStatus.REJECTED]: "Rejeitado",
      [JobStatus.DISCARDED]: "Descartado",
    };
    return labels[status] || status;
  };

  // Pagination calculations
  const paginatedLinks = React.useMemo(() => {
    const startIndex = (linksPage - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    return (submittedLinks || []).slice(startIndex, endIndex);
  }, [submittedLinks, linksPage, linksPerPage]);

  const paginatedJobs = React.useMemo(() => {
    const startIndex = (jobsPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return (analyzedJobs || []).slice(startIndex, endIndex);
  }, [analyzedJobs, jobsPage, jobsPerPage]);

  const totalLinksPages = Math.ceil(
    (submittedLinks || []).length / linksPerPage,
  );
  const totalJobsPages = Math.ceil((analyzedJobs || []).length / jobsPerPage);
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">
            Vagas Tracker
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Gerencie suas candidaturas de emprego de forma eficiente
          </p>
        </div>

        <Card className="mb-4 w-full">
          <CardHeader>
            <CardTitle>Links Úteis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row space-x-2">
              <a
                href="https://www.linkedin.com/jobs/search/?currentJobId=4372189820&f_EA=true&f_WT=2&geoId=106057199&keywords=%22.net%22%20OR%20%22angular%22%20OR%20%22ionic%22%20OR%20%22c%23%22%20OR%20%22asp%22%20OR%20%22webforms%22%20OR%20%22bv6%22%20OR%20%22winforms%22&origin=JOB_SEARCH_PAGE_SEARCH_BUTTON&refresh=true&sortBy=DD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:underline"
              >
                VAGAS COM MENOS DE 10 CANDITADOS
              </a>
              <a
                href="https://www.linkedin.com/jobs/search/?currentJobId=4364471543&f_TPR=r86400&f_WT=2&geoId=106057199&keywords=%22.net%22%20OR%20%22angular%22%20OR%20%22ionic%22%20OR%20%22c%23%22%20OR%20%22asp%22%20OR%20%22webforms%22%20OR%20%22bv6%22%20OR%20%22winforms%22&origin=JOB_SEARCH_PAGE_SEARCH_BUTTON&refresh=true&sortBy=DD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:underline"
              >
                VAGAS DE HOJE!
              </a>
              <a
                href="https://www.linkedin.com/jobs/search/?currentJobId=4363800573&f_WT=2&geoId=106057199&keywords=%22.net%22%20OR%20%22angular%22%20OR%20%22ionic%22%20OR%20%22c%23%22%20OR%20%22asp%22%20OR%20%22webforms%22%20OR%20%22bv6%22%20OR%20%22winforms%22&origin=JOB_SEARCH_PAGE_SEARCH_BUTTON&refresh=true&sortBy=R"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:underline"
              >
                VAGAS
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Adicionar Novas Vagas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLinksSubmit} className="space-y-3">
              <TextArea
                label="Links do LinkedIn"
                placeholder="Cole os links das vagas aqui, um por linha"
                rows={5}
                value={links}
                onChange={(e) => setLinks(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Adicionar Links
                </Button>
                <Select
                  value={linkIncludeType}
                  onChange={(e) =>
                    setLinkIncludeType(e.target.value as LinkIncludeType)
                  }
                  options={[
                    { value: LinkIncludeType.DEFAULT, label: "Padrão" },
                    {
                      value: LinkIncludeType.WITH_SIMPLE_APPLY,
                      label: "Candidatura Simplificada",
                    },
                    { value: LinkIncludeType.APPLIED, label: "Aplicado" },
                  ]}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Submitted Links Table */}
        {(submittedLinks || []).length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Links Pendentes</CardTitle>
                <Badge variant="info">{(submittedLinks || []).length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ações</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Candidatura Simplificada</TableHead>
                    <TableHead>Aplicado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <Button
                          onClick={() => handleLinkAnalyze(link)}
                          size="sm"
                          variant="primary"
                        >
                          Analisar
                        </Button>
                      </TableCell>
                      <TableCell>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary)] hover:underline truncate block max-w-md text-xs"
                        >
                          {link.url}
                        </a>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(link.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {link.simpleApply ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {link.applied ? "Sim" : "Não"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={linksPage}
                totalPages={totalLinksPages}
                onPageChange={setLinksPage}
                itemsPerPage={linksPerPage}
                totalItems={(submittedLinks || []).length}
              />
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as JobStatus)}
                options={[
                  { value: "", label: "Todos" },
                  ...statusOptions.map((status) => ({
                    value: status,
                    label: getStatusLabel(status),
                  })),
                ]}
              />
              <Input
                label="Título / Empresa"
                type="text"
                placeholder="Filtrar por título ou empresa"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
              <Select
                label="Localização"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                options={[
                  { value: "", label: "Todas" },
                  ...localizations.map((loc) => ({ value: loc, label: loc })),
                ]}
              />
              <Select
                label="Ordenar por Data"
                value={filterSortJobDate}
                onChange={(e) => setFilterSortJobDate(e.target.value)}
                options={[
                  { value: "job_desc", label: "Vaga - Mais recentes" },
                  { value: "job_asc", label: "Vaga - Mais antigas" },
                  { value: "apply_desc", label: "Candidatura - Mais recentes" },
                  { value: "apply_asc", label: "Candidatura - Mais antigas" },
                ]}
              />
              {/* Candidatura Simplificada */}
              <Select
                label="Candidatura Simplificada"
                value={filterSimpleApply}
                onChange={(e) => setFilterSimpleApply(e.target.value)}
                options={[
                  { value: "", label: "Todas" },
                  { value: "sim", label: "Sim" },
                  { value: "não", label: "Não" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vagas Analisadas</CardTitle>
              <Badge variant="default">{(analyzedJobs || []).length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!analyzedJobs || analyzedJobs.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-[var(--text-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-4 text-[var(--text-secondary)]">
                  Nenhuma vaga analisada ainda. Adicione links acima para
                  começar.
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ações</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.map((job) => (
                      <TableRow
                        key={job.id}
                        onClick={() => handleSelectJob(job)}
                        // se simpleApply for true, muda a cor da linha
                        className={
                          selectedJob?.id === job.id
                            ? "bg-[var(--primary-light)]"
                            : "" +
                              (job.simpleApply
                                ? "bg-green-900 hover:bg-green-800 cursor-pointer"
                                : "hover:bg-[var(--surface-hover)] cursor-pointer")
                        }
                      >
                        <TableCell>
                          <div className="flex gap-1">
                            <a
                              href={job.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="sm" variant="primary">
                                Ver
                              </Button>
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge status={job.status}>
                            {getStatusLabel(job.status || JobStatus.NEW)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {job.title + " "}
                              {job.recruiterNotified && (
                                <Badge
                                  variant="warning"
                                  // className="ml-2 text-xs h-5 px-1.5"
                                >
                                  R. Notificado
                                </Badge>
                              )}
                              {recruiterMustBeNotified(
                                job.applyDate ? new Date(job.applyDate) : null,
                                job.status || JobStatus.NEW,
                                job.recruiterNotified || false,
                              ) && (
                                <Badge variant="error">
                                  Notificar Recrutador !!
                                </Badge>
                              )}
                            </div>
                            {job.note && (
                              <div className="text-xs text-[var(--error)] mt-0.5">
                                📝 {job.note.substring(0, 40)}
                                {job.note.length > 40 ? "..." : ""}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{job.company}</TableCell>
                        <TableCell className="text-xs text-[var(--text-muted)]">
                          {job.location}
                        </TableCell>
                        <TableCell className="text-xs text-[var(--text-muted)]">
                          {job.jobDate
                            ? new Date(job.jobDate).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={jobsPage}
                  totalPages={totalJobsPages}
                  onPageChange={setJobsPage}
                  itemsPerPage={jobsPerPage}
                  totalItems={analyzedJobs.length}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Job Detail Modal */}
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title="Detalhes da Vaga"
          size="lg"
        >
          {selectedJob && (
            <>
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    {selectedJob.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {selectedJob.company}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">
                      Localização
                    </span>
                    <p className="text-[var(--foreground)]">
                      {selectedJob.location}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">
                      Tipo
                    </span>
                    <p className="text-[var(--foreground)]">
                      {selectedJob.type || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">
                      Senioridade
                    </span>
                    <p className="text-[var(--foreground)]">
                      {selectedJob.seniority || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">
                      Data da Vaga
                    </span>
                    <p className="text-[var(--foreground)]">
                      {selectedJob.jobDate
                        ? new Date(selectedJob.jobDate).toLocaleDateString(
                            "pt-BR",
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {selectedJob.simpleApply && (
                  <div>
                    <Badge variant="success">Candidatura Simplificada</Badge>
                  </div>
                )}

                <div>
                  <span className="text-xs text-[var(--text-muted)]">URL</span>
                  <a
                    href={selectedJob.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--primary)] hover:underline block truncate"
                  >
                    {selectedJob.url}
                  </a>
                </div>

                {/* Other jobs from same company */}
                {sameCompanyJobs.filter(
                  (job) =>
                    job.company === selectedJob.company &&
                    job.id !== selectedJob.id,
                ).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <h4 className="font-semibold text-sm text-[var(--foreground)] mb-2">
                      Outras Vagas na {selectedJob.company}
                    </h4>
                    <ul className="space-y-1.5">
                      {sameCompanyJobs
                        .filter(
                          (job) =>
                            job.company === selectedJob.company &&
                            job.id !== selectedJob.id,
                        )
                        .map((job) => (
                          <li
                            key={job.id}
                            className="flex items-center justify-between text-xs p-1.5 rounded bg-[var(--surface-hover)] cursor-pointer hover:border hover:border-[var(--primary)]"
                            onClick={() => handleSelectJob(job)}
                          >
                            <span className="text-[var(--foreground)] text-sm">
                              {job.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[var(--text-muted)]">
                                {job.jobDate
                                  ? new Date(job.jobDate).toLocaleDateString(
                                      "pt-BR",
                                    )
                                  : "N/A"}
                              </span>
                              <Badge status={job.status}>
                                {getStatusLabel(job.status || JobStatus.NEW)}
                              </Badge>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Update Form */}
                <form
                  className="mt-4 pt-4 border-t border-[var(--border)] space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJobUpdate(
                      selectedJob.id!,
                      status,
                      note,
                      recruiterNotified,
                    );
                  }}
                >
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobStatus)}
                    options={statusOptions.map((statusOption) => ({
                      value: statusOption,
                      label: getStatusLabel(statusOption),
                    }))}
                  />
                  {/* Recrutador Notificado */}
                  <Checkbox
                    label="Recrutador Notificado"
                    checked={recruiterNotified}
                    onChange={(e) => setRecruiterNotified(e.target.checked)}
                  />
                  <TextArea
                    label="Anotações"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Adicione suas anotações sobre esta vaga..."
                  />
                  <ModalFooter>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedJob(null)}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Salvar Alterações
                    </Button>
                  </ModalFooter>
                </form>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
}
