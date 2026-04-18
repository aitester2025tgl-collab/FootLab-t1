// data/unemployed_coaches_2025_26.js
// Pool of available/unemployed coaches that can be offered jobs when clubs fire their coaches.

window.UNEMPLOYED_COACHES = window.UNEMPLOYED_COACHES || [];

(function () {
  const list = [
    { name: 'Jürgen Klopp', reputation: 98 },
    { name: 'Zinedine Zidane', reputation: 96 },
    { name: 'Massimiliano Allegri', reputation: 89 },
    { name: 'Xavi Hernández', reputation: 88 },
    { name: 'Sérgio Conceição', reputation: 87 },
    { name: 'Thomas Tuchel', reputation: 86 },
    { name: 'Maurizio Sarri', reputation: 85 },
    { name: 'Gareth Southgate', reputation: 84 },
    { name: 'Joachim Löw', reputation: 83 },
    { name: 'Graham Potter', reputation: 82 },
    { name: 'Leonardo Jardim', reputation: 81 },
    { name: 'Frank Lampard', reputation: 80 },
    { name: 'Jorge Sampaoli', reputation: 80 },
    { name: 'Carlos Carvalhal', reputation: 79 },
    { name: 'Rui Vitória', reputation: 78 },
    { name: 'Ruud van Nistelrooy', reputation: 77 },
    { name: 'Quique Setién', reputation: 75 },
    { name: 'Pepa', reputation: 73 },
    { name: 'Jorge Costa', reputation: 72 },
    { name: 'Vítor Campelos', reputation: 70 },
    { name: 'Álvaro Pacheco', reputation: 68 },
    { name: 'Petit', reputation: 67 },
    { name: 'José Mota', reputation: 65 },
    { name: 'João de Deus', reputation: 63 },
    { name: 'Tulipa', reputation: 60 },
    { name: 'Ricardo Chéu', reputation: 58 },
    { name: 'Lito Vidigal', reputation: 55 },
    { name: 'Daúto Faquirá', reputation: 52 },
    { name: 'Filipe Rocha', reputation: 50 },
    { name: 'Manuel Machado', reputation: 48 },
    { name: 'Vítor Paneira', reputation: 45 },
    { name: 'Jorge Paixão', reputation: 42 },
    { name: 'Costinha', reputation: 40 }
  ];

  list.forEach((c) => {
    if (!window.UNEMPLOYED_COACHES.find(x => x.name === c.name)) {
      window.UNEMPLOYED_COACHES.push(c);
    }
  });
})();
