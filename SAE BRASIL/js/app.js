(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Active nav link on scroll ---------- */
  var navAnchors = document.querySelectorAll("[data-nav]");
  var sections = [];
  navAnchors.forEach(function (a) {
    var id = a.getAttribute("href");
    var el = id && document.querySelector(id);
    if (el) sections.push({ link: a, el: el });
  });
  if (sections.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.find(function (s) {
            return s.el === entry.target;
          });
          if (!match) return;
          if (entry.isIntersecting) {
            sections.forEach(function (s) {
              s.link.classList.remove("is-active");
            });
            match.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    sections.forEach(function (s) {
      io.observe(s.el);
    });
  }

  /* ---------- Generic pill/tab switcher ---------- */
  function initTabs(tabBarId) {
    var bar = document.getElementById(tabBarId);
    if (!bar) return;
    var tabs = bar.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        tabs.forEach(function (t) {
          t.classList.remove("is-active");
        });
        tab.classList.add("is-active");
        var container = bar.parentElement;
        container.querySelectorAll(".tab-panel").forEach(function (panel) {
          panel.classList.toggle(
            "is-active",
            panel.getAttribute("data-panel") === target,
          );
        });
      });
    });
  }
  initTabs("mecTabs");
  initTabs("dadosTabs");

  /* ---------- System pills above the 3D prototype ---------- */
  var systemPills = document.getElementById("systemPills");
  var howTitle = document.getElementById("howTitle");
  var howText = document.getElementById("howText");
  var howFlow = document.getElementById("howFlow");

  var systemCopy = {
    completo: {
      title: "Visão geral do veículo",
      text: "O protótipo é montado como uma gaiola tubular sobre a qual se apoiam suspensão, motor, transmissão e a eletrônica embarcada. Use os botões acima do modelo para isolar cada sistema e o toggle “Vista explodida” para separar os conjuntos no espaço.",
      flow: ["Chassi", "→", "Suspensão", "→", "Motor + CVT", "→", "Eletrônica"],
    },
    chassi: {
      title: "Chassi — a base de tudo",
      text: "A gaiola tubular protege o piloto e dá rigidez ao conjunto. Todos os demais sistemas — suspensão, motor, transmissão e eletrônica — são fixados diretamente na sua estrutura, distribuindo cargas de impacto e torção pelo veículo inteiro.",
      flow: [
        "Estrutura principal",
        "→",
        "Proteção frontal/lateral",
        "→",
        "Suportes dos subsistemas",
      ],
    },
    suspensao: {
      title: "Suspensão — contato com o terreno",
      text: "Braços duplo A independentes em cada roda absorvem impactos e mantêm o pneu no chão mesmo em terreno irregular. O curso vertical generoso reduz a vibração transmitida ao chassi e melhora a estabilidade em curva.",
      flow: ["Roda", "→", "Braços duplo A", "→", "Amortecedor", "→", "Chassi"],
    },
    motor: {
      title: "Motor + CVT — potência sob controle",
      text: "O motor entrega potência à polia primária da CVT, que ajusta continuamente a relação de transmissão conforme rotação, carga e velocidade. A transmissão final por corrente leva essa força até o eixo e o diferencial traseiro.",
      flow: [
        "Motor",
        "→",
        "CVT",
        "→",
        "Transmissão final",
        "→",
        "Eixo / diferencial",
        "→",
        "Rodas",
      ],
    },
    eletronica: {
      title: "Eletrônica — sentidos e memória do veículo",
      text: "O ESP32-S3 lê os sensores (RPM, IMU, GNSS, temperatura, direção), grava tudo no cartão microSD e envia dados por telemetria — sem nunca interferir nos circuitos de segurança, que operam de forma independente do firmware.",
      flow: [
        "Sensores",
        "→",
        "ESP32-S3",
        "→",
        "Display / microSD / Telemetria",
      ],
    },
  };

  function renderSystem(name) {
    var data = systemCopy[name] || systemCopy.completo;
    if (howTitle) howTitle.textContent = data.title;
    if (howText) howText.textContent = data.text;
    if (howFlow) {
      howFlow.innerHTML = "";
      data.flow.forEach(function (piece) {
        var el = document.createElement(piece === "→" ? "i" : "span");
        el.textContent = piece;
        howFlow.appendChild(el);
      });
    }
  }

  if (systemPills) {
    var pills = systemPills.querySelectorAll(".pill");
    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) {
          p.classList.remove("is-active");
        });
        pill.classList.add("is-active");
        var system = pill.getAttribute("data-system");
        renderSystem(system);
        window.dispatchEvent(
          new CustomEvent("baja:system", { detail: system }),
        );
      });
    });
  }

  /* ---------- Explode / rotate toggles ---------- */
  var explodeToggle = document.getElementById("explodeToggle");
  if (explodeToggle) {
    explodeToggle.addEventListener("click", function () {
      var active = explodeToggle.getAttribute("data-active") === "true";
      explodeToggle.setAttribute("data-active", active ? "false" : "true");
      window.dispatchEvent(
        new CustomEvent("baja:explode", { detail: !active }),
      );
    });
  }
  var rotateToggle = document.getElementById("rotateToggle");
  if (rotateToggle) {
    rotateToggle.addEventListener("click", function () {
      var active = rotateToggle.getAttribute("data-active") === "true";
      rotateToggle.setAttribute("data-active", active ? "false" : "true");
      window.dispatchEvent(
        new CustomEvent("baja:autorotate", { detail: !active }),
      );
    });
  }

  /* Hide the "carregando protótipo" label once the scene signals it's ready */
  window.addEventListener("baja:ready", function () {
    var loading = document.getElementById("visualLoading");
    if (loading) {
      loading.style.opacity = "0";
      setTimeout(function () {
        loading.style.display = "none";
      }, 400);
    }
  });

  /* ---------- Regras SAE: monitoring switch + timestamp ---------- */
  var autoSwitch = document.getElementById("autoMonitorSwitch");
  if (autoSwitch) {
    autoSwitch.addEventListener("click", function () {
      var active = autoSwitch.getAttribute("data-active") === "true";
      autoSwitch.setAttribute("data-active", active ? "false" : "true");
    });
  }
  var lastCheck = document.getElementById("lastCheck");
  if (lastCheck) {
    var now = new Date();
    var formatted =
      now.toLocaleDateString("pt-BR") +
      " · " +
      now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    lastCheck.textContent = "Última verificação: " + formatted;
  }

  /* ---------- Simulated live telemetry gauges ---------- */
  var telemetry = {
    rpm: {
      el: document.getElementById("gaugeRpmVal"),
      ring: document.getElementById("gaugeRpm"),
      val: 3820,
      min: 1200,
      max: 6800,
      unit: "",
    },
    speed: {
      el: document.getElementById("gaugeSpeedVal"),
      ring: document.getElementById("gaugeSpeed"),
      val: 28,
      min: 0,
      max: 70,
      unit: "",
    },
    batt: {
      el: document.getElementById("gaugeBattVal"),
      ring: document.getElementById("gaugeBatt"),
      val: 12.6,
      min: 10,
      max: 14,
      unit: "",
    },
  };
  var tempMotorEl = document.getElementById("tempMotor");
  var tempCvtEl = document.getElementById("tempCvt");
  var inclinacaoEl = document.getElementById("inclinacao");

  function jitter(v, min, max, step) {
    var next = v + (Math.random() - 0.5) * step;
    return Math.min(max, Math.max(min, next));
  }

  function updateGauge(key, decimals) {
    var t = telemetry[key];
    if (!t.el) return;
    t.val = jitter(t.val, t.min, t.max, (t.max - t.min) * 0.03);
    t.el.textContent = t.val.toFixed(decimals);
    var pct = ((t.val - t.min) / (t.max - t.min)) * 100;
    if (t.ring) t.ring.style.setProperty("--val", pct.toFixed(1));
  }

  var telemetryRunning = true;
  var telemetryTimer = setInterval(function () {
    if (!telemetryRunning) return;
    updateGauge("rpm", 0);
    updateGauge("speed", 0);
    updateGauge("batt", 1);
    if (tempMotorEl)
      tempMotorEl.textContent = Math.round(jitter(82, 74, 92, 3)) + "°C";
    if (tempCvtEl)
      tempCvtEl.textContent = Math.round(jitter(68, 60, 78, 3)) + "°C";
    if (inclinacaoEl)
      inclinacaoEl.textContent = Math.round(jitter(12, 2, 22, 4)) + "°";
  }, 1600);

  // Pause the simulated telemetry loop when its panel isn't visible/in view.
  var telemetryPanel = document.querySelector(".telemetry-live");
  if (telemetryPanel && "IntersectionObserver" in window) {
    var telIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        telemetryRunning = entry.isIntersecting;
      });
    });
    telIo.observe(telemetryPanel);
  }
  window.addEventListener("beforeunload", function () {
    clearInterval(telemetryTimer);
  });
})();
