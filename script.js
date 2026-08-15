import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


/* ========================================= */
/* FIREBASE */
/* ========================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const registrosRef = collection(db, "registrosClientes");

const clientesRef = collection(db, "clientes");
const EMAIL_ADMIN_CLIENTES = "samuelleonardo2011@hotmail.com";


/* ========================================= */
/* AUXILIAR */
/* ========================================= */

const $ = (id) => document.getElementById(id);


/* ========================================= */
/* LOGIN */
/* ========================================= */

const telaLogin = $("telaLogin");

const aplicacao = $("aplicacao");

const formLogin = $("formLogin");

const formCadastro = $("formCadastro");

const telaPendente = $("telaPendente");

const emailLogin = $("emailLogin");

const senhaLogin = $("senhaLogin");

const erroLogin = $("erroLogin");

const nomeCadastro = $("nomeCadastro");

const emailCadastro = $("emailCadastro");

const senhaCadastro = $("senhaCadastro");

const confirmarSenhaCadastro = $("confirmarSenhaCadastro");

const erroCadastro = $("erroCadastro");

const abrirCadastro = $("abrirCadastro");

const voltarLogin = $("voltarLogin");

const sairPendente = $("sairPendente");

const emailPendente = $("emailPendente");

const btnSair = $("btnSair");

const saudacaoUsuario = $("saudacaoUsuario");

const statusNuvem = $("statusNuvem");


/* ========================================= */
/* APROVAÇÕES */
/* ========================================= */

const painelAprovacoes = $("painelAprovacoes");

const listaAprovacoes = $("listaAprovacoes");


/* ========================================= */
/* CLIENTES */
/* ========================================= */

const formCliente = $("formCliente");

const cnpjCliente = $("cnpjCliente");

const razaoSocialCliente = $("razaoSocialCliente");

const nomeFantasiaCliente = $("nomeFantasiaCliente");

const limparCliente = $("limparCliente");

const listaClientesCadastrados = $("listaClientesCadastrados");

const contadorClientes = $("contadorClientes");
const listaClientesArquivados = $("listaClientesArquivados");
const contadorClientesArquivados = $("contadorClientesArquivados");


/* ========================================= */
/* ATENDIMENTO */
/* ========================================= */

const form = $("formRegistro");

const registroId = $("registroId");

const clienteAtendimento = $("clienteAtendimento");

const cnpjAtendimento = $("cnpjAtendimento");

const numeroLogin = $("numeroLogin");

const nomeCliente = $("nomeCliente");

const nomeFantasia = $("nomeFantasia");

const categoriaAtendimento = $("categoriaAtendimento");

/* NOVO CAMPO */

const situacao = $("situacao");

const comentarios = $("comentarios");


/* ========================================= */
/* REGISTRO DO ATENDIMENTO EM MAIÚSCULAS */
/* ========================================= */

comentarios.addEventListener(
  "blur",
  () => {
    comentarios.value =
      comentarios.value.toUpperCase();
  }
);


/* Nome da pessoa atendida: primeira letra de cada nome em maiúscula */
nomeCliente.addEventListener(
  "blur",
  () => {
    nomeCliente.value =
      formatarNomePessoa(nomeCliente.value);
  }
);

/* Razão social: sempre em maiúsculas */
razaoSocialCliente.addEventListener(
  "blur",
  () => {
    razaoSocialCliente.value =
      formatarMaiusculo(razaoSocialCliente.value);
  }
);

/* Nome fantasia: sempre em maiúsculas */
nomeFantasiaCliente.addEventListener(
  "blur",
  () => {
    nomeFantasiaCliente.value =
      formatarMaiusculo(nomeFantasiaCliente.value);
  }
);


/* ========================================= */
/* LISTAGEM */
/* ========================================= */

const campoBusca = $("campoBusca");

const listaRegistros = $("listaRegistros");

const contadorRegistros = $("contadorRegistros");


/* ========================================= */
/* HISTÓRICO */
/* ========================================= */

const campoHistorico = $("campoHistorico");

const btnVerHistorico = $("btnVerHistorico");

const sugestoesHistorico = $("sugestoesHistorico");

const telaHistorico = $("telaHistorico");

const fecharHistorico = $("fecharHistorico");

const historicoTitulo = $("historicoTitulo");

const historicoResumo = $("historicoResumo");

const historicoClienteDados = $("historicoClienteDados");

const historicoLista = $("historicoLista");


/* ========================================= */
/* FORMULÁRIO */
/* ========================================= */

const tituloFormulario = $("tituloFormulario");

const btnNovo = $("btnNovo");

const btnCancelar = $("btnCancelar");


/* ========================================= */
/* MODAL */
/* ========================================= */

const modal = $("modal");

const modalTitulo = $("modalTitulo");

const modalConteudo = $("modalConteudo");

const fecharModal = $("fecharModal");

const editarModal = $("editarModal");

const excluirModal = $("excluirModal");

const toast = $("toast");


/* ========================================= */
/* VARIÁVEIS */
/* ========================================= */

let registros = [];

let clientes = [];
let clienteEditandoId = null;

let registroSelecionadoId = null;

let clienteHistoricoSelecionado = null;

let cancelarEscuta = null;

let cancelarEscutaClientes = null;

let cancelarAprovacoes = null;

let usuarioAtualEhAdmin = false;

let usuarioAtualNome = "";

let usuarioAtualEmail = "";

let usuarioAtualUid = "";


/* ========================================= */
/* ESCAPAR HTML */
/* ========================================= */

function podeGerenciarClientes() {
  return (
    String(usuarioAtualEmail || "")
      .trim()
      .toLowerCase() ===
    EMAIL_ADMIN_CLIENTES
  );
}


const escaparHTML = (valor) =>
  String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


/* ========================================= */
/* NORMALIZAÇÃO */
/* ========================================= */

const normalizar = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();


const somenteNumeros = (valor = "") =>
  String(valor).replace(/\D/g, "");


/* ========================================= */
/* FORMATAÇÃO DE TEXTOS */
/* ========================================= */

