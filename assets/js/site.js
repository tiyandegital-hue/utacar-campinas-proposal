/* UtaCar — single source of truth for business details.
   Change values here ONLY; every page reads from this constant. */
const UTACAR = {
  name: "UtaCar Oficina Mecânica",
  short: "UTACAR",
  tagline: "Oficina Mecânica • Campinas/SP",
  address: "Rua Joaquim Vilac, 129 — Vila Teixeira, Campinas/SP — CEP 13032-385",
  addressShort: "Rua Joaquim Vilac, 129 — Vila Teixeira, Campinas/SP",
  mapsQuery: "Rua Joaquim Vilac, 129, Vila Teixeira, Campinas, SP, 13032-385",
  phoneTollFree: "0800 606 9136",
  phoneTollFreeHref: "tel:08006069136",
  whatsappDisplay: "(19) 99934-3900",
  whatsappNumber: "5519999343900",
  hours: "Horário de funcionamento — confirmar por WhatsApp",
  year: 2026
};
UTACAR.waLink = (text) =>
  "https://wa.me/" + UTACAR.whatsappNumber + (text ? "?text=" + encodeURIComponent(text) : "");
UTACAR.mapsLink = () =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(UTACAR.mapsQuery);

/* Fill every [data-cfg] element from the constant (defaults already in HTML). */
function fillBusiness() {
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const key = el.getAttribute("data-cfg");
    if (key === "waLink") { el.href = UTACAR.waLink(el.dataset.waText || ""); return; }
    if (key === "mapsLink") { el.href = UTACAR.mapsLink(); return; }
    if (key === "telLink") { el.href = UTACAR.phoneTollFreeHref; return; }
    if (UTACAR[key] !== undefined) el.textContent = UTACAR[key];
  });
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = UTACAR.waLink(el.getAttribute("data-wa"));
  });
}

/* Mobile nav */
function initNav() {
  const btn = document.querySelector(".burger");
  const nav = document.querySelector("nav.main");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => nav.classList.remove("open")));
}

/* FAQ accordions */
function initFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
}

/* ---------------- WhatsApp quote-bot mock ----------------
   4 steps: 1 sintoma -> 2 foto -> 3 faixa de preço -> 4 agendar.
   Chat strings are verbatim from the Stitch export. All prices are
   estimates, marked "estimativa — confirmar após diagnóstico". */
const BOT = {
  symptoms: {
    freio: {
      label: "Barulho ao frear",
      user: "Barulho metálico ao frear, principalmente em baixa velocidade.",
      botAck: "Entendido. Sintoma registrado: ruído metálico ao frear. Agora envie uma foto do disco ou da pastilha.",
      photo: "Freio dianteiro - disco com sulcos visíveis",
      diag: "Disco de freio dianteiro desgastado (sulcos e espessura abaixo do limite Bosch). Pastilhas com 2mm restantes.",
      range: "R$ 450,00 – R$ 680,00",
      items: "Pastilhas de freio dianteiras + disco (par) • 2 itens • Estimativa inicial"
    },
    painel: {
      label: "Luz no painel",
      user: "Acendeu uma luz de advertência no painel.",
      botAck: "Entendido. Sintoma registrado: luz de advertência no painel. Agora envie uma foto do painel aceso.",
      photo: "Painel de instrumentos - luz de advertência acesa",
      diag: "Luz de advertência ativa — diagnóstico eletrônico necessário para identificar o código de falha.",
      range: "R$ 150,00 – R$ 250,00",
      items: "Diagnóstico eletrônico Bosch KTS • Estimativa inicial"
    },
    vazamento: {
      label: "Vazamento",
      user: "Tem uma mancha de óleo no chão da garagem.",
      botAck: "Entendido. Sintoma registrado: possível vazamento. Agora envie uma foto da mancha e da região do motor.",
      photo: "Região do motor - vestígio de vazamento de óleo",
      diag: "Vestígio de vazamento na região do motor — origem exata só após inspeção no elevador.",
      range: "R$ 180,00 – R$ 450,00",
      items: "Inspeção no elevador + vedação • Estimativa inicial"
    },
    revisao: {
      label: "Revisão preventiva",
      user: "Quero fazer a revisão preventiva do meu carro.",
      botAck: "Perfeito. Revisão preventiva registrada. Envie uma foto do hodômetro ou da etiqueta da última revisão, se tiver.",
      photo: "Hodômetro - revisão dos 10.000 km",
      diag: "Revisão preventiva de 10.000 km — troca de óleo e filtro, inspeção de 21 itens.",
      range: "R$ 180,00 – R$ 260,00",
      items: "Troca de óleo e filtro (5W30 sintético) • Estimativa inicial"
    }
  },
  slots: ["Hoje — período da tarde", "Amanhã — manhã", "Amanhã — tarde", "Próxima semana — a combinar"]
};

