import {
  getApps,
  initializeApp,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

/*
  MÓDULO INDEPENDENTE DE ACOMPANHAMENTO
  -------------------------------------
  Este arquivo não modifica os registros de atendimento.
  Ele apenas lê os clientes já cadastrados e grava o campo
  "acompanhamento" dentro do documento de cada cliente.
*/

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const clientesRef = collection(db, "clientes");

const $ = (id) => document.getElementById(id);

const clienteAcompanhamento = $("clienteAcompanhamento");
const filtroStatusAcompanhamento = $("filtroStatusAcompanhamento");
const listaAcompanhamento = $("listaAcompanhamento");
const resumoClienteAcompanhamento = $("resumoClienteAcompanhamento");
const alertaPendenciasAcompanhamento = $("alertaPendenciasAcompanhamento");
const totalAcompanhamentoPendente = $("totalAcompanhamentoPendente");
const totalAcompanhamentoAndamento = $("totalAcompanhamentoAndamento");
const totalAcompanhamentoConcluido = $("totalAcompanhamentoConcluido");
const toast = $("toast");

const cardsDashboardPendencias = $("cardsDashboardPendencias");
const listaDashboardPendencias = $("listaDashboardPendencias");
const tituloListaDashboardPendencias = $("tituloListaDashboardPendencias");
const subtituloListaDashboardPendencias = $("subtituloListaDashboardPendencias");
const clientesDashboardPendencias = $("clientesDashboardPendencias");
const fecharListaDashboardPendencias = $("fecharListaDashboardPendencias");
const totalClientesComPendencias = $("totalClientesComPendencias");
const agendaHojeTopbar = $("agendaHojeTopbar");


let clientes = [];
let cancelarEscutaClientes = null;
let usuarioAtualEmail = "";

const CHECKLIST_ACOMPANHAMENTO = [
  {
    id: "notas-fiscais",
    nome: "Notas fiscais",
    itens: [
      "POR ENQUANTO NÃO IRÁ EMITIR NOTA",
      "Parametrização fiscal verificada",
      "NF-e/NFC-e configurada",
      "CFOP, CST/CSOSN e NCM conferidos",
      "Tributos configurados (ICMS/PIS/COFINS/IBS/CBS)",
      "Teste de emissão realizado e validado",
    ],
  },
  {
    id: "certificado-digital",
    nome: "Certificado digital",
    itens: [
      "POR ENQUANTO NÃO TEM CERTIFICADO DIGITAL",
      "Certificado recebido",
      "Certificado instalado",
      "Certificado configurado no sistema",
      "Teste do certificado realizado",
    ],
  },
  {
    id: "treinamento",
    nome: "Treinamento",
    itens: [
      "Treinamento agendado",
      "Treinamento realizado",
      "Cliente orientado e liberado para uso",
    ],
  },
  {
    id: "importacao",
    nome: "Importação",
    itens: [
      "Realizado agendamento para importação",
      "Arquivos/dados recebidos",
      "Importação realizada",
      "Dados importados conferidos",
    ],
  },
  {
    id: "contador",
    nome: "Contador",
    itens: [
      "Dados do contador cadastrados",
      "Configurações/integrações do contador realizadas",
      "Contador orientado",
    ],
  },
  {
    id: "equipamentos-instalados",
    nome: "Equipamentos instalados",
    itens: [
      "Equipamentos cadastrados",
      "Instalação física realizada",
      "Configuração dos equipamentos realizada",
      "Equipamentos testados e funcionando",
    ],
  },
  {
    id: "PDV",
    nome: "PDV",
    itens: [
      "PDVONLINE OK",
      "PDVOFFLINE (SEUPDV)",
      "Simulações de Vendas Feitas",
      "Abertura e Fechamento de Caixa",
    ],
  },
];

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mostrarToastAcompanhamento(mensagem, erro = false) {
  if (!toast) return;

  toast.textContent = mensagem;
  toast.classList.remove("hidden");
  toast.classList.toggle("error", erro);
  toast.classList.add("show");

  window.clearTimeout(mostrarToastAcompanhamento.timer);
  mostrarToastAcompanhamento.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function acompanhamentoDoCliente(cliente) {
  const salvo = cliente?.acompanhamento || {};
  const resultado = {};

  CHECKLIST_ACOMPANHAMENTO.forEach((categoria) => {
    const categoriaSalva = salvo[categoria.id] || {};
    const marcadosSalvos = categoriaSalva.marcados || {};

    resultado[categoria.id] = {
      marcados: categoria.itens.reduce((acc, _item, indice) => {
        acc[indice] =
          marcadosSalvos[indice] === true ||
          marcadosSalvos[String(indice)] === true;
        return acc;
      }, {}),

      dataAgendada:
        categoriaSalva.dataAgendada || "",

      horaAgendada:
        categoriaSalva.horaAgendada || "",
    };
  });

  return resultado;
}

function indicesQueContamNoProgresso(categoria) {
  // As opções especiais de Notas Fiscais e Certificado Digital são atalhos.
  // Elas NÃO entram no cálculo normal do percentual.
  // Assim, se o usuário desmarcar a opção especial e concluir todos os
  // demais itens da categoria, o progresso continua chegando a 100%.
  if (
    categoria.id === "notas-fiscais" ||
    categoria.id === "certificado-digital"
  ) {
    return categoria.itens
      .map((_item, indice) => indice)
      .filter((indice) => indice !== 0);
  }

  return categoria.itens.map((_item, indice) => indice);
}

function calcularProgressoCategoria(categoria, acompanhamento) {
  const marcados = acompanhamento?.[categoria.id]?.marcados || {};

  // REGRA ESPECIAL DO PDV:
  // PDVONLINE OK e PDVOFFLINE (SEUPDV) são alternativas.
  // Para concluir 100%, é necessário:
  // 1) marcar PDVONLINE OU PDVOFFLINE;
  // 2) marcar "Simulações de Vendas Feitas";
  // 3) marcar "Abertura e Fechamento de Caixa".
  if (categoria.id === "PDV") {
    const total = 3;

    const pdvEscolhido =
      marcados[0] === true ||
      marcados[1] === true;

    const simulacoesFeitas =
      marcados[2] === true;

    const caixaConcluido =
      marcados[3] === true;

    const concluidos =
      (pdvEscolhido ? 1 : 0) +
      (simulacoesFeitas ? 1 : 0) +
      (caixaConcluido ? 1 : 0);

    const percentual =
      Math.round((concluidos / total) * 100);

    return {
      total,
      concluidos,
      percentual,
    };
  }

  const indicesValidos = indicesQueContamNoProgresso(categoria);
  const total = indicesValidos.length;
  const concluidos = indicesValidos.reduce(
    (soma, indice) => soma + (marcados[indice] === true ? 1 : 0),
    0
  );

  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return { total, concluidos, percentual };
}

function statusCategoria(categoria, acompanhamento) {
  const { total, concluidos } = calcularProgressoCategoria(categoria, acompanhamento);

  if (concluidos === 0) return "pendente";
  if (concluidos >= total) return "concluido";
  return "em-andamento";
}

function nomeStatus(status) {
  if (status === "concluido") return "Concluído";
  if (status === "em-andamento") return "Em andamento";
  return "Pendente";
}

function resumoStatusCliente(cliente) {
  const acompanhamento = acompanhamentoDoCliente(cliente);
  const resumo = {
    pendente: 0,
    "em-andamento": 0,
    concluido: 0,
  };

  CHECKLIST_ACOMPANHAMENTO.forEach((categoria) => {
    resumo[statusCategoria(categoria, acompanhamento)] += 1;
  });

  return resumo;
}

function atualizarResumoGeral() {
  const totais = {
    pendente: 0,
    "em-andamento": 0,
    concluido: 0,
  };

  clientes.forEach((cliente) => {
    const resumo = resumoStatusCliente(cliente);
    totais.pendente += resumo.pendente;
    totais["em-andamento"] += resumo["em-andamento"];
    totais.concluido += resumo.concluido;
  });

  if (totalAcompanhamentoPendente) {
    totalAcompanhamentoPendente.textContent = totais.pendente;
  }

  if (totalAcompanhamentoAndamento) {
    totalAcompanhamentoAndamento.textContent = totais["em-andamento"];
  }

  if (totalAcompanhamentoConcluido) {
    totalAcompanhamentoConcluido.textContent = totais.concluido;
  }

  if (alertaPendenciasAcompanhamento) {
    const abertas = totais.pendente + totais["em-andamento"];

    alertaPendenciasAcompanhamento.textContent =
      abertas === 0
        ? "✓ Sem pendências"
        : `⚠ ${abertas} ${abertas === 1 ? "pendência" : "pendências"}`;

    alertaPendenciasAcompanhamento.classList.toggle(
      "sem-pendencias",
      abertas === 0
    );
  }
}


function clientesPendentesDaCategoria(categoria) {
  return clientes
    .filter((cliente) => !cliente.arquivado)
    .map((cliente) => {
      const acompanhamento = acompanhamentoDoCliente(cliente);
      const progresso = calcularProgressoCategoria(categoria, acompanhamento);
      const status = statusCategoria(categoria, acompanhamento);

      return {
        cliente,
        status,
        ...progresso,
      };
    })
    .filter((item) => item.status !== "concluido")
    .sort((a, b) => {
      const ordem = { pendente: 0, "em-andamento": 1 };
      const diferencaStatus = ordem[a.status] - ordem[b.status];

      if (diferencaStatus !== 0) return diferencaStatus;

      return String(
        a.cliente.nomeFantasia || a.cliente.razaoSocial || ""
      ).localeCompare(
        String(b.cliente.nomeFantasia || b.cliente.razaoSocial || ""),
        "pt-BR"
      );
    });
}

function renderizarDashboardPendencias() {
  if (!cardsDashboardPendencias) return;

  const clientesComAlgumaPendencia = new Set();

  const cards = CHECKLIST_ACOMPANHAMENTO.map((categoria) => {
    const pendentes = clientesPendentesDaCategoria(categoria);
    const totalmentePendentes = pendentes.filter(
      (item) => item.status === "pendente"
    ).length;
    const emAndamento = pendentes.filter(
      (item) => item.status === "em-andamento"
    ).length;

    pendentes.forEach((item) => clientesComAlgumaPendencia.add(item.cliente.id));

    return `
      <button
        class="dashboard-categoria-card ${pendentes.length === 0 ? "sem-pendencias" : ""}"
        type="button"
        data-dashboard-categoria="${categoria.id}"
      >
        <div class="dashboard-categoria-topo">
          <h3>${escaparHTML(categoria.nome)}</h3>
          <span class="dashboard-categoria-total">${pendentes.length}</span>
        </div>

        <p>
          ${
            pendentes.length === 0
              ? "Todos os clientes concluíram esta categoria."
              : `${pendentes.length} ${
                  pendentes.length === 1 ? "cliente ainda precisa" : "clientes ainda precisam"
                } concluir.`
          }
        </p>

        <div class="dashboard-categoria-status">
          <span class="dashboard-mini-status pendente">
            ${totalmentePendentes} pendente${totalmentePendentes === 1 ? "" : "s"}
          </span>
          <span class="dashboard-mini-status andamento">
            ${emAndamento} em andamento
          </span>
        </div>
      </button>
    `;
  });

  cardsDashboardPendencias.innerHTML = cards.join("");

  if (totalClientesComPendencias) {
    const total = clientesComAlgumaPendencia.size;
    totalClientesComPendencias.textContent =
      total === 0
        ? "✓ Nenhum cliente com pendências"
        : `${total} ${total === 1 ? "cliente com pendência" : "clientes com pendências"}`;

    totalClientesComPendencias.classList.toggle("sem-pendencias", total === 0);
  }

  const categoriaAberta = listaDashboardPendencias?.dataset.categoria;

  if (categoriaAberta && !listaDashboardPendencias.classList.contains("hidden")) {
    abrirListaDashboardPendencias(categoriaAberta, false);
  }
}

function abrirListaDashboardPendencias(categoriaId, rolar = true) {
  if (
    !listaDashboardPendencias ||
    !clientesDashboardPendencias ||
    !tituloListaDashboardPendencias
  ) {
    return;
  }

  const categoria = CHECKLIST_ACOMPANHAMENTO.find(
    (item) => item.id === categoriaId
  );

  if (!categoria) return;

  const pendentes = clientesPendentesDaCategoria(categoria);

  listaDashboardPendencias.dataset.categoria = categoria.id;
  listaDashboardPendencias.classList.remove("hidden");

  tituloListaDashboardPendencias.textContent = categoria.nome;

  if (subtituloListaDashboardPendencias) {
    subtituloListaDashboardPendencias.textContent =
      pendentes.length === 0
        ? "Nenhum cliente está pendente nesta categoria."
        : `${pendentes.length} ${
            pendentes.length === 1
              ? "cliente ainda não concluiu"
              : "clientes ainda não concluíram"
          } esta categoria.`;
  }

  clientesDashboardPendencias.innerHTML =
    pendentes.length === 0
      ? `
          <div class="dashboard-vazio">
            <strong>✓ Tudo concluído nesta categoria.</strong>
            <p>Não há clientes faltando neste momento.</p>
          </div>
        `
      : pendentes
          .map(({ cliente, status, concluidos, total, percentual }) => `
            <article
              class="dashboard-cliente-item"
              data-status="${status}"
            >
              <div class="dashboard-cliente-info">
                <strong>
                  ${escaparHTML(
                    cliente.nomeFantasia ||
                    cliente.razaoSocial ||
                    cliente.id
                  )}
                </strong>
                <small>
                  ${
                    cliente.razaoSocial &&
                    cliente.razaoSocial !== cliente.nomeFantasia
                      ? escaparHTML(cliente.razaoSocial)
                      : "Cliente cadastrado"
                  }
                </small>
              </div>

              <div class="dashboard-cliente-progresso">
                <strong>${nomeStatus(status)}</strong>
                <small>
                  ${concluidos} de ${total} concluídos · ${percentual}%
                </small>
              </div>
            </article>
          `)
          .join("");

  if (rolar) {
    listaDashboardPendencias.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}

cardsDashboardPendencias?.addEventListener("click", (evento) => {
  const card = evento.target.closest("[data-dashboard-categoria]");

  if (!card) return;

  abrirListaDashboardPendencias(card.dataset.dashboardCategoria);
});

fecharListaDashboardPendencias?.addEventListener("click", () => {
  if (!listaDashboardPendencias) return;

  listaDashboardPendencias.classList.add("hidden");
  listaDashboardPendencias.removeAttribute("data-categoria");
});



/* ========================================= */
/* AGENDA DE HOJE - TREINAMENTO / IMPORTAÇÃO */
/* ========================================= */

function dataLocalISOHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


function formatarDataAgenda(dataISO) {
  if (!dataISO) return "";

  const [ano, mes, dia] = dataISO.split("-");

  if (!ano || !mes || !dia) return dataISO;

  return `${dia}/${mes}/${ano}`;
}


function itensAgendaHoje() {
  const hoje = dataLocalISOHoje();
  const categoriasAgenda = ["treinamento", "importacao"];
  const itens = [];

  clientes
    .filter((cliente) => !cliente.arquivado)
    .forEach((cliente) => {
      const acompanhamento = acompanhamentoDoCliente(cliente);

      categoriasAgenda.forEach((categoriaId) => {
        const categoria = CHECKLIST_ACOMPANHAMENTO.find(
          (item) => item.id === categoriaId
        );

        if (!categoria) return;

        const dadosCategoria =
          acompanhamento[categoriaId] || {};

        if (dadosCategoria.dataAgendada !== hoje) {
          return;
        }

        const progresso =
          calcularProgressoCategoria(
            categoria,
            acompanhamento
          );

        const status =
          statusCategoria(
            categoria,
            acompanhamento
          );

        itens.push({
          cliente,
          categoria,
          hora:
            dadosCategoria.horaAgendada || "",
          status,
          percentual:
            progresso.percentual,
        });
      });
    });

  return itens.sort((a, b) => {
    const horaA = a.hora || "99:99";
    const horaB = b.hora || "99:99";

    if (horaA !== horaB) {
      return horaA.localeCompare(horaB);
    }

    return String(
      a.cliente.nomeFantasia ||
      a.cliente.razaoSocial ||
      ""
    ).localeCompare(
      String(
        b.cliente.nomeFantasia ||
        b.cliente.razaoSocial ||
        ""
      ),
      "pt-BR"
    );
  });
}


function criarMiniDashboardAgendaHoje() {
  return agendaHojeTopbar;
}


function renderizarMiniDashboardAgendaHoje() {

  const container =
    criarMiniDashboardAgendaHoje();

  if (!container) return;

  const itens =
    itensAgendaHoje();

  const hoje =
    dataLocalISOHoje();

  const treinamentos =
    itens.filter(
      (item) =>
        item.categoria.id ===
        "treinamento"
    );

  const importacoes =
    itens.filter(
      (item) =>
        item.categoria.id ===
        "importacao"
    );

  const resumoTopo = `
    <div class="agenda-topbar-cabecalho">
      <div>
        <span class="agenda-topbar-titulo">
          📅 Agenda de hoje
        </span>

        <small>
          ${escaparHTML(
            formatarDataAgenda(hoje)
          )}
        </small>
      </div>

      <div class="agenda-topbar-contadores">
        <span class="agenda-topbar-contador treinamento">
          Treinamento ${treinamentos.length}
        </span>

        <span class="agenda-topbar-contador importacao">
          Importação ${importacoes.length}
        </span>
      </div>
    </div>
  `;

  if (itens.length === 0) {

    container.innerHTML = `
      ${resumoTopo}

      <div class="agenda-topbar-vazio">
        ✓ Nenhum treinamento ou importação para hoje
      </div>
    `;

    return;
  }

  container.innerHTML = `
    ${resumoTopo}

    <div class="agenda-topbar-lista">
      ${itens
        .map(
          ({
            cliente,
            categoria,
            hora,
            status,
          }) => `
            <div
              class="agenda-topbar-item"
              data-tipo="${categoria.id}"
            >
              <span class="agenda-topbar-item-icone">
                ${
                  categoria.id ===
                  "treinamento"
                    ? "🎓"
                    : "📦"
                }
              </span>

              <div class="agenda-topbar-item-texto">
                <strong>
                  ${escaparHTML(
                    cliente.nomeFantasia ||
                    cliente.razaoSocial ||
                    cliente.id
                  )}
                </strong>

                <small>
                  ${escaparHTML(
                    categoria.nome
                  )}
                  ${
                    hora
                      ? ` · ${escaparHTML(hora)}`
                      : " · sem horário"
                  }
                </small>
              </div>

              <span
                class="agenda-topbar-status status-${status}"
              >
                ${escaparHTML(
                  nomeStatus(status)
                )}
              </span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}


async function salvarAgendamento(
  categoriaId,
  campo,
  valor
) {
  const cliente =
    clientes.find(
      (item) =>
        item.id ===
        clienteAcompanhamento?.value
    );

  if (!cliente) return;

  if (
    ![
      "treinamento",
      "importacao",
    ].includes(categoriaId)
  ) {
    return;
  }

  const acompanhamento =
    acompanhamentoDoCliente(cliente);

  if (
    !acompanhamento[categoriaId]
  ) {
    return;
  }

  if (campo === "data") {
    acompanhamento[categoriaId]
      .dataAgendada = valor || "";
  }

  if (campo === "hora") {
    acompanhamento[categoriaId]
      .horaAgendada = valor || "";
  }

  try {
    await setDoc(
      doc(
        db,
        "clientes",
        cliente.id
      ),
      {
        acompanhamento,
        acompanhamentoAtualizadoEm:
          serverTimestamp(),
        acompanhamentoAtualizadoPor:
          usuarioAtualEmail,
      },
      {
        merge: true,
      }
    );

    mostrarToastAcompanhamento(
      valor
        ? "Agendamento salvo."
        : "Agendamento removido."
    );

    renderizarMiniDashboardAgendaHoje();
  } catch (erro) {
    console.error(
      "Erro ao salvar agendamento:",
      erro
    );

    mostrarToastAcompanhamento(
      "Não foi possível salvar o agendamento.",
      true
    );

    renderizarAcompanhamento();
  }
}


function preencherSelectClientes() {

  if (!clienteAcompanhamento) return;

  const atual = clienteAcompanhamento.value;

  const ordenados = clientes
    .filter((cliente) => !cliente.arquivado)
    .sort((a, b) =>
      String(a.nomeFantasia || a.razaoSocial || "").localeCompare(
        String(b.nomeFantasia || b.razaoSocial || ""),
        "pt-BR"
      )
    );

  clienteAcompanhamento.innerHTML = `
    <option value="">Selecione um cliente</option>
    ${ordenados
      .map(
        (cliente) => `
          <option value="${escaparHTML(cliente.id)}">
            ${escaparHTML(
              cliente.nomeFantasia || cliente.razaoSocial || cliente.id
            )}
          </option>
        `
      )
      .join("")}
  `;

  if (ordenados.some((cliente) => cliente.id === atual)) {
    clienteAcompanhamento.value = atual;
  }
}

// Mantém os checklists abertos mesmo quando o Firebase atualiza os dados.
const checklistsAbertos = new Set();

function renderizarAcompanhamento() {
  if (!listaAcompanhamento || !clienteAcompanhamento) return;

  atualizarResumoGeral();
  renderizarDashboardPendencias();
  preencherSelectClientes();

  const cliente = clientes.find(
    (item) => item.id === clienteAcompanhamento.value
  );

  if (!cliente) {
    resumoClienteAcompanhamento?.classList.add("hidden");

    listaAcompanhamento.innerHTML = `
      <div class="empty-state">
        <strong>Selecione um cliente.</strong>
        <p>O checklist de implantação e serviços aparecerá aqui.</p>
      </div>
    `;
    return;
  }

  const acompanhamento = acompanhamentoDoCliente(cliente);
  const resumo = resumoStatusCliente(cliente);
  const filtro = filtroStatusAcompanhamento?.value || "todos";
  const abertas = resumo.pendente + resumo["em-andamento"];

  if (resumoClienteAcompanhamento) {
    resumoClienteAcompanhamento.classList.remove("hidden");
    resumoClienteAcompanhamento.innerHTML = `
      <strong>${escaparHTML(
        cliente.nomeFantasia || cliente.razaoSocial || "Cliente"
      )}</strong>
      <span>
        ${
          abertas === 0
            ? "Todas as categorias do acompanhamento estão concluídas."
            : `${abertas} ${
                abertas === 1
                  ? "categoria ainda precisa"
                  : "categorias ainda precisam"
              } de atenção.`
        }
      </span>
    `;
  }

  const categorias = CHECKLIST_ACOMPANHAMENTO.map((categoria) => {
    const marcados = acompanhamento[categoria.id].marcados;
    const { concluidos, total, percentual } = calcularProgressoCategoria(
      categoria,
      acompanhamento
    );
    const status = statusCategoria(categoria, acompanhamento);

    return {
      categoria,
      marcados,
      concluidos,
      total,
      percentual,
      status,
    };
  }).filter((item) => filtro === "todos" || item.status === filtro);

  listaAcompanhamento.innerHTML = categorias.length
    ? categorias
        .map(
          ({ categoria, marcados, concluidos, total, percentual, status }) => `
            <article
              class="acompanhamento-categoria"
              data-categoria="${categoria.id}"
              data-status="${status}"
            >
              <div class="acompanhamento-categoria-topo">
                <div class="acompanhamento-categoria-titulo">
                  <strong>${escaparHTML(categoria.nome)}</strong>
                  <small>
                    ${concluidos} de ${total} itens concluídos · ${percentual}%
                  </small>

                  <div
                    class="acompanhamento-progresso"
                    aria-label="${percentual}% concluído"
                  >
                    <span style="width:${percentual}%"></span>
                  </div>
                </div>

                <div class="acompanhamento-categoria-acoes">
                  <span class="acompanhamento-status status-${status}">
                    ${nomeStatus(status)}
                  </span>

                  <button
                    class="btn btn-secondary btn-checklist"
                    type="button"
                    data-acao="alternar-checklist"
                  >
                    ${checklistsAbertos.has(categoria.id) ? "Ocultar checklist" : "Ver checklist"}
                  </button>
                </div>
              </div>

              <div class="acompanhamento-checklist ${checklistsAbertos.has(categoria.id) ? "" : "hidden"}">

                ${
                  (
                    categoria.id === "treinamento" ||
                    categoria.id === "importacao"
                  )
                    ? `
                      <div class="acompanhamento-agendamento">
                        <div class="acompanhamento-agendamento-campo">
                          <label>
                            Data agendada
                          </label>

                          <input
                            type="date"
                            data-acao="agendar-data"
                            value="${escaparHTML(
                              acompanhamento[categoria.id]?.dataAgendada || ""
                            )}"
                          />
                        </div>

                        <div class="acompanhamento-agendamento-campo">
                          <label>
                            Horário
                          </label>

                          <input
                            type="time"
                            data-acao="agendar-hora"
                            value="${escaparHTML(
                              acompanhamento[categoria.id]?.horaAgendada || ""
                            )}"
                          />
                        </div>
                      </div>
                    `
                    : ""
                }
                ${categoria.itens
                  .map(
                    (item, indice) => `
                      <label class="acompanhamento-check-item" ${(indice === 0 && (categoria.id === "certificado-digital" || categoria.id === "notas-fiscais")) ? 'style="color:#dc2626;font-weight:800;text-transform:uppercase;"' : ""}>
                        <input
                          type="checkbox"
                          data-acao="marcar-item"
                          data-indice="${indice}"
                          ${marcados[indice] === true ? "checked" : ""}
                        />
                        <span>${escaparHTML(item)}</span>
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </article>
          `
        )
        .join("")
    : `
        <div class="empty-state">
          <strong>Nenhuma categoria neste filtro.</strong>
          <p>Altere o filtro para visualizar outros status.</p>
        </div>
      `;
}

async function salvarItem(categoriaId, indice, marcado) {
  const cliente = clientes.find(
    (item) => item.id === clienteAcompanhamento?.value
  );

  if (!cliente) return;

  const acompanhamento = acompanhamentoDoCliente(cliente);

  if (!acompanhamento[categoriaId]) return;

  acompanhamento[categoriaId].marcados[indice] = marcado === true;

  // Em Notas fiscais, ao marcar "Por enquanto não irá emitir Nota",
  // todos os demais itens da categoria são concluídos automaticamente.
  if (categoriaId === "notas-fiscais" && indice === 0 && marcado === true) {
    const categoriaNotas = CHECKLIST_ACOMPANHAMENTO.find(
      (categoria) => categoria.id === "notas-fiscais"
    );

    categoriaNotas?.itens.forEach((_item, itemIndice) => {
      acompanhamento[categoriaId].marcados[itemIndice] = true;
    });
  }

  // Em Certificado digital, ao marcar "POR ENQUANTO NÃO TEM CERTIFICADO DIGITAL",
  // todos os demais itens da categoria são concluídos automaticamente.
  if (categoriaId === "certificado-digital" && indice === 0 && marcado === true) {
    const categoriaCertificado = CHECKLIST_ACOMPANHAMENTO.find(
      (categoria) => categoria.id === "certificado-digital"
    );

    categoriaCertificado?.itens.forEach((_item, itemIndice) => {
      acompanhamento[categoriaId].marcados[itemIndice] = true;
    });
  }

  try {
    await setDoc(
      doc(db, "clientes", cliente.id),
      {
        acompanhamento,
        acompanhamentoAtualizadoEm: serverTimestamp(),
        acompanhamentoAtualizadoPor: usuarioAtualEmail,
      },
      { merge: true }
    );

    if (categoriaId === "notas-fiscais" && indice === 0 && marcado === true) {
      mostrarToastAcompanhamento(
        "Nota não será emitida por enquanto. Checklist de Notas fiscais concluído automaticamente."
      );
    } else if (categoriaId === "certificado-digital" && indice === 0 && marcado === true) {
      mostrarToastAcompanhamento(
        "Cliente sem certificado digital por enquanto. Checklist de Certificado digital concluído automaticamente."
      );
    } else {
      mostrarToastAcompanhamento(
        marcado
          ? "Item marcado como concluído."
          : "Item voltou para pendente."
      );
    }
  } catch (erro) {
    console.error("Erro ao salvar acompanhamento:", erro);
    mostrarToastAcompanhamento(
      "Não foi possível salvar o acompanhamento.",
      true
    );
    renderizarAcompanhamento();
  }
}

clienteAcompanhamento?.addEventListener("change", () => {
  checklistsAbertos.clear();
  renderizarAcompanhamento();
});

filtroStatusAcompanhamento?.addEventListener(
  "change",
  renderizarAcompanhamento
);

listaAcompanhamento?.addEventListener("click", (evento) => {
  const botao = evento.target.closest(
    '[data-acao="alternar-checklist"]'
  );

  if (!botao) return;

  const card = botao.closest(".acompanhamento-categoria");
  const checklist = card?.querySelector(".acompanhamento-checklist");

  if (!checklist) return;

  checklist.classList.toggle("hidden");

  const categoriaId = card?.dataset.categoria;
  const estaFechado = checklist.classList.contains("hidden");

  if (categoriaId) {
    if (estaFechado) {
      checklistsAbertos.delete(categoriaId);
    } else {
      checklistsAbertos.add(categoriaId);
    }
  }

  botao.textContent = estaFechado
    ? "Ver checklist"
    : "Ocultar checklist";
});


/* ========================================= */
/* SALVAR DATA/HORA SOMENTE APÓS FINALIZAR */
/* ========================================= */

listaAcompanhamento?.addEventListener(
  "focusout",
  async (evento) => {

    const campoData =
      evento.target.closest(
        '[data-acao="agendar-data"]'
      );

    const campoHora =
      evento.target.closest(
        '[data-acao="agendar-hora"]'
      );

    if (
      !campoData &&
      !campoHora
    ) {
      return;
    }

    const card =
      evento.target.closest(
        ".acompanhamento-categoria"
      );

    const categoriaId =
      card?.dataset.categoria;

    if (!categoriaId) return;

    const valor =
      evento.target.value.trim();

    if (campoData) {

      /* Só salva quando a data estiver completa:
         YYYY-MM-DD. Se estiver vazia, remove o agendamento. */
      if (
        valor !== "" &&
        !/^\d{4}-\d{2}-\d{2}$/.test(valor)
      ) {
        return;
      }

      if (valor !== "") {
        const ano =
          Number(
            valor.slice(0, 4)
          );

        if (
          ano < 2000 ||
          ano > 2100
        ) {
          mostrarToastAcompanhamento(
            "Informe um ano válido com 4 dígitos.",
            true
          );

          campoData.focus();
          return;
        }
      }
    }

    if (campoHora) {

      /* Só salva horário completo HH:MM. */
      if (
        valor !== "" &&
        !/^\d{2}:\d{2}$/.test(valor)
      ) {
        return;
      }
    }

    evento.target.disabled =
      true;

    await salvarAgendamento(
      categoriaId,
      campoData
        ? "data"
        : "hora",
      valor
    );

    evento.target.disabled =
      false;
  }
);


listaAcompanhamento?.addEventListener("change", async (evento) => {

  const checkbox = evento.target.closest('[data-acao="marcar-item"]');

  if (!checkbox) return;

  const card = checkbox.closest(".acompanhamento-categoria");
  const categoriaId = card?.dataset.categoria;
  const indice = Number(checkbox.dataset.indice);

  if (!categoriaId || !Number.isInteger(indice)) return;

  checkbox.disabled = true;
  await salvarItem(categoriaId, indice, checkbox.checked);
  checkbox.disabled = false;
});

function iniciarEscutaClientes() {
  if (cancelarEscutaClientes) {
    cancelarEscutaClientes();
  }

  cancelarEscutaClientes = onSnapshot(
    clientesRef,
    (snapshot) => {
      clientes = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      renderizarAcompanhamento();

      renderizarMiniDashboardAgendaHoje();
    },
    (erro) => {
      console.error("Erro ao carregar acompanhamento:", erro);
    }
  );
}

onAuthStateChanged(auth, (usuario) => {
  if (cancelarEscutaClientes) {
    cancelarEscutaClientes();
    cancelarEscutaClientes = null;
  }

  clientes = [];
  usuarioAtualEmail = usuario?.email || "";

  if (!usuario) {
    renderizarAcompanhamento();
    return;
  }

  iniciarEscutaClientes();
});
