/* A four-beat explanation; all geometry is explicitly illustrative. */
(() => {
  'use strict';
  const figure = document.querySelector('#method-insight');
  if (!figure) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const playback = figure.querySelector('.mi-playback');
  const steps = [...figure.querySelectorAll('[data-mi-step]')];
  const caption = figure.querySelector('.mi-caption-text');
  const captionLabel = figure.querySelector('.mi-caption-label');
  const mh = figure.querySelector('.mi-mh');
  const outcomes = [...figure.querySelectorAll('[data-mi-outcome]')];
  const copy = [
    ['Evaluate', 'Simulate candidate controls and retain their costs. Accepted and rejected proposals both contribute to the archive.'],
    ['Recover', 'Fit a local quadratic surrogate to archived evaluations. Its gradient supplies a direction without differentiating through the simulator.'],
    ['Guide', 'Combine surrogate-gradient guidance with stochastic exploration to propose new candidate controls.'],
    ['Correct & reuse', 'MH either moves the particle to the proposal or keeps its current state. In both cases, the new evaluation informs the next fit.']
  ];
  const durations = [4200, 4200, 4200, 8800];
  let step = motion.matches || location.hash === '#mh-correction' ? 3 : 0;
  let userPaused = motion.matches;
  let visible = false;
  let elapsed = 0;
  let lastTime = null;
  let frame = null;
  let selectedOutcome = motion.matches ? 'both' : null;
  let outcomeManuallyChosen = false;

  function updateOutcome() {
    const outcome = step === 3
      ? selectedOutcome || (elapsed < 4400 ? 'accept' : 'reject')
      : 'both';
    if (mh.dataset.outcome !== outcome) {
      mh.dataset.outcome = outcome;
      outcomes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.miOutcome === outcome)));
    }
    // One clock drives both the step and its geometry, so pause/offscreen resume
    // cannot restart a CSS animation midway through an acceptance example.
    const t = outcomeManuallyChosen ? 1 : (elapsed % 4400) / 4400;
    const clamp = value => Math.min(1, Math.max(0, value));
    mh.style.setProperty('--mh-move-x', `${145 * clamp((t - 0.16) / 0.34)}px`);
    mh.style.setProperty('--mh-token-x', `${38 * clamp((t - 0.58) / 0.30)}px`);
    mh.style.setProperty('--mh-token-opacity', String(t < 0.58 ? 0 : t < 0.9 ? 1 : clamp((1 - t) / 0.1)));
    mh.style.setProperty('--mh-ring-width', String(1 + 2 * Math.sin(Math.PI * clamp((t - 0.2) / 0.5))));
  }

  function render() {
    figure.dataset.step = String(step);
    steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === step)));
    [captionLabel.textContent, caption.textContent] = copy[step];
    figure.style.setProperty('--mi-progress', userPaused ? '1' : String(elapsed / durations[step]));
    updateOutcome();
  }

  function tick(time) {
    frame = null;
    if (lastTime !== null) elapsed += Math.min(time - lastTime, 100);
    lastTime = time;
    if (elapsed >= durations[step]) {
      elapsed %= durations[step];
      step = (step + 1) % copy.length;
      selectedOutcome = null;
      outcomeManuallyChosen = false;
      render();
    }
    figure.style.setProperty('--mi-progress', String(elapsed / durations[step]));
    updateOutcome();
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const running = visible && !userPaused && !document.hidden;
    figure.classList.toggle('is-playing', running);
    playback.setAttribute('aria-pressed', String(userPaused));
    playback.querySelector('.mi-playback-icon').textContent = userPaused ? '▶' : 'Ⅱ';
    playback.querySelector('.mi-playback-label').textContent = userPaused ? 'Play animation' : 'Pause animation';
    if (running && frame === null) {
      lastTime = null;
      frame = requestAnimationFrame(tick);
    } else if (!running && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }
  }

  steps.forEach((button, index) => button.addEventListener('click', () => {
    step = index;
    elapsed = 0;
    userPaused = true;
    selectedOutcome = index === 3 ? 'both' : null;
    outcomeManuallyChosen = false;
    render();
    sync();
  }));
  outcomes.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      step = 3;
      selectedOutcome = button.dataset.miOutcome;
      outcomeManuallyChosen = true;
      elapsed = selectedOutcome === 'accept' ? 0 : 4400;
      userPaused = true;
      render();
      sync();
    });
  });
  playback.addEventListener('click', () => {
    userPaused = !userPaused;
    // A running explanation resumes from the chosen example.
    if (!userPaused) {
      selectedOutcome = null;
      outcomeManuallyChosen = false;
    }
    render();
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => {
    userPaused = motion.matches;
    if (motion.matches) step = 3;
    selectedOutcome = motion.matches ? 'both' : null;
    outcomeManuallyChosen = false;
    elapsed = 0;
    render();
    sync();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, {threshold: 0.08}).observe(figure);

  figure.classList.add('is-enhanced');
  figure.querySelector('.mi-controls').hidden = false;
  playback.hidden = false;
  render();
})();
