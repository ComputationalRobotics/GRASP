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
  const copy = [
    ['Evaluate', 'Simulate candidate controls and retain their costs. Accepted and rejected proposals both contribute to the archive.'],
    ['Recover', 'Fit a local quadratic surrogate to archived evaluations. Its gradient supplies a direction without differentiating through the simulator.'],
    ['Guide', 'Combine surrogate-gradient guidance with stochastic exploration to propose new candidate controls.'],
    ['Correct & reuse', 'Evaluate proposals in the simulator and apply MH correction. Add their control–cost pairs to the archive for the next fit.']
  ];
  const duration = 4200;
  let step = motion.matches ? 3 : 0;
  let userPaused = motion.matches;
  let visible = false;
  let elapsed = 0;
  let lastTime = null;
  let frame = null;

  function render() {
    figure.dataset.step = String(step);
    steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === step)));
    [captionLabel.textContent, caption.textContent] = copy[step];
    figure.style.setProperty('--mi-progress', userPaused ? '1' : String(elapsed / duration));
  }

  function tick(time) {
    frame = null;
    if (lastTime !== null) elapsed += Math.min(time - lastTime, 100);
    lastTime = time;
    if (elapsed >= duration) {
      elapsed %= duration;
      step = (step + 1) % copy.length;
      render();
    }
    figure.style.setProperty('--mi-progress', String(elapsed / duration));
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
    render();
    sync();
  }));
  playback.addEventListener('click', () => {
    userPaused = !userPaused;
    render();
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', () => {
    userPaused = motion.matches;
    if (motion.matches) step = 3;
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
