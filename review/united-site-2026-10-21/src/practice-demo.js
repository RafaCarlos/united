(() => {
  const demo = document.querySelector('[data-practice-demo]');
  if (!demo) return;
  const $ = (selector) => demo.querySelector(selector);
  const intro = $('[data-demo-intro]');
  const exercise = $('[data-demo-exercise]');
  const complete = $('[data-demo-complete]');
  const start = $('[data-demo-start]');
  const prompt = $('[data-demo-prompt]');
  const choices = $('[data-demo-choices]');
  const check = $('[data-demo-check]');
  const next = $('[data-demo-next]');
  const feedback = $('[data-demo-feedback]');
  const steps = [
    {
      prompt: 'What would you like to order?',
      helper: 'O garçom pergunta o que você gostaria de pedir. Escolha uma resposta.',
      options: ["I’d like the pasta, please.", 'The restaurant is on Main Street.', 'The table is next to the window.'],
      correct: 0,
      hints: ['', 'Essa frase informa onde fica o restaurante. Para fazer o pedido, procure a expressão “I’d like”.', 'Essa frase indica onde está a mesa. Para dizer o que gostaria de pedir, use “I’d like”.'],
      explanation: 'Isso! “I’d like” significa “eu gostaria de”. É uma maneira educada de fazer um pedido.'
    },
    {
      prompt: 'Would you like anything to drink?',
      helper: 'Agora, escolha uma bebida para acompanhar o pedido.',
      options: ['Could we have the bill, please?', 'Still water, please.', 'A table for two, please.'],
      correct: 1,
      hints: ['Essa frase pede a conta. A pergunta é sobre uma bebida; “still water” é água sem gás.', '', 'Essa frase pede uma mesa para duas pessoas. Para a bebida, experimente “still water”.'],
      explanation: 'Muito bem! “Still water” é água sem gás. Para pedir água com gás, você pode dizer “sparkling water”.'
    },
    {
      prompt: 'How is everything?',
      helper: 'Durante o jantar, o garçom pergunta se está tudo bem. Como você elogiaria a comida?',
      options: ['We have a reservation.', 'Could we see the menu?', 'It’s delicious, thank you.'],
      correct: 2,
      hints: ['“We have a reservation” informa que vocês têm uma reserva. Procure a resposta que elogia a comida.', 'Essa frase pede o cardápio. Para elogiar o prato, você pode usar “delicious”.', ''],
      explanation: 'Perfeito! “It’s delicious, thank you” significa “está delicioso, obrigado(a)”. Você respondeu e agradeceu com naturalidade.'
    }
  ];
  let step = 0;
  let answered = false;

  function renderStep() {
    answered = false;
    const item = steps[step];
    $('[data-demo-step]').textContent = `Conversa ${step + 1} de ${steps.length}`;
    demo.querySelectorAll('[data-progress-step]').forEach((el, i) => {
      el.toggleAttribute('data-current', i === step);
      el.toggleAttribute('data-complete', i < step);
    });
    prompt.textContent = item.prompt;
    $('[data-demo-helper]').textContent = item.helper;
    choices.replaceChildren();
    item.options.forEach((text, i) => {
      const label = document.createElement('label');
      label.className = 'demo-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'demo-answer';
      radio.value = String(i);
      const phrase = document.createElement('span');
      phrase.lang = 'en';
      phrase.textContent = text;
      label.append(radio, phrase);
      choices.append(label);
    });
    feedback.textContent = '';
    feedback.removeAttribute('data-correct');
    check.hidden = false;
    check.disabled = true;
    next.hidden = true;
    next.textContent = step === steps.length - 1 ? 'Concluir a conversa' : 'Continuar a conversa';
    prompt.focus({ preventScroll: true });
    demo.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  function begin() {
    step = 0;
    intro.hidden = true;
    complete.hidden = true;
    exercise.hidden = false;
    demo.setAttribute('data-active', '');
    demo.dataset.state = 'exercise';
    const recap = $('.demo-recap-details');
    if (recap) recap.open = false;
    renderStep();
  }

  start.hidden = false;
  start.addEventListener('click', begin);
  $('[data-demo-restart]').addEventListener('click', begin);
  $('[data-demo-exit]').addEventListener('click', () => {
    exercise.hidden = true;
    complete.hidden = true;
    intro.hidden = false;
    demo.removeAttribute('data-active');
    demo.dataset.state = 'intro';
    start.focus({ preventScroll: true });
    demo.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  choices.addEventListener('change', () => {
    if (answered) return;
    check.disabled = false;
    feedback.textContent = '';
    choices.querySelectorAll('[data-answer]').forEach(el => el.removeAttribute('data-answer'));
  });
  $('[data-demo-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    if (answered) return;
    const selected = choices.querySelector('input:checked');
    if (!selected) return;
    const item = steps[step];
    if (Number(selected.value) !== item.correct) {
      selected.parentElement.dataset.answer = 'incorrect';
      feedback.textContent = `Vamos tentar outra resposta. ${item.hints[Number(selected.value)]}`;
      return;
    }
    answered = true;
    selected.parentElement.dataset.answer = 'correct';
    const mark = document.createElement('span');
    mark.className = 'demo-option-mark';
    mark.textContent = '✓ Correta';
    selected.parentElement.append(mark);
    choices.querySelectorAll('input').forEach(input => { input.disabled = true; });
    feedback.textContent = item.explanation;
    feedback.setAttribute('data-correct', '');
    check.hidden = true;
    next.hidden = false;
    next.focus({ preventScroll: true });
  });
  next.addEventListener('click', () => {
    if (!answered) return;
    step += 1;
    if (step < steps.length) return renderStep();
    exercise.hidden = true;
    complete.hidden = false;
    demo.dataset.state = 'complete';
    $('[data-demo-complete-title]').focus({ preventScroll: true });
    demo.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
})();