const formatarNomePessoa = (valor = "") =>
  String(valor)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|\s|[-'])\p{L}/gu, (trecho) => trecho.toUpperCase());

const formatarMaiusculo = (valor = "") =>
  String(valor)
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");


/* ========================================= */
/* CNPJ */
/* ========================================= */

const formatarCNPJ = (valor = "") => {

  const numeros = somenteNumeros(valor).slice(0, 14);

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");

};


const validarCNPJBasico = (valor) =>
  somenteNumeros(valor).length === 14;


/* ========================================= */
/* DATA */
/* ========================================= */

const dataISO = (valor) =>
  !valor
    ? new Date().toISOString()
    : typeof valor.toDate === "function"
      ? valor.toDate().toISOString()
      : valor;


const formatarData = (valor) =>
  new Intl.DateTimeFormat("pt-BR", {

    dateStyle: "short",

    timeStyle: "short",

  }).format(new Date(dataISO(valor)));


/* ========================================= */
/* SITUAÇÃO */
/* ========================================= */

function nomeSituacao(valor) {

  const situacoes = {

    "em-andamento": "Em andamento",

    pendente: "Pendente",

    concluido: "Concluído",

  };

  return situacoes[valor] || "Não informada";

}


function classeSituacao(valor) {

  const classes = {

    "em-andamento": "status-em-andamento",

    pendente: "status-pendente",

    concluido: "status-concluido",

  };

  return classes[valor] || "";

}


function criarBadgeSituacao(valor) {

  if (!valor) {

    return `
      <span class="status-badge">
        Situação não informada
      </span>
    `;

  }

  return `
    <span class="status-badge ${classeSituacao(valor)}">
      ${escaparHTML(nomeSituacao(valor))}
    </span>
  `;

}


/* ========================================= */
/* TOAST */
/* ========================================= */

function mostrarToast(mensagem, erro = false) {

  toast.textContent = mensagem;

  toast.style.background =
    erro ? "#b42318" : "#168347";

  toast.classList.add("show");

  setTimeout(() => {

    toast.classList.remove("show");

  }, 2800);

}


/* ========================================= */
/* SAUDAÇÃO DO USUÁRIO */
/* ========================================= */

function atualizarSaudacaoUsuario() {

  if (!saudacaoUsuario) return;

  if (!usuarioAtualNome) {
    saudacaoUsuario.textContent = "";
    return;
  }

  const hora = new Date().getHours();

  let periodo;

  if (hora <= 12) {
    periodo = "Bom dia";
  } else if (hora <= 17) {
    periodo = "Boa tarde";
  } else {
    periodo = "Boa noite";
  }

  saudacaoUsuario.textContent =
    `Olá, ${periodo}, ${usuarioAtualNome}`;

}

setInterval(
  atualizarSaudacaoUsuario,
  60 * 1000
);


/* ========================================= */
/* TELAS LOGIN */
/* ========================================= */

function mostrarAuth(alvo) {

  [
    formLogin,
    formCadastro,
    telaPendente
  ].forEach((elemento) => {

    elemento.classList.add("hidden");

  });

  alvo.classList.remove("hidden");

}


/* ========================================= */
/* PERMISSÕES */
/* ========================================= */

function configurarPermissoesVisuais() {

  editarModal.classList.toggle(
    "hidden",
    !usuarioAtualEhAdmin
  );

  excluirModal.classList.toggle(
    "hidden",
    !usuarioAtualEhAdmin
  );

  // Solicitações de acesso aparecem somente na tela inicial
  // e somente para o administrador.
  const menuPrincipal =
    document.getElementById("menuPrincipalSistema");

  const estaNaTelaInicial =
    menuPrincipal &&
    !menuPrincipal.classList.contains("hidden");

  painelAprovacoes.classList.toggle(
    "hidden",
    !usuarioAtualEhAdmin || !estaNaTelaInicial
  );

}


/* ========================================= */
/* BUSCAR CLIENTE */
/* ========================================= */

function obterClientePorCnpj(cnpj) {

  const cnpjLimpo =
    somenteNumeros(cnpj);

  return clientes.find(
    (cliente) =>
      somenteNumeros(
        cliente.cnpj || cliente.id
      ) === cnpjLimpo
  );

}


/* ========================================= */
/* SELECT CLIENTES */
/* ========================================= */

function preencherSelectClientes() {

  const clientesAtivosSelect = clientes.filter((cliente) => !cliente.arquivado);


  const valorAtual =
    clienteAtendimento.value;

  clienteAtendimento.innerHTML = `
    <option value="">
      Selecione o cliente
    </option>

    ${clientesAtivosSelect
      .map(
        (cliente) => `
          <option value="${escaparHTML(
            cliente.cnpj || cliente.id
          )}">
            
            ${escaparHTML(
              cliente.nomeFantasia
            )}

            —

            ${escaparHTML(
              cliente.cnpjFormatado ||
              formatarCNPJ(
                cliente.cnpj || cliente.id
              )
            )}

          </option>
        `
      )
      .join("")}
  `;

  if (
    valorAtual &&
    obterClientePorCnpj(valorAtual)
  ) {

    clienteAtendimento.value =
      valorAtual;

  }

}


/* ========================================= */
/* PREENCHER CLIENTE */
/* ========================================= */

function preencherClienteNoAtendimento(cnpj) {

  const cliente =
    obterClientePorCnpj(cnpj);

  if (!cliente) {

    cnpjAtendimento.value = "";

    nomeFantasia.value = "";

    numeroLogin.value = "";

    return;

  }

  cnpjAtendimento.value =
    cliente.cnpjFormatado ||
    formatarCNPJ(
      cliente.cnpj || cliente.id
    );

  nomeFantasia.value =
    cliente.nomeFantasia || "";

  // Preenche automaticamente "Número ou login do cliente"
  // com o mesmo Nome Fantasia do cliente selecionado.
  numeroLogin.value =
    cliente.nomeFantasia || "";

}


/* ========================================= */
/* REGISTROS */
/* ========================================= */

function renderizarRegistros() {

  const termo =
    normalizar(
      campoBusca.value.trim()
    );

  const filtrados =
    registros.filter((registro) => {

      const texto = normalizar(`
        ${registro.numeroLogin || ""}
        ${registro.nomeCliente || ""}
        ${registro.nomeFantasia || ""}
        ${registro.cnpjCliente || ""}
        ${registro.categoriaAtendimento || ""}
        ${registro.situacao || ""}
        ${nomeSituacao(registro.situacao)}
        ${registro.comentarios || ""}
        ${registro.atendenteNome || ""}
        ${registro.atendenteEmail || registro.criadoPor || ""}
      `);

      return texto.includes(termo);

    });


  contadorRegistros.textContent =
    `${registros.length} ${
      registros.length === 1
        ? "registro"
        : "registros"
    }`;


  listaRegistros.innerHTML =
    filtrados.length

      ? filtrados
          .map(
            (registro) => `

              <button
                class="record-card"
                type="button"
                data-id="${registro.id}"
              >

                <strong>
                  ${escaparHTML(
                    registro.nomeFantasia ||
                    registro.nomeCliente
                  )}
                </strong>

                <span>
                  ${escaparHTML(
                    registro.nomeCliente
                  )}
                  ·
                  ${escaparHTML(
                    registro.numeroLogin
                  )}
                </span>


                <small class="category-badge">
                  ${escaparHTML(
                    registro.categoriaAtendimento ||
                    "Sem categoria"
                  )}
                </small>


                ${criarBadgeSituacao(
                  registro.situacao
                )}


                <small>
                  Atendente:
                  ${escaparHTML(
                    registro.atendenteNome ||
                    registro.atendenteEmail ||
                    registro.criadoPor ||
                    "Não identificado"
                  )}
                </small>


                <small>
                  Atualizado em
                  ${formatarData(
                    registro.atualizadoEm ||
                    registro.criadoEm
                  )}
                </small>

              </button>

            `
          )
          .join("")

      : `
          <div class="empty-state">

            <strong>
              Nenhum registro encontrado.
            </strong>

            <p>
              Cadastre um atendimento ou altere a busca.
            </p>

          </div>
        `;

}


/* ========================================= */
/* CLIENTES */
/* ========================================= */