function initBot() {
  const root = document.querySelector("[data-bot]");
  if (!root) return;
  const body = root.querySelector(".chat-body");
  const controls = root.querySelector(".chat-controls");
  const pill = root.querySelector(".step-pill");
  let step = 1, chosen = null;

  const scroll = () => { body.scrollTop = body.scrollHeight; };
  const setStep = (n) => { step = n; if (pill) pill.textContent = "PASSO " + n + " / 4"; };

  function addMsg(cls, html, tag) {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.innerHTML = (tag ? '<span class="tag' + (cls === "bot" ? " blue" : "") + '">' + tag + "</span>" : "") + html;
    body.appendChild(d); scroll();
    return d;
  }
  function typing(cb, delay) {
    const t = document.createElement("div");
    t.className = "msg bot typing"; t.setAttribute("aria-hidden", "true");
    t.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(t); scroll();
    setTimeout(() => { t.remove(); cb(); }, delay || 700);
  }
  function setControls(html) { controls.innerHTML = html; }
  function chipRow(label, items) {
    return '<span class="ctl-label">' + label + "</span><div class='chips'>" +
      items.map((it) => '<button type="button" class="chip" data-v="' + it.v + '">' + it.label + "</button>").join("") +
      "</div>";
  }

  /* Step 1 — symptom picker */
  function showStep1() {
    setStep(1);
    setControls(chipRow("1 · Escolha o sintoma", Object.entries(BOT.symptoms).map(([k, s]) => ({ v: k, label: s.label }))));
    controls.querySelectorAll(".chip").forEach((c) =>
      c.addEventListener("click", () => pickSymptom(c.dataset.v)));
  }
  function pickSymptom(key) {
    chosen = BOT.symptoms[key];
    controls.querySelectorAll(".chip").forEach((c) => { c.disabled = true; if (c.dataset.v === key) c.classList.add("sel"); });
    addMsg("user", chosen.user);
    typing(() => {
      addMsg("bot", chosen.botAck, "UtaCar Assistente");
      showStep2();
    });
  }

  /* Step 2 — photo (simulated) */
  function showStep2() {
    setStep(2);
    setControls(chipRow("2 · Envie a foto do problema",
      [{ v: "photo", label: "Enviar foto (simulação)" }]) +
      '<p style="margin-top:10px;font-size:13px;color:var(--muted)">Na conversa real, você envia a foto direto no WhatsApp.</p>');
    controls.querySelector(".chip").addEventListener("click", () => {
      controls.querySelector(".chip").disabled = true;
      addMsg("user", "Você enviou uma foto: " + chosen.photo);
      typing(() => {
        addMsg("bot",
          "<strong>DIAGNÓSTICO DETECTADO:</strong> " + chosen.diag,
          "Diagnóstico");
        showStep3();
      }, 900);
    });
  }

  /* Step 3 — price range (estimate only) */
  function showStep3() {
    setStep(3);
    setTimeout(() => {
      addMsg("bot",
        '<span class="tag">Faixa estimada</span><span class="price">' + chosen.range + "</span>" +
        "<small>" + chosen.items + "</small>" +
        "<small><strong>Estimativa — confirmar após diagnóstico.</strong> O valor final só é fechado com o carro no elevador, sem surpresa.</small>",
        "Orçamento");
      setControls(chipRow("3 · Faixa recebida — o que você quer fazer?",
        [{ v: "book", label: "Agendar revisão" }, { v: "wa", label: "Falar no WhatsApp" }]));
      controls.querySelectorAll(".chip").forEach((c) =>
        c.addEventListener("click", () => {
          if (c.dataset.v === "wa") {
            window.open(UTACAR.waLink("Olá! Quero um orçamento. Sintoma: " + chosen.label + ". Faixa estimada: " + chosen.range + "."), "_blank");
          } else {
            c.disabled = true;
            addMsg("user", "Quero agendar a revisão.");
            typing(() => { addMsg("bot", "Ótimo! Escolha o melhor período para você.", "Agendamento"); showStep4(); }, 600);
          }
        }));
    }, 500);
  }

  /* Step 4 — schedule */
  function showStep4() {
    setStep(4);
    setControls(chipRow("4 · Escolha o período",
      BOT.slots.map((s, i) => ({ v: String(i), label: s }))));
    controls.querySelectorAll(".chip").forEach((c) =>
      c.addEventListener("click", () => {
        const slot = BOT.slots[Number(c.dataset.v)];
        controls.querySelectorAll(".chip").forEach((x) => { x.disabled = true; if (x === c) x.classList.add("sel"); });
        addMsg("user", slot + ".");
        typing(() => {
          addMsg("sys", "AGENDAMENTO REGISTRADO — " + slot.toUpperCase() + " • Confirmação final pelo WhatsApp da oficina.");
          setControls(
            '<span class="ctl-label">Pronto! Confirme no WhatsApp da oficina:</span>' +
            '<a class="btn btn-green btn-block" data-wa="Olá! Fiz uma simulação de orçamento no site. Sintoma: ' + chosen.label + '. Faixa estimada: ' + chosen.range + '. Período: ' + slot + '. Pode confirmar o agendamento?">Confirmar no WhatsApp</a>' +
            '<p style="margin-top:10px;font-size:13px;color:var(--muted)"><a href="#" data-restart style="color:var(--yellow)">Fazer outra simulação</a></p>');
          controls.querySelectorAll("[data-wa]").forEach((el) => { el.href = UTACAR.waLink(el.getAttribute("data-wa")); });
          controls.querySelector("[data-restart]").addEventListener("click", (e) => {
            e.preventDefault();
            body.querySelectorAll(".msg.user, .msg.sys").forEach((m) => m.remove());
            const diag = body.querySelectorAll(".msg.bot");
            diag.forEach((m, i) => { if (i > 1) m.remove(); });
            showStep1();
          });
        }, 800);
      }));
  }

  showStep1();
}

/* Contact form -> WhatsApp deep link (no data stored on the site) */
function initForm() {
  const form = document.querySelector("form[data-wa-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const text = "Olá! Quero uma requisição técnica.\n" +
      "Nome: " + (f.get("nome") || "") + "\n" +
      "Telefone/WhatsApp: " + (f.get("telefone") || "") + "\n" +
      "Veículo: " + (f.get("veiculo") || "") + "\n" +
      "Sintoma ou serviço: " + (f.get("sintoma") || "");
    window.open(UTACAR.waLink(text), "_blank");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fillBusiness();
  initNav();
  initFaq();
  initBot();
  initForm();
});
