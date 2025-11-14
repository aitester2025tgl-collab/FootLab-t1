// data/unemployed_coaches_2025_26.js
// Pool of available/unemployed coaches that can be offered jobs when clubs fire their coaches.

window.UNEMPLOYED_COACHES = window.UNEMPLOYED_COACHES || [];

(function(){
  const list = [
    'Jürgen Klopp',
    'Zinedine Zidane',
    'Thomas Tuchel',
    'Xavi Hernández',
    'Sérgio Conceição'
  ];

  list.forEach(n => { if (!window.UNEMPLOYED_COACHES.includes(n)) window.UNEMPLOYED_COACHES.push(n); });
})();