function renderizarClientes() {

  const clientesAtivos =
    clientes.filter(
      (cliente) => !cliente.arquivado
    );

  const clientesArquivados =
    clientes.filter(
      (cliente) => cliente.arquivado
    );

  contadorClientes.textContent =
    `${clientesAtivos.length} ${
      clientesAtivos.length === 1
        ? "cliente"
        : "clientes"
    }`;

  listaClientesCadastrados.innerHTML =
    clientesAtivos.length
      ? clientesAtivos
          .map(
            (cliente) => `

              <article class="cliente-card" data-cliente-id="${cliente.id}">

                <strong>
                  ${escaparHTML(
                    cliente.nomeFantasia
                  )}
                </strong>

                <span>
                  ${escaparHTML(
                    cliente.razaoSocial
                  )}
                </span>

                <small>
                  CNPJ:
                  ${escaparHTML(
                    cliente.cnpjFormatado ||
                    formatarCNPJ(
                      cliente.cnpj ||
                      cliente.id
                    )
                  )}
                </small>

                ${
                  podeGerenciarClientes()
                    ? `
                      <div class="cliente-card-actions">
                        <button
                          class="btn btn-secondary btn-editar-cliente"
                          type="button"
                          data-cliente-id="${cliente.id}"
                        >
                          Editar
                        </button>

                        <button
                          class="btn btn-archive btn-arquivar-cliente"
                          type="button"
                          data-cliente-id="${cliente.id}"
                        >
                          Arquivar
                        </button>

                        <button
                          class="btn btn-danger btn-excluir-cliente"
                          type="button"
                          data-cliente-id="${cliente.id}"
                        >
                          Excluir
                        </button>
                      </div>
                    `
                    : ""
                }

              </article>

            `
          )
          .join("")

      : `
          <p class="empty-inline">
            Nenhum cliente ativo cadastrado.
          </p>
        `;

  if (
    listaClientesArquivados &&
    contadorClientesArquivados
  ) {

    contadorClientesArquivados.textContent =
      `${clientesArquivados.length} ${
        clientesArquivados.length === 1
          ? "cliente arquivado"
          : "clientes arquivados"
      }`;

    listaClientesArquivados.innerHTML =
      clientesArquivados.length
        ? clientesArquivados
            .map(
              (cliente) => `
                <article class="cliente-card cliente-card-arquivado" data-cliente-id="${cliente.id}">

                  <strong>
                    ${escaparHTML(
                      cliente.nomeFantasia
                    )}
                  </strong>

                  <span>
                    ${escaparHTML(
                      cliente.razaoSocial
                    )}
                  </span>

                  <small>
                    CNPJ:
                    ${escaparHTML(
                      cliente.cnpjFormatado ||
                      formatarCNPJ(
                        cliente.cnpj ||
                        cliente.id
                      )
                    )}
                  </small>

                  ${
                    podeGerenciarClientes()
                      ? `
                        <div class="cliente-card-actions">
                          <button
                            class="btn btn-success btn-desarquivar-cliente"
                            type="button"
                            data-cliente-id="${cliente.id}"
                          >
                            Desarquivar
                          </button>

                          <button
                            class="btn btn-danger btn-excluir-cliente"
                            type="button"
                            data-cliente-id="${cliente.id}"
                          >
                            Excluir
                          </button>
                        </div>
                      `
                      : ""
                  }

                </article>
              `
            )
            .join("")
        : `
            <p class="empty-inline">
              Nenhum cliente arquivado.
            </p>
          `;
  }

  preencherSelectClientes();
}


/* ========================================= */
/* HISTÓRICO - BUSCA */
/* ========================================= */

function buscarClientesHistorico(termo) {

  const termoNormalizado =
    normalizar(termo);

  const termoNumerico =
    somenteNumeros(termo);

  return clientes.filter((cliente) => !cliente.arquivado).filter((cliente) => {

    const texto =
      normalizar(`
        ${cliente.nomeFantasia || ""}
        ${cliente.razaoSocial || ""}
        ${cliente.cnpjFormatado || ""}
        ${cliente.cnpj || cliente.id || ""}
      `);

    return (
      texto.includes(termoNormalizado) ||

      (
        termoNumerico &&
        somenteNumeros(
          cliente.cnpj || cliente.id
        ).includes(termoNumerico)
      )
    );

  });

}


/* ========================================= */
/* SUGESTÕES HISTÓRICO */
/* ========================================= */

function renderizarSugestoesHistorico() {

  const termo =
    campoHistorico.value.trim();

  clienteHistoricoSelecionado = null;


  if (!termo) {

    sugestoesHistorico.classList.add(
      "hidden"
    );

    sugestoesHistorico.innerHTML = "";

    return;

  }


  const encontrados =
    buscarClientesHistorico(termo)
      .slice(0, 8);


  sugestoesHistorico.innerHTML =
    encontrados.length

      ? encontrados
          .map(
            (cliente) => `

              <button
                class="history-suggestion"
                type="button"
                data-cnpj="${escaparHTML(
                  cliente.cnpj || cliente.id
                )}"
              >

                <strong>
                  ${escaparHTML(
                    cliente.nomeFantasia
                  )}
                </strong>

                <span>

                  ${escaparHTML(
                    cliente.razaoSocial
                  )}

                  ·

                  ${escaparHTML(
                    cliente.cnpjFormatado ||
                    formatarCNPJ(
                      cliente.cnpj ||
                      cliente.id
                    )
                  )}

                </span>

              </button>

            `
          )
          .join("")

      : `
          <div class="empty-state">
            <strong>
              Nenhum cliente encontrado.
            </strong>
          </div>
        `;


  sugestoesHistorico.classList.remove(
    "hidden"
  );

}


/* ========================================= */
/* SELECIONAR CLIENTE HISTÓRICO */
/* ========================================= */

function selecionarClienteHistorico(cnpj) {

  const cliente =
    obterClientePorCnpj(cnpj);

  if (!cliente) return;


  clienteHistoricoSelecionado =
    cliente;


  campoHistorico.value =
    `${cliente.nomeFantasia} — ${
      cliente.cnpjFormatado ||
      formatarCNPJ(
        cliente.cnpj ||
        cliente.id
      )
    }`;


  sugestoesHistorico.classList.add(
    "hidden"
  );

}


/* ========================================= */
/* REGISTROS DO CLIENTE */
/* ========================================= */

function registrosDoCliente(cliente) {

  const cnpj =
    somenteNumeros(
      cliente.cnpj || cliente.id
    );

  const fantasia =
    normalizar(
      cliente.nomeFantasia || ""
    );

  const razao =
    normalizar(
      cliente.razaoSocial || ""
    );


  return registros

    .filter((registro) => {

      const registroCnpj =
        somenteNumeros(
          registro.cnpjCliente || ""
        );

      const registroFantasia =
        normalizar(
          registro.nomeFantasia || ""
        );

      const registroNome =
        normalizar(
          registro.nomeCliente || ""
        );


      if (
        registroCnpj &&
        registroCnpj === cnpj
      ) {

        return true;

      }


      return (

        (
          fantasia &&
          registroFantasia === fantasia
        )

        ||

        (
          razao &&
          registroFantasia === razao
        )

        ||

        (
          razao &&
          registroNome.includes(razao)
        )

      );

    })

    .sort(
      (a, b) =>

        new Date(
          dataISO(b.criadoEm)
        ).getTime()

        -

        new Date(
          dataISO(a.criadoEm)
        ).getTime()
    );

}


/* ========================================= */
/* ABRIR HISTÓRICO */
/* ========================================= */

function abrirHistoricoCliente(cliente) {

  const historico =
    registrosDoCliente(cliente);


  const cnpjFormatado =
    cliente.cnpjFormatado ||
    formatarCNPJ(
      cliente.cnpj || cliente.id
    );


  historicoTitulo.textContent =
    `Histórico — ${cliente.nomeFantasia}`;


  historicoResumo.textContent =
    `${historico.length} ${
      historico.length === 1
        ? "atendimento encontrado"
        : "atendimentos encontrados"
    }`;


  historicoClienteDados.innerHTML = `

    <div class="history-data-item">

      <span>
        Nome fantasia
      </span>

      <strong>
        ${escaparHTML(
          cliente.nomeFantasia
        )}
      </strong>

    </div>


    <div class="history-data-item">

      <span>
        Razão social
      </span>

      <strong>
        ${escaparHTML(
          cliente.razaoSocial
        )}
      </strong>

    </div>


    <div class="history-data-item">

      <span>
        CNPJ
      </span>

      <strong>
        ${escaparHTML(
          cnpjFormatado
        )}
      </strong>

    </div>

  `;


  historicoLista.innerHTML =
    historico.length

      ? historico
          .map(
            (registro) => `

              <article class="history-entry">

                <div class="history-entry-header">

                  <div>

                    <div class="history-entry-date">

                      ${formatarData(
                        registro.criadoEm
                      )}

                    </div>


                    <div class="history-entry-meta">

                      <span class="history-pill">

                        ${escaparHTML(
                          registro.categoriaAtendimento ||
                          "Sem categoria"
                        )}

                      </span>


                      ${criarBadgeSituacao(
                        registro.situacao
                      )}


                      <span class="history-pill">

                        ${escaparHTML(
                          registro.nomeCliente ||
                          "Cliente não informado"
                        )}

                      </span>

                    </div>

                  </div>


                  <span class="history-pill">

                    ${escaparHTML(
                      registro.numeroLogin ||
                      "Sem número/login"
                    )}

                  </span>

                </div>


                <div class="history-attendant">

                  <strong>

                    Atendimento registrado por:

                    ${escaparHTML(
                      registro.atendenteNome ||
                      registro.atendenteEmail ||
                      registro.criadoPor ||
                      "Atendente não identificado"
                    )}

                  </strong>


                  <span>

                    ${escaparHTML(
                      registro.atendenteEmail ||
                      registro.criadoPor ||
                      "E-mail não registrado"
                    )}

                  </span>

                </div>


                <div class="history-comment">

                  ${escaparHTML(
                    registro.comentarios
                  )}

                </div>

              </article>

            `
          )
          .join("")

      : `
          <div class="empty-state">

            <strong>
              Nenhum atendimento encontrado para este cliente.
            </strong>

            <p>
              Registros antigos sem CNPJ podem precisar ser editados pelo administrador para ficarem vinculados corretamente.
            </p>

          </div>
        `;


  telaHistorico.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "history-open"
  );

}


