
'use strict';

const TEMPO_POR_PERGUNTA = 30;
const PONTOS_POR_ACERTO = 10;
const $ = (id) => document.getElementById(id);

const telas = {
  inicio: $('inicio'),
  jogo: $('jogo'),
  resultado: $('resultado')
};

let estado = {
  nome: '',
  categoria: '',
  perguntas: [],
  indice: 0,
  pontos: 0,
  acertos: 0,
  tempo: TEMPO_POR_PERGUNTA,
  respondida: false,
  intervalo: null
};

function mostrarTela(tela) {
  Object.entries(telas).forEach(([chave, elemento]) => {
    const visivel = chave === tela;
    elemento.classList.toggle('oculto', !visivel);
    elemento.setAttribute('aria-hidden', String(!visivel));
  });
}

function validarFormulario() {
  const nome = $('nome').value.trim();
  const categoria = $('categoria').value;

  $('erro-nome').textContent = nome.length < 2
    ? 'Digite um nome com pelo menos 2 caracteres.'
    : '';

  $('erro-categoria').textContent =
    !Object.hasOwn(BANCO_PERGUNTAS, categoria)
      ? 'Escolha uma categoria válida.'
      : '';

  return nome.length >= 2 &&
    Object.hasOwn(BANCO_PERGUNTAS, categoria);
}

function embaralhar(lista) {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function iniciarQuiz(evento) {
  evento.preventDefault();

  if (!validarFormulario()) return;

  pararRelogio();

  estado = {
    nome: $('nome').value.trim(),
    categoria: $('categoria').value,
    perguntas: embaralhar(BANCO_PERGUNTAS[$('categoria').value]),
    indice: 0,
    pontos: 0,
    acertos: 0,
    tempo: TEMPO_POR_PERGUNTA,
    respondida: false,
    intervalo: null
  };

  $('saudacao').textContent = `Olá, ${estado.nome}! 👋`;

  mostrarTela('jogo');
  exibirPergunta();
}

function exibirPergunta() {
  pararRelogio();

  estado.respondida = false;
  estado.tempo = TEMPO_POR_PERGUNTA;

  const atual = estado.perguntas[estado.indice];
  const total = estado.perguntas.length;

  $('pergunta').textContent = atual.pergunta;
  $('categoria-atual').textContent =
    $('categoria').selectedOptions[0].textContent;

  $('contador').textContent =
    `Pergunta ${estado.indice + 1} de ${total}`;

  $('pontuacao').textContent =
    `⭐ ${estado.pontos} pontos`;

  $('progresso').setAttribute('aria-valuemax', String(total));
  $('progresso').setAttribute('aria-valuenow', String(estado.indice));

  $('barra-progresso').style.width =
    `${(estado.indice / total) * 100}%`;

  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('proxima').classList.add('oculto');
  $('alternativas').replaceChildren();

  const opcoes = embaralhar(
    atual.alternativas.map((texto, indice) => ({ texto, indice }))
  );

  opcoes.forEach((opcao) => {
    const botao = document.createElement('button');

    botao.type = 'button';
    botao.className = 'alternativa';
    botao.textContent = opcao.texto;
    botao.dataset.indice = String(opcao.indice);

    botao.addEventListener('click', () => responder(opcao.indice));

    $('alternativas').appendChild(botao);
  });

  atualizarRelogio();

  estado.intervalo = setInterval(() => {
    estado.tempo--;
    atualizarRelogio();

    if (estado.tempo <= 0) responder(null);
  }, 1000);
}

function atualizarRelogio() {
  $('tempo').textContent = `⏱️ ${estado.tempo}s`;

  $('tempo').classList.toggle('urgente', estado.tempo <= 5);
}

function pararRelogio() {
  if (estado.intervalo !== null) {
    clearInterval(estado.intervalo);
  }

  estado.intervalo = null;
}

function responder(indiceEscolhido) {
  if (estado.respondida) return;

  estado.respondida = true;
  pararRelogio();

  const correta = estado.perguntas[estado.indice].correta;
  const acertou = indiceEscolhido === correta;

  if (acertou) {
    estado.acertos++;
    estado.pontos += PONTOS_POR_ACERTO;
  }

  $('pontuacao').textContent = `⭐ ${estado.pontos} pontos`;

  $('alternativas').querySelectorAll('button').forEach((botao) => {
    const indice = Number(botao.dataset.indice);

    botao.disabled = true;

    if (indice === correta) {
      botao.classList.add('certa');
    } else if (indice === indiceEscolhido) {
      botao.classList.add('errada');
    }
  });

  $('feedback').textContent =
    indiceEscolhido === null
      ? '⏰ Tempo esgotado!'
      : acertou
        ? '🎉 Resposta correta! +10 pontos'
        : '❌ Resposta incorreta!';

  $('feedback').classList.add(acertou ? 'sucesso' : 'falha');

  $('progresso').setAttribute(
    'aria-valuenow', String(estado.indice + 1)
  );

  $('barra-progresso').style.width =
    `${((estado.indice + 1) / estado.perguntas.length) * 100}%`;

  $('proxima').textContent =
    estado.indice === estado.perguntas.length - 1
      ? 'Ver resultado 🏆'
      : 'Próxima pergunta →';

  $('proxima').classList.remove('oculto');
}

function avancar() {
  if (!estado.respondida) return;

  estado.indice++;

  if (estado.indice >= estado.perguntas.length) {
    finalizarQuiz();
  } else {
    exibirPergunta();
  }
}

function finalizarQuiz() {
  pararRelogio();

  const total = estado.perguntas.length;
  const percentual = Math.round((estado.acertos / total) * 100);

  $('mensagem-resultado').textContent =
    percentual === 100
      ? `Perfeito, ${estado.nome}! Você arrasou! 🌟`
      : percentual >= 60
        ? `Muito bem, ${estado.nome}! Continue assim! 🚀`
        : `Boa tentativa, ${estado.nome}! Que tal jogar de novo? 💪`;

  $('placar-final').textContent =
    `${estado.pontos} / ${total * PONTOS_POR_ACERTO} pontos`;

  $('detalhes-resultado').textContent =
    `Você acertou ${estado.acertos} de ${total} perguntas (${percentual}%).`;

  mostrarTela('resultado');
}

$('form-inicio').addEventListener('submit', iniciarQuiz);
$('proxima').addEventListener('click', avancar);

$('reiniciar').addEventListener('click', () => {
  pararRelogio();
  mostrarTela('inicio');
  $('nome').focus();
});
