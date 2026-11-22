/**
 * MakeYUP · Piksel Lab — Rehber (Eğitim & Etiket Dedektifi Quiz) Modülü
 */

import { GUIDE_LESSONS, GUIDE_QUIZ } from "./data/guide.js";
import { pixelSVG } from "./pixel.js";

const PROGRESS_KEY = "makeyup-guide-progress";

function readCompleted() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeCompleted(ids) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
  } catch {
    // sessiz geç
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function initGuide({ onTryAnalyzer } = {}) {
  const progressEl = document.getElementById("guideProgress");
  const lessonsEl = document.getElementById("guideLessons");
  const quizEl = document.getElementById("guideQuiz");
  if (!progressEl || !lessonsEl || !quizEl) return;

  let completedIds = readCompleted();
  let quizIndex = 0;
  let quizScore = 0;
  let selectedOption = null;
  let quizFinished = false;

  function renderProgress() {
    const total = GUIDE_LESSONS.length;
    const done = GUIDE_LESSONS.filter((l) => completedIds.includes(l.id)).length;
    const blocksTotal = 16;
    const filledBlocks = Math.round((done / total) * blocksTotal);

    const blocksHtml = Array.from({ length: blocksTotal }, (_, idx) => {
      const isFilled = idx < filledBlocks;
      return `<span class="px-prog-cell ${isFilled ? "is-on" : ""}"></span>`;
    }).join("");

    const allDone = done === total;

    progressEl.innerHTML = `
      <div class="guide-progress-card px-shadow">
        <div class="guide-progress-top">
          <div class="guide-progress-title">
            ${pixelSVG(allDone ? "star" : "book", { size: 28 })}
            <div>
              <strong>İlerleme: ${done} / ${total} ders tamamlandı</strong>
              <span>${
                allDone
                  ? "Tebrikler! Artık Etiket Dedektifi rozetini kazandın."
                  : "Her dersi okudukça \"Okudum\" butonuna bas; zararlı içerikleri kendin ayırt etmeyi öğren."
              }</span>
            </div>
          </div>
          ${
            allDone
              ? `<span class="px-badge px-badge--mint">${pixelSVG("shield", { size: 16 })} Etiket Dedektifi</span>`
              : `<span class="px-badge">${Math.round((done / total) * 100)}%</span>`
          }
        </div>
        <div class="px-prog-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="Rehber ilerleme durumu">
          ${blocksHtml}
        </div>
      </div>
    `;
  }

  function renderLessons() {
    lessonsEl.innerHTML = GUIDE_LESSONS.map((lesson, idx) => {
      const isDone = completedIds.includes(lesson.id);
      return `
        <article class="guide-lesson-card ${isDone ? "is-done" : ""}">
          <div class="guide-lesson-head">
            <div class="guide-lesson-icon">
              ${pixelSVG(lesson.sprite, { size: 32 })}
            </div>
            <div class="guide-lesson-titles">
              <span class="px-badge">Ders 0${idx + 1}</span>
              <h3>${escapeHtml(lesson.title)}</h3>
              <p>${escapeHtml(lesson.subtitle)}</p>
            </div>
          </div>

          <ul class="guide-bullets">
            ${lesson.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>

          <div class="guide-tip-box">
            <strong>Nasıl tanırsın?</strong>
            <p>${escapeHtml(lesson.tip)}</p>
          </div>

          <div class="guide-sample-row">
            <code>${escapeHtml(lesson.sampleInci)}</code>
          </div>

          <div class="guide-lesson-actions">
            <button
              type="button"
              class="btn btn-sm ${isDone ? "btn-outline" : "btn-primary"}"
              data-guide-done="${escapeHtml(lesson.id)}"
              aria-pressed="${isDone}"
            >
              ${isDone ? `${pixelSVG("check", { size: 16 })} Okundu (Geri al)` : `${pixelSVG("check", { size: 16 })} Okudum`}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              data-guide-try="${escapeHtml(lesson.sampleInci)}"
            >
              Analizörde Dene →
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderQuiz() {
    if (quizFinished) {
      const starsHtml = Array.from({ length: GUIDE_QUIZ.length }, (_, i) =>
        `<span class="quiz-star ${i < quizScore ? "is-earned" : "is-dim"}">${pixelSVG("star", { size: 28 })}</span>`
      ).join("");

      const lastInci = GUIDE_QUIZ[GUIDE_QUIZ.length - 1].inci;

      quizEl.innerHTML = `
        <div class="guide-quiz-card px-shadow">
          <div class="guide-quiz-result">
            <div class="quiz-stars-row">${starsHtml}</div>
            <h3>Etiket Dedektifi Testi Tamamlandı!</h3>
            <p class="quiz-score-line">Skorun: <strong>${quizScore} / ${GUIDE_QUIZ.length}</strong></p>
            <p class="quiz-result-note">${
              quizScore >= 5
                ? "Harika! Kırmızı ve sarı bayrakları, hayvansal pigmentleri ve yanıltıcı terimleri kolayca yakalıyorsun."
                : "İyi başlangıç! Yukarıdaki kırmızı/sarı bayrak derslerine göz atıp testi tekrar çözebilirsin."
            }</p>
            <div class="guide-quiz-btns">
              <button type="button" id="quizRestartBtn" class="btn btn-primary">Tekrar oyna</button>
              <button type="button" class="btn btn-outline" data-guide-try="${escapeHtml(lastInci)}">Kendi ürününü analiz et</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const q = GUIDE_QUIZ[quizIndex];
    const hasAnswered = selectedOption !== null;
    const isCorrect = selectedOption === q.correctIndex;

    quizEl.innerHTML = `
      <div class="guide-quiz-card px-shadow">
        <div class="guide-quiz-head">
          <div class="guide-quiz-badge-row">
            ${pixelSVG("yupi", { size: 32 })}
            <div>
              <span class="px-badge px-badge--pink">Etiket Dedektifi Testi</span>
              <h3>Soru ${quizIndex + 1} / ${GUIDE_QUIZ.length}</h3>
            </div>
          </div>
          <span class="px-badge">Puan: ${quizScore}</span>
        </div>

        <p class="guide-quiz-q">${escapeHtml(q.question)}</p>

        <div class="guide-sample-row">
          <span>Örnek Etiket:</span>
          <code>${escapeHtml(q.inci)}</code>
        </div>

        <div class="guide-quiz-options">
          ${q.options
            .map((opt, idx) => {
              let cls = "quiz-opt";
              if (hasAnswered) {
                if (idx === q.correctIndex) cls += " is-correct";
                else if (idx === selectedOption) cls += " is-wrong";
              }
              return `
                <button type="button" class="${cls}" data-quiz-opt="${idx}" ${hasAnswered ? "disabled" : ""}>
                  <span class="quiz-opt-key">${String.fromCharCode(65 + idx)}</span>
                  <span>${escapeHtml(opt)}</span>
                </button>
              `;
            })
            .join("")}
        </div>

        ${
          hasAnswered
            ? `
            <div class="quiz-feedback ${isCorrect ? "is-correct" : "is-wrong"}">
              <strong>${isCorrect ? "Doğru bildin!" : "Dikkat — doğru cevap işaretlendi"}</strong>
              <p>${escapeHtml(q.explanation)}</p>
              <div class="guide-quiz-btns">
                <button type="button" id="quizNextBtn" class="btn btn-primary btn-sm">
                  ${quizIndex + 1 < GUIDE_QUIZ.length ? "Sonraki soru →" : "Sonucu gör"}
                </button>
                <button type="button" class="btn btn-outline btn-sm" data-guide-try="${escapeHtml(q.inci)}">
                  Kendi ürününü analiz et
                </button>
              </div>
            </div>
          `
            : ""
        }
      </div>
    `;
  }

  lessonsEl.addEventListener("click", (e) => {
    const doneBtn = e.target.closest("[data-guide-done]");
    if (doneBtn) {
      const id = doneBtn.dataset.guideDone;
      if (completedIds.includes(id)) {
        completedIds = completedIds.filter((x) => x !== id);
      } else {
        completedIds = [...completedIds, id];
      }
      writeCompleted(completedIds);
      renderProgress();
      renderLessons();
      return;
    }

    const tryBtn = e.target.closest("[data-guide-try]");
    if (tryBtn) {
      onTryAnalyzer?.(tryBtn.dataset.guideTry);
    }
  });

  quizEl.addEventListener("click", (e) => {
    const optBtn = e.target.closest("[data-quiz-opt]");
    if (optBtn && selectedOption === null) {
      const idx = Number(optBtn.dataset.quizOpt);
      selectedOption = idx;
      if (idx === GUIDE_QUIZ[quizIndex].correctIndex) {
        quizScore += 1;
      }
      renderQuiz();
      return;
    }

    if (e.target.closest("#quizNextBtn")) {
      if (quizIndex + 1 < GUIDE_QUIZ.length) {
        quizIndex += 1;
        selectedOption = null;
      } else {
        quizFinished = true;
      }
      renderQuiz();
      return;
    }

    if (e.target.closest("#quizRestartBtn")) {
      quizIndex = 0;
      quizScore = 0;
      selectedOption = null;
      quizFinished = false;
      renderQuiz();
      return;
    }

    const tryBtn = e.target.closest("[data-guide-try]");
    if (tryBtn) {
      onTryAnalyzer?.(tryBtn.dataset.guideTry);
    }
  });

  renderProgress();
  renderLessons();
  renderQuiz();
}