/* ========================================= */
/* FECHAR HISTÓRICO */
/* ========================================= */

function fecharTelaHistorico() {

  telaHistorico.classList.add(
    "hidden"
  );

  document.body.classList.remove(
    "history-open"
  );

}


/* ========================================= */
/* FIRESTORE REGISTROS */
/* ========================================= */

function iniciarEscuta() {

  if (cancelarEscuta) {

    cancelarEscuta();

  }


  statusNuvem.textContent =
    "Sincronizando...";


  cancelarEscuta =
    onSnapshot(

      query(
        registrosRef,
        orderBy(
          "atualizadoEm",
          "desc"
        )
      ),

      (snapshot) => {

        registros =
          snapshot.docs.map(
            (item) => ({

              id: item.id,

              ...item.data(),

            })
          );


        renderizarRegistros();


        statusNuvem.textContent =
          "☁ Dados sincronizados";

      },

      (erro) => {

        console.error(
          "Erro ao carregar registros:",
          erro
        );


        statusNuvem.textContent =
          "Erro de conexão";


        mostrarToast(
          "Não foi possível carregar os registros.",
          true
        );

      }

    );

}


/* ========================================= */
/* FIRESTORE CLIENTES */
/* ========================================= */

function iniciarEscutaClientes() {

  if (cancelarEscutaClientes) {

    cancelarEscutaClientes();

  }


  cancelarEscutaClientes =
    onSnapshot(

      query(
        clientesRef,
        orderBy(
          "criadoEm",
          "desc"
        )
      ),

      (snapshot) => {

        clientes =
          snapshot.docs.map(
            (item) => ({

              id: item.id,

              ...item.data(),

            })
          );


        renderizarClientes();

      },

      (erro) => {

        console.error(
          "Erro ao carregar clientes:",
          erro
        );


        mostrarToast(
          "Não foi possível carregar os clientes.",
          true
        );

      }

    );

}


/* ========================================= */
/* APROVAÇÕES */
/* ========================================= */

function iniciarAprovacoes() {

  if (!usuarioAtualEhAdmin) {

    return;

  }


  if (cancelarAprovacoes) {

    cancelarAprovacoes();

  }


  cancelarAprovacoes =
    onSnapshot(

      query(
        collection(
          db,
          "usuarios"
        ),
        where(
          "aprovado",
          "==",
          false
        )
      ),

      (snapshot) => {

        const itens =
          snapshot.docs

            .map(
              (item) => ({

                id: item.id,

                ...item.data(),

              })
            )

            .filter(
              (usuario) =>
                usuario.recusado !== true
            );


        listaAprovacoes.innerHTML =
          itens.length

            ? itens
                .map(
                  (usuario) => `

                    <article class="approval-card">

                      <div>

                        <strong>
                          ${escaparHTML(
                            usuario.nome
                          )}
                        </strong>

                        <span>
                          ${escaparHTML(
                            usuario.email
                          )}
                        </span>

                      </div>


                      <div class="approval-actions">

                        <button
                          class="btn btn-primary btn-aprovar"
                          data-id="${usuario.id}"
                          type="button"
                        >
                          Aprovar
                        </button>


                        <button
                          class="btn btn-danger btn-recusar"
                          data-id="${usuario.id}"
                          type="button"
                        >
                          Recusar
                        </button>

                      </div>

                    </article>

                  `
                )
                .join("")

            : `
                <p class="empty-inline">
                  Nenhuma solicitação pendente.
                </p>
              `;

      },

      (erro) => {

        console.error(
          "Erro ao carregar aprovações:",
          erro
        );

      }

    );

}


/* ========================================= */
/* LIMPAR FORMULÁRIO */
/* ========================================= */

function limparFormulario() {

  form.reset();

  registroId.value = "";

  cnpjAtendimento.value = "";

  nomeFantasia.value = "";

  tituloFormulario.textContent =
    "Novo registro";

  clienteAtendimento.focus();

}


/* ========================================= */
/* LIMPAR CLIENTE */
/* ========================================= */

function limparFormularioCliente() {

  formCliente.reset();

  clienteEditandoId = null;

  cnpjCliente.readOnly = false;

  const botao =
    formCliente.querySelector(
      'button[type="submit"]'
    );

  if (botao) {
    botao.textContent = "Cadastrar cliente";
  }

  if (limparCliente) {
    limparCliente.textContent = "Limpar";
  }

  cnpjCliente.focus();

}


/* ========================================= */
/* EDITAR / EXCLUIR CLIENTE */
/* ========================================= */

function iniciarEdicaoCliente(id) {

  if (!podeGerenciarClientes()) {
    mostrarToast("Você não tem permissão para editar clientes.", true);
    return;
  }

  const cliente =
    clientes.find(
      (item) => item.id === id
    );

  if (!cliente) {
    mostrarToast(
      "Cliente não encontrado.",
      true
    );
    return;
  }

  clienteEditandoId = cliente.id;

  cnpjCliente.value =
    cliente.cnpjFormatado ||
    formatarCNPJ(
      cliente.cnpj ||
      cliente.id
    );

  // O CNPJ fica bloqueado durante a edição porque ele é
  // o identificador que vincula o cliente aos dados já existentes.
  cnpjCliente.readOnly = true;

  razaoSocialCliente.value =
    cliente.razaoSocial || "";

  nomeFantasiaCliente.value =
    cliente.nomeFantasia || "";

  const botao =
    formCliente.querySelector(
      'button[type="submit"]'
    );

  if (botao) {
    botao.textContent =
      "Salvar alterações";
  }

  if (limparCliente) {
    limparCliente.textContent =
      "Cancelar edição";
  }

  formCliente.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}


async function excluirClienteCadastrado(id) {

  if (!podeGerenciarClientes()) {
    mostrarToast("Você não tem permissão para excluir clientes.", true);
    return;
  }

  const cliente =
    clientes.find(
      (item) => item.id === id
    );

  if (!cliente) {
    mostrarToast(
      "Cliente não encontrado.",
      true
    );
    return;
  }

  const nome =
    cliente.nomeFantasia ||
    cliente.razaoSocial ||
    "este cliente";

  const confirmou =
    window.confirm(
      `Deseja realmente excluir o cliente "${nome}"?\n\nOs atendimentos já registrados não serão apagados.`
    );

  if (!confirmou) return;

  try {

    await deleteDoc(
      doc(
        db,
        "clientes",
        cliente.id
      )
    );

    if (
      clienteEditandoId === cliente.id
    ) {
      limparFormularioCliente();
    }

    mostrarToast(
      "Cliente excluído com sucesso."
    );

  } catch (erro) {

    console.error(
      "Erro ao excluir cliente:",
      erro
    );

    mostrarToast(
      "Não foi possível excluir o cliente.",
      true
    );
  }
}


listaClientesCadastrados.addEventListener(
  "click",
  (evento) => {

    const editar =
      evento.target.closest(
        ".btn-editar-cliente"
      );

    const arquivar =
      evento.target.closest(
        ".btn-arquivar-cliente"
      );

    const excluir =
      evento.target.closest(
        ".btn-excluir-cliente"
      );

    if (editar) {
      iniciarEdicaoCliente(
        editar.dataset.clienteId
      );
      return;
    }

    if (arquivar) {
      arquivarClienteCadastrado(
        arquivar.dataset.clienteId
      );
      return;
    }

    if (excluir) {
      excluirClienteCadastrado(
        excluir.dataset.clienteId
      );
    }
  }
);


listaClientesArquivados?.addEventListener(
  "click",
  (evento) => {

    const desarquivar =
      evento.target.closest(
        ".btn-desarquivar-cliente"
      );

    const excluir =
      evento.target.closest(
        ".btn-excluir-cliente"
      );

    if (desarquivar) {
      desarquivarClienteCadastrado(
        desarquivar.dataset.clienteId
      );
      return;
    }

    if (excluir) {
      excluirClienteCadastrado(
        excluir.dataset.clienteId
      );
    }
  }
);


/* ========================================= */
/* ARQUIVAR / DESARQUIVAR CLIENTE */
/* ========================================= */

async function arquivarClienteCadastrado(id) {

  if (!podeGerenciarClientes()) {
    mostrarToast("Você não tem permissão para arquivar clientes.", true);
    return;
  }

  const cliente =
    clientes.find(
      (item) => item.id === id
    );

  if (!cliente) {
    mostrarToast(
      "Cliente não encontrado.",
      true
    );
    return;
  }

  const nome =
    cliente.nomeFantasia ||
    cliente.razaoSocial ||
    "este cliente";

  const confirmou =
    window.confirm(
      `Deseja arquivar o cliente "${nome}"?\n\nO cadastro, histórico e checklist serão preservados e poderão ser restaurados depois.`
    );

  if (!confirmou) return;

  try {

    await updateDoc(
      doc(
        db,
        "clientes",
        cliente.id
      ),
      {
        arquivado: true,
        arquivadoEm:
          serverTimestamp(),
        arquivadoPor:
          usuarioAtualEmail,
        atualizadoEm:
          serverTimestamp(),
      }
    );

    if (
      clienteEditandoId === cliente.id
    ) {
      limparFormularioCliente();
    }

    mostrarToast(
      "Cliente arquivado com sucesso."
    );

  } catch (erro) {

    console.error(
      "Erro ao arquivar cliente:",
      erro
    );

    mostrarToast(
      "Não foi possível arquivar o cliente.",
      true
    );
  }
}


async function desarquivarClienteCadastrado(id) {

  if (!podeGerenciarClientes()) {
    mostrarToast("Você não tem permissão para desarquivar clientes.", true);
    return;
  }

  const cliente =
    clientes.find(
      (item) => item.id === id
    );

  if (!cliente) {
    mostrarToast(
      "Cliente não encontrado.",
      true
    );
    return;
  }

  try {

    await updateDoc(
      doc(
        db,
        "clientes",
        cliente.id
      ),
      {
        arquivado: false,
        desarquivadoEm:
          serverTimestamp(),
        desarquivadoPor:
          usuarioAtualEmail,
        atualizadoEm:
          serverTimestamp(),
      }
    );

    mostrarToast(
      "Cliente restaurado com sucesso."
    );

  } catch (erro) {

    console.error(
      "Erro ao desarquivar cliente:",
      erro
    );

    mostrarToast(
      "Não foi possível restaurar o cliente.",
      true
    );
  }
}


/* ========================================= */
/* DETALHES */
/* ========================================= */

function abrirDetalhes(id) {

  const registro =
    registros.find(
      (item) =>
        item.id === id
    );


  if (!registro) return;


  registroSelecionadoId = id;


  modalTitulo.textContent =
    registro.nomeCliente;


  modalConteudo.innerHTML = `

    <div class="detail-row">

      <span>
        Nome fantasia
      </span>

      <strong>
        ${escaparHTML(
          registro.nomeFantasia ||
          "Não informado"
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>
        CNPJ
      </span>

      <strong>

        ${escaparHTML(

          registro.cnpjFormatado ||

          (
            registro.cnpjCliente

              ? formatarCNPJ(
                  registro.cnpjCliente
                )

              : "Não informado"
          )

        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>
        Número ou login
      </span>

      <strong>
        ${escaparHTML(
          registro.numeroLogin
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>
        Categoria do atendimento
      </span>

      <strong>
        ${escaparHTML(
          registro.categoriaAtendimento ||
          "Não informada"
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>
        Situação
      </span>

      ${criarBadgeSituacao(
        registro.situacao
      )}

    </div>


    <div class="detail-row">

      <span>
        Atendente responsável
      </span>

      <strong>

        ${escaparHTML(

          registro.atendenteNome ||

          registro.atendenteEmail ||

          registro.criadoPor ||

          "Não identificado"

        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>
        E-mail do atendente
      </span>

      <strong>

        ${escaparHTML(

          registro.atendenteEmail ||

          registro.criadoPor ||

          "Não informado"

        )}

      </strong>

    </div>


    <div class="detail-row">

      <span>
        Criado em
      </span>

      <strong>
        ${formatarData(
          registro.criadoEm
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>
        Última atualização
      </span>

      <strong>
        ${formatarData(
          registro.atualizadoEm ||
          registro.criadoEm
        )}
      </strong>

    </div>


    <div class="detail-row">

      <span>
        Registro do atendimento
      </span>

      <div class="comment-box">

        ${escaparHTML(
          registro.comentarios
        )}

      </div>

    </div>

  `;


  configurarPermissoesVisuais();


  modal.classList.remove(
    "hidden"
  );

}


/* ========================================= */
/* FECHAR DETALHES */
/* ========================================= */

function fecharDetalhes() {

  modal.classList.add(
    "hidden"
  );

  registroSelecionadoId = null;

}


/* ========================================= */
/* EDITAR REGISTRO */
/* ========================================= */

function editarRegistro(id) {

  if (!usuarioAtualEhAdmin) {

    mostrarToast(
      "Somente o administrador pode editar registros.",
      true
    );

    return;

  }


  const registro =
    registros.find(
      (item) =>
        item.id === id
    );


  if (!registro) return;


  const cnpj =
    somenteNumeros(
      registro.cnpjCliente || ""
    );


  registroId.value =
    registro.id;


  if (
    cnpj &&
    obterClientePorCnpj(cnpj)
  ) {

    clienteAtendimento.value =
      cnpj;

    preencherClienteNoAtendimento(
      cnpj
    );

  } else {

    clienteAtendimento.value = "";

    cnpjAtendimento.value =
      registro.cnpjFormatado ||
      formatarCNPJ(cnpj);

    nomeFantasia.value =
      registro.nomeFantasia || "";

  }


  numeroLogin.value =
    registro.numeroLogin || "";


  nomeCliente.value =
    registro.nomeCliente || "";


  categoriaAtendimento.value =
    registro.categoriaAtendimento || "";


  /* SITUAÇÃO */

  situacao.value =
    registro.situacao || "";


  comentarios.value =
    registro.comentarios || "";


  tituloFormulario.textContent =
    "Editar registro";


  fecharDetalhes();


  window.scrollTo({

    top: 0,

    behavior: "smooth",

  });

}


/* ========================================= */
/* EXCLUIR */
/* ========================================= */

async function excluirRegistro(id) {

  if (!usuarioAtualEhAdmin) {

    mostrarToast(
      "Somente o administrador pode excluir registros.",
      true
    );

    return;

  }


  const registro =
    registros.find(
      (item) =>
        item.id === id
    );


  if (!registro) return;


  const confirmar =
    confirm(
      `Deseja realmente excluir o registro de ${registro.nomeCliente}?`
    );


  if (!confirmar) return;


  try {

    await deleteDoc(
      doc(
        db,
        "registrosClientes",
        id
      )
    );


    fecharDetalhes();

    limparFormulario();


    mostrarToast(
      "Registro excluído."
    );

  } catch (erro) {

    console.error(
      "Erro ao excluir registro:",
      erro
    );


    mostrarToast(
      "Erro ao excluir.",
      true
    );

  }

}


/* ========================================= */
/* ========================================= */
/* ENTER PARA ENTRAR NO SISTEMA */
/* ========================================= */

[emailLogin, senhaLogin].forEach((campo) => {
  campo.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      formLogin.requestSubmit();
    }
  });
});


/* LOGIN / CADASTRO */
/* ========================================= */

abrirCadastro.addEventListener(
  "click",
  () => {

    erroCadastro.textContent = "";

    mostrarAuth(
      formCadastro
    );

  }
);


voltarLogin.addEventListener(
  "click",
  () => {

    mostrarAuth(
      formLogin
    );

  }
);


sairPendente.addEventListener(
  "click",
  async () => {

    await signOut(auth);

    mostrarAuth(
      formLogin
    );

  }
);


/* LOGIN */

formLogin.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();

    erroLogin.textContent = "";


    try {

      await signInWithEmailAndPassword(

        auth,

        emailLogin.value.trim(),

        senhaLogin.value

      );


      formLogin.reset();

    } catch (erro) {

      console.error(
        "Erro no login:",
        erro
      );


      erroLogin.textContent =
        "E-mail ou senha inválidos.";

    }

  }
);


/* CADASTRO */

formCadastro.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();


    erroCadastro.textContent = "";


    const nome =
      nomeCadastro.value.trim();


    const email =
      emailCadastro.value
        .trim()
        .toLowerCase();


    const senha =
      senhaCadastro.value;


    const confirmarSenha =
      confirmarSenhaCadastro.value;


    if (
      !nome ||
      !email ||
      !senha ||
      !confirmarSenha
    ) {

      erroCadastro.textContent =
        "Preencha todos os campos.";

      return;

    }


    if (
      senha !== confirmarSenha
    ) {

      erroCadastro.textContent =
        "As senhas não são iguais.";

      return;

    }


    if (
      senha.length < 6
    ) {

      erroCadastro.textContent =
        "A senha precisa ter pelo menos 6 caracteres.";

      return;

    }


    try {

      const credencial =
        await createUserWithEmailAndPassword(

          auth,

          email,

          senha

        );


      await setDoc(

        doc(
          db,
          "usuarios",
          credencial.user.uid
        ),

        {

          nome,

          email,

          aprovado: false,

          recusado: false,

          criadoEm:
            serverTimestamp(),

        }

      );


      emailPendente.textContent =
        email;


      formCadastro.reset();


      mostrarAuth(
        telaPendente
      );

    } catch (erro) {

      console.error(
        "Erro no cadastro:",
        erro
      );


      erroCadastro.textContent =

        erro.code ===
        "auth/email-already-in-use"

          ? "Este e-mail já está cadastrado."

          : "Não foi possível concluir o cadastro.";

    }

  }
);


/* ========================================= */
/* CADASTRAR / EDITAR CLIENTE */
/* ========================================= */

formCliente.addEventListener(
  "submit",
  async (evento) => {

    if (
      clienteEditandoId &&
      !podeGerenciarClientes()
    ) {
      evento.preventDefault();
      mostrarToast(
        "Você não tem permissão para editar clientes.",
        true
      );
      limparFormularioCliente();
      return;
    }

    evento.preventDefault();

    const cnpj =
      somenteNumeros(
        cnpjCliente.value
      );

    const razaoSocial =
      formatarMaiusculo(
        razaoSocialCliente.value
      );

    const nomeFantasiaEmpresa =
      formatarMaiusculo(
        nomeFantasiaCliente.value
      );

    razaoSocialCliente.value =
      razaoSocial;

    nomeFantasiaCliente.value =
      nomeFantasiaEmpresa;

    if (
      !validarCNPJBasico(cnpj)
    ) {
      mostrarToast(
        "Digite um CNPJ com 14 números.",
        true
      );
      return;
    }

    if (
      !razaoSocial ||
      !nomeFantasiaEmpresa
    ) {
      mostrarToast(
        "Preencha todos os dados do cliente.",
        true
      );
      return;
    }

    const botao =
      formCliente.querySelector(
        'button[type="submit"]'
      );

    botao.disabled = true;

    botao.textContent =
      clienteEditandoId
        ? "Salvando..."
        : "Cadastrando...";

    try {

      if (clienteEditandoId) {

        await updateDoc(
          doc(
            db,
            "clientes",
            clienteEditandoId
          ),
          {
            razaoSocial,
            nomeFantasia:
              nomeFantasiaEmpresa,
            atualizadoEm:
              serverTimestamp(),
            atualizadoPor:
              usuarioAtualEmail,
          }
        );

        mostrarToast(
          "Cliente atualizado com sucesso."
        );

        limparFormularioCliente();

      } else {

        const clienteDocumento =
          doc(
            db,
            "clientes",
            cnpj
          );

        const clienteExistente =
          await getDoc(
            clienteDocumento
          );

        if (
          clienteExistente.exists()
        ) {
          mostrarToast(
            "Já existe um cliente com esse CNPJ.",
            true
          );
          return;
        }

        await setDoc(
          clienteDocumento,
          {
            cnpj,
            cnpjFormatado:
              formatarCNPJ(cnpj),
            razaoSocial,
            nomeFantasia:
              nomeFantasiaEmpresa,
            criadoEm:
              serverTimestamp(),
            criadoPor:
              usuarioAtualEmail,
          }
        );

        limparFormularioCliente();

        mostrarToast(
          "Cliente cadastrado com sucesso."
        );
      }

    } catch (erro) {

      console.error(
        "Erro ao salvar cliente:",
        erro
      );

      mostrarToast(
        clienteEditandoId
          ? "Não foi possível atualizar o cliente."
          : "Não foi possível cadastrar o cliente.",
        true
      );

    } finally {

      botao.disabled = false;

      botao.textContent =
        clienteEditandoId
          ? "Salvar alterações"
          : "Cadastrar cliente";
    }
  }
);


/* CNPJ */

cnpjCliente.addEventListener(
  "input",
  () => {

    cnpjCliente.value =
      formatarCNPJ(
        cnpjCliente.value
      );

  }
);


limparCliente.addEventListener(
  "click",
  limparFormularioCliente
);


/* ========================================= */
/* CLIENTE DO ATENDIMENTO */
/* ========================================= */

clienteAtendimento.addEventListener(
  "change",
  () => {

    preencherClienteNoAtendimento(
      clienteAtendimento.value
    );

  }
);


/* ========================================= */
/* HISTÓRICO */
/* ========================================= */

campoHistorico.addEventListener(
  "input",
  renderizarSugestoesHistorico
);


sugestoesHistorico.addEventListener(
  "click",
  (evento) => {

    const botao =
      evento.target.closest(
        ".history-suggestion"
      );


    if (botao) {

      selecionarClienteHistorico(
        botao.dataset.cnpj
      );

    }

  }
);


btnVerHistorico.addEventListener(
  "click",
  () => {

    let cliente =
      clienteHistoricoSelecionado;


    if (!cliente) {

      const encontrados =
        buscarClientesHistorico(
          campoHistorico.value.trim()
        );


      if (
        encontrados.length === 1
      ) {

        cliente =
          encontrados[0];

      }

    }


    if (!cliente) {

      mostrarToast(
        "Selecione um cliente para abrir o histórico.",
        true
      );

      return;

    }


    abrirHistoricoCliente(
      cliente
    );

  }
);


fecharHistorico.addEventListener(
  "click",
  fecharTelaHistorico
);


/* ========================================= */
/* LOGOUT */
/* ========================================= */

btnSair.addEventListener(
  "click",
  () => {

    signOut(auth);

  }
);


/* ========================================= */
/* AUTH STATE */
/* ========================================= */

onAuthStateChanged(
  auth,
  async (usuario) => {

    if (cancelarEscuta) {

      cancelarEscuta();

    }


    if (cancelarEscutaClientes) {

      cancelarEscutaClientes();

    }


    if (cancelarAprovacoes) {

      cancelarAprovacoes();

    }


    cancelarEscuta = null;

    cancelarEscutaClientes = null;

    cancelarAprovacoes = null;


    usuarioAtualEhAdmin = false;

    usuarioAtualNome = "";

    usuarioAtualEmail = "";

    usuarioAtualUid = "";

    if (saudacaoUsuario) {
      saudacaoUsuario.textContent = "";
    }


    if (!usuario) {

      registros = [];

      clientes = [];


      aplicacao.classList.add(
        "hidden"
      );


      telaLogin.classList.remove(
        "hidden"
      );


      painelAprovacoes.classList.add(
        "hidden"
      );


      editarModal.classList.add(
        "hidden"
      );


      excluirModal.classList.add(
        "hidden"
      );


      fecharTelaHistorico();


      mostrarAuth(
        formLogin
      );


      return;

    }


    try {

      const perfilSnap =
        await getDoc(
          doc(
            db,
            "usuarios",
            usuario.uid
          )
        );


      const adminSnap =
        await getDoc(
          doc(
            db,
            "admins",
            usuario.uid
          )
        );


      usuarioAtualEhAdmin =
        adminSnap.exists();


      usuarioAtualUid =
        usuario.uid;


      usuarioAtualEmail =
        usuario.email || "";


      const perfil =
        perfilSnap.exists()
          ? perfilSnap.data()
          : {};


      const adminDados =
        adminSnap.exists()
          ? adminSnap.data()
          : {};


      usuarioAtualNome =

        perfil.nome ||

        adminDados.nome ||

        usuario.displayName ||

        usuarioAtualEmail.split("@")[0] ||

        "Atendente";


      if (
        !usuarioAtualEhAdmin &&
        (
          !perfilSnap.exists() ||
          perfil.aprovado !== true
        )
      ) {

        aplicacao.classList.add(
          "hidden"
        );


        telaLogin.classList.remove(
          "hidden"
        );


        emailPendente.textContent =
          usuario.email;


        mostrarAuth(
          telaPendente
        );


        return;

      }


      telaLogin.classList.add(
        "hidden"
      );


      aplicacao.classList.remove(
        "hidden"
      );


      atualizarSaudacaoUsuario();


      // Sempre inicia somente com os cards do menu principal.
      // Isso evita que painéis antigos apareçam após o login.
      mostrarMenuPrincipalSistema();


      configurarPermissoesVisuais();

      iniciarEscuta();

      iniciarEscutaClientes();


      if (
        usuarioAtualEhAdmin
      ) {

        iniciarAprovacoes();

      }

    } catch (erro) {

      console.error(
        "Erro ao verificar autorização:",
        erro
      );


      await signOut(auth);


      erroLogin.textContent =
        "Não foi possível verificar sua autorização.";

    }

  }
);


/* ========================================= */
/* APROVAR / RECUSAR */
/* ========================================= */

listaAprovacoes.addEventListener(
  "click",
  async (evento) => {

    if (
      !usuarioAtualEhAdmin
    ) {

      mostrarToast(
        "Somente o administrador pode aprovar usuários.",
        true
      );

      return;

    }


    const botaoAprovar =
      evento.target.closest(
        ".btn-aprovar"
      );


    const botaoRecusar =
      evento.target.closest(
        ".btn-recusar"
      );


    try {

      if (botaoAprovar) {

        await updateDoc(

          doc(
            db,
            "usuarios",
            botaoAprovar.dataset.id
          ),

          {

            aprovado: true,

            recusado: false,

            aprovadoEm:
              serverTimestamp(),

            aprovadoPor:
              usuarioAtualEmail,

          }

        );


        mostrarToast(
          "Usuário aprovado."
        );

      }


      if (
        botaoRecusar &&
        confirm(
          "Recusar esta solicitação?"
        )
      ) {

        await updateDoc(

          doc(
            db,
            "usuarios",
            botaoRecusar.dataset.id
          ),

          {

            aprovado: false,

            recusado: true,

            recusadoEm:
              serverTimestamp(),

            recusadoPor:
              usuarioAtualEmail,

          }

        );


        mostrarToast(
          "Solicitação recusada."
        );

      }

    } catch (erro) {

      console.error(
        "Erro ao atualizar solicitação:",
        erro
      );


      mostrarToast(
        "Não foi possível atualizar a solicitação.",
        true
      );

    }

  }
);


/* ========================================= */
/* SALVAR ATENDIMENTO */
/* ========================================= */

form.addEventListener(
  "submit",
  async (evento) => {

    evento.preventDefault();


    const cliente =
      obterClientePorCnpj(
        clienteAtendimento.value
      );


    if (!cliente) {

      mostrarToast(
        "Selecione um cliente cadastrado.",
        true
      );

      return;

    }


    /* VALIDAÇÃO DA SITUAÇÃO */

    if (!situacao.value) {

      mostrarToast(
        "Selecione a situação do atendimento.",
        true
      );

      situacao.focus();

      return;

    }


    /* GARANTE A FORMATAÇÃO ANTES DE SALVAR */

    comentarios.value =
      comentarios.value.toUpperCase();

    nomeCliente.value =
      formatarNomePessoa(nomeCliente.value);

    nomeFantasia.value =
      formatarMaiusculo(nomeFantasia.value);


    const dados = {

      clienteId:
        somenteNumeros(
          cliente.cnpj ||
          cliente.id
        ),

      cnpjCliente:
        somenteNumeros(
          cliente.cnpj ||
          cliente.id
        ),

      cnpjFormatado:
        cliente.cnpjFormatado ||
        formatarCNPJ(
          cliente.cnpj ||
          cliente.id
        ),

      razaoSocial:
        formatarMaiusculo(cliente.razaoSocial || ""),

      numeroLogin:
        numeroLogin.value.trim(),

      nomeCliente:
        formatarNomePessoa(nomeCliente.value),

      nomeFantasia:
        formatarMaiusculo(
          cliente.nomeFantasia ||
          nomeFantasia.value
        ),

      categoriaAtendimento:
        categoriaAtendimento.value,

      /* NOVO CAMPO */

      situacao:
        situacao.value,

      comentarios:
        comentarios.value.trim(),

    };


    if (
      Object.values(dados)
        .some(
          (valor) =>
            !String(valor).trim()
        )
    ) {

      mostrarToast(
        "Preencha todos os campos.",
        true
      );

      return;

    }


    if (
      registroId.value &&
      !usuarioAtualEhAdmin
    ) {

      mostrarToast(
        "Somente o administrador pode editar registros.",
        true
      );


      limparFormulario();


      return;

    }


    const botaoSalvar =
      form.querySelector(
        'button[type="submit"]'
      );


    botaoSalvar.disabled =
      true;


    botaoSalvar.textContent =
      "Salvando...";


    try {

      /* EDITAR */

      if (
        registroId.value
      ) {

        await updateDoc(

          doc(
            db,
            "registrosClientes",
            registroId.value
          ),

          {

            ...dados,

            atualizadoEm:
              serverTimestamp(),

            atualizadoPor:
              usuarioAtualEmail,

            atualizadoPorNome:
              usuarioAtualNome,

          }

        );


        mostrarToast(
          "Registro atualizado."
        );

      }

      /* NOVO */

      else {

        await addDoc(
          registrosRef,
          {

            ...dados,

            atendenteUid:
              usuarioAtualUid,

            atendenteNome:
              usuarioAtualNome,

            atendenteEmail:
              usuarioAtualEmail,

            criadoEm:
              serverTimestamp(),

            atualizadoEm:
              serverTimestamp(),

            criadoPor:
              usuarioAtualEmail,

          }
        );


        mostrarToast(
          "Registro salvo."
        );

      }


      limparFormulario();

    } catch (erro) {

      console.error(
        "Erro ao salvar registro:",
        erro
      );


      mostrarToast(
        "Erro ao salvar.",
        true
      );

    } finally {

      botaoSalvar.disabled =
        false;


      botaoSalvar.textContent =
        "Salvar registro";

    }

  }
);


/* ========================================= */
/* BUSCA */
/* ========================================= */

campoBusca.addEventListener(
  "input",
  renderizarRegistros
);


/* ========================================= */
/* NOVO */
/* ========================================= */

btnNovo.addEventListener(
  "click",
  () => {

    limparFormulario();


    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  }
);


/* ========================================= */
/* BOTÕES */
/* ========================================= */

btnCancelar.addEventListener(
  "click",
  limparFormulario
);


fecharModal.addEventListener(
  "click",
  fecharDetalhes
);


editarModal.addEventListener(
  "click",
  () => {

    editarRegistro(
      registroSelecionadoId
    );

  }
);


excluirModal.addEventListener(
  "click",
  () => {

    excluirRegistro(
      registroSelecionadoId
    );

  }
);


/* ========================================= */
/* ABRIR REGISTRO */
/* ========================================= */

listaRegistros.addEventListener(
  "click",
  (evento) => {

    const card =
      evento.target.closest(
        ".record-card"
      );


    if (card) {

      abrirDetalhes(
        card.dataset.id
      );

    }

  }
);


/* ========================================= */
/* MODAL */
/* ========================================= */

modal.addEventListener(
  "click",
  (evento) => {

    if (
      evento.target === modal
    ) {

      fecharDetalhes();

    }

  }
);


/* ========================================= */
/* FECHAR SUGESTÕES */
/* ========================================= */

document.addEventListener(
  "click",
  (evento) => {

    if (

      !campoHistorico.contains(
        evento.target
      )

      &&

      !sugestoesHistorico.contains(
        evento.target
      )

    ) {

      sugestoesHistorico.classList.add(
        "hidden"
      );

    }

  }
);


/* ========================================= */
/* ESC */
/* ========================================= */

document.addEventListener(
  "keydown",
  (evento) => {

    if (
      evento.key === "Escape"
    ) {

      if (
        !modal.classList.contains(
          "hidden"
        )
      ) {

        fecharDetalhes();

      }


      if (
        !telaHistorico.classList.contains(
          "hidden"
        )
      ) {

        fecharTelaHistorico();

      }

    }

  }
);

/* ========================================================= */
/* MENU PRINCIPAL EM CARDS - NAVEGAÇÃO POR ÁREAS             */
/* ========================================================= */

const menuPrincipalSistema = $("menuPrincipalSistema");
const barraVoltarMenu = $("barraVoltarMenu");
const btnVoltarMenuPrincipal = $("btnVoltarMenuPrincipal");
const tituloAreaAtual = $("tituloAreaAtual");
const layoutPrincipal = document.querySelector("main.layout");

const painelAtendimentosRegistrados = $("painelAtendimentosRegistrados");
const painelFormularioAtendimento = $("painelFormularioAtendimento");
const painelCadastroClientes = $("painelCadastroClientes");
const painelClientesArquivados = $("painelClientesArquivados");
const painelHistoricoMenu = $("painelHistoricoMenu");

const campoHistoricoMenu = $("campoHistoricoMenu");
const btnVerHistoricoMenu = $("btnVerHistoricoMenu");
const sugestoesHistoricoMenu = $("sugestoesHistoricoMenu");

const nomesAreasSistema = {
  registro: "Registro de Atendimento",
  dashboard: "Dashboard",
  historico: "Histórico de Atendimentos",
  clientes: "Cadastrar Novo Cliente",
  acompanhamento: "Acompanhamento de Clientes",
};

function paineisNavegaveisSistema() {
  return [
    painelAtendimentosRegistrados,
    painelFormularioAtendimento,
    dashboardPendencias,
    painelHistoricoMenu,
    painelCadastroClientes,
    painelClientesArquivados,
    painelAcompanhamento,
  ].filter(Boolean);
}

function ocultarPaineisSistema() {
  paineisNavegaveisSistema().forEach((painel) => {
    painel.classList.add("hidden");
  });

  // Solicitações de acesso ficam fora das áreas do menu.
  // Elas só podem aparecer na tela principal para o administrador.
  painelAprovacoes?.classList.add("hidden");
}

function mostrarMenuPrincipalSistema() {
  ocultarPaineisSistema();

  menuPrincipalSistema?.classList.remove("hidden");
  barraVoltarMenu?.classList.add("hidden");
  layoutPrincipal?.classList.remove("modo-area");

  // Na tela principal, restaura o painel de aprovações
  // somente quando o usuário atual for administrador.
  configurarPermissoesVisuais();

  if (tituloAreaAtual) {
    tituloAreaAtual.textContent = "";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function abrirAreaSistema(area) {
  ocultarPaineisSistema();

  menuPrincipalSistema?.classList.add("hidden");
  barraVoltarMenu?.classList.remove("hidden");
  layoutPrincipal?.classList.add("modo-area");

  if (tituloAreaAtual) {
    tituloAreaAtual.textContent =
      nomesAreasSistema[area] || "";
  }

  if (area === "registro") {
    // Ao entrar em Registro de Atendimento,
    // mostra somente o formulário para criar um novo registro.
    painelFormularioAtendimento?.classList.remove("hidden");
  }

  if (area === "dashboard") {
    dashboardPendencias?.classList.remove("hidden");
  }

  if (area === "historico") {
    painelHistoricoMenu?.classList.remove("hidden");
    setTimeout(() => campoHistoricoMenu?.focus(), 50);
  }

  if (area === "clientes") {
    painelCadastroClientes?.classList.remove("hidden");
    painelClientesArquivados?.classList.remove("hidden");
  }

  if (area === "acompanhamento") {
    painelAcompanhamento?.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

document.querySelectorAll("[data-abrir-area]").forEach((card) => {
  card.addEventListener("click", () => {
    abrirAreaSistema(card.dataset.abrirArea);
  });
});

btnVoltarMenuPrincipal?.addEventListener(
  "click",
  mostrarMenuPrincipalSistema
);

/* O botão + Novo registro abre diretamente a área de Registro. */
btnNovo?.addEventListener("click", () => {
  abrirAreaSistema("registro");

  setTimeout(() => {
    painelFormularioAtendimento?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 80);
});

/* Histórico: reaproveita a lógica já existente no script original. */
function sincronizarHistoricoMenuComOriginal() {
  if (!campoHistoricoMenu || !campoHistorico) return;

  campoHistorico.value = campoHistoricoMenu.value;

  campoHistorico.dispatchEvent(
    new Event("input", { bubbles: true })
  );
}

campoHistoricoMenu?.addEventListener("input", () => {
  sincronizarHistoricoMenuComOriginal();

  if (!sugestoesHistoricoMenu || !sugestoesHistorico) return;

  setTimeout(() => {
    sugestoesHistoricoMenu.innerHTML =
      sugestoesHistorico.innerHTML;

    sugestoesHistoricoMenu.classList.toggle(
      "hidden",
      sugestoesHistorico.classList.contains("hidden")
    );
  }, 0);
});

sugestoesHistoricoMenu?.addEventListener("click", (evento) => {
  const sugestao = evento.target.closest("button");

  if (!sugestao) return;

  const botoesOriginais =
    [...sugestoesHistorico.querySelectorAll("button")];

  const indice =
    [...sugestoesHistoricoMenu.querySelectorAll("button")]
      .indexOf(sugestao);

  if (indice >= 0 && botoesOriginais[indice]) {
    botoesOriginais[indice].click();

    campoHistoricoMenu.value =
      campoHistorico.value;

    sugestoesHistoricoMenu.classList.add("hidden");
  }
});

btnVerHistoricoMenu?.addEventListener("click", () => {
  sincronizarHistoricoMenuComOriginal();
  btnVerHistorico?.click();
});

/* Garante o estado inicial dos painéis desde o carregamento da página. */
document.addEventListener("DOMContentLoaded", () => {
  ocultarPaineisSistema();
  menuPrincipalSistema?.classList.remove("hidden");
  barraVoltarMenu?.classList.add("hidden");
  layoutPrincipal?.classList.remove("modo-area");
});

