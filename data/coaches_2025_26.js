// data/coaches_2025_26.js
// Placeholder coach assignments for the imported teams (2025-26).
// These are generated/selected names and should be confirmed or replaced by actual names if you prefer.

window.REAL_COACHES = window.REAL_COACHES || {};

(function(){
  function set(name, coach) { window.REAL_COACHES[name] = coach; }

  // Teams we imported / confirmed (Spanish clubs and a few others from earlier imports)
  set('Atletico de Madrid', 'Diego Simeone');
  set('Athletic Club', 'Ernesto Valverde');
  set('FC Villarreal', 'Marcelino');
  set('Real Sociedad', 'Sergio Francisco');
  set('Real Betis', 'Manuel Pellegrini');
  set('Valencia CF', 'Carlos Corberán');
  set('Girona FC', 'Míchel');
  set('Celta de Vigo', 'Claudio Giráldez');
  set('Sevilla FC', 'Matías Almeyda');
  set('RCD Espanyol', 'Manolo González');
  set('CA Osasuna', 'Alessio Lisci');
  set('Rayo Vallecano', 'Iñigo Pérez');
  set('Levante UD', 'Julián Calero');
  set('RCD Mallorca', 'Jagoba Arrasate');
  set('Elche CF', 'Eder Sarabia');
  set('Deportivo Alavés', 'Eduardo Coudet');
  set('Getafe FC', 'José Bordalás');
  set('Real Oviedo', 'Veljko Paunović');
  set('Real Madrid', 'Xabi Alonso');
  set('Barcelona', 'Hansi Flick');

  // Additional teams present in the roster file (common top-league teams we left unchanged)
  set('Manchester United', 'Rúben Amorim');
  set('Arsenal', 'Mikel Arteta');
  set('Liverpool', 'Arne Slot');
  set('Manchester City', 'Pep Guardiola');
  set('Chelsea', 'Enzo Maresca');
  set('Tottenham', 'Thomas Frank');
  set('Newcastle United', 'Eddie Howe');
  set('Aston Villa', 'Unai Emery');
  set('Brentford', 'Keith Andrews');
  set('Brighton', 'Fabian Hürzeler');
  set('Nottingham Forest', 'Ange Postecoglou');
  set('Crystal Palace', 'Oliver Glasner');
  set('Bournemouth', 'Andoni Iraola');
  set('Everton', 'David Moyes');
  set('Fulham', 'Marco Silva');
  set('Leeds United', 'Daniel Farke');
  set('Burnley', 'Scott Parker');
  set('Sunderland', 'Régis Le Bris');
  set('West Ham', 'Nuno Espírito Santo');
  set('Wolverhampton', 'Vítor Pereira');

  // Italian clubs (user-provided list)
  set('AC Milan', 'Massimiliano Allegri');
  set('Atalanta', 'Ivan Jurić');
  set('Bologna', 'Thiago Motta');
  set('Cagliari', 'Fabio Grosso');
  set('Empoli', 'Paolo Zanetti');
  set('Fiorentina', 'Alberto Aquilani');
  set('Frosinone', 'Francesco Modesto');
  set('Genoa', 'Alberto Gilardino');
  set('Hellas Verona', 'Marco Baroni');
  set('Inter Milan', 'Cristian Chivu');
  set('Juventus', 'Raffaele Palladino');
  set('Lazio', 'Maurizio Sarri');
  set('Lecce', "Roberto D'Aversa");
  set('Monza', 'Alessandro Nesta');
  set('Napoli', 'Vincenzo Italiano');
  set('Parma', 'Fabio Cannavaro');
  set('Roma', 'Daniele De Rossi');
  set('Salernitana', 'Leonardo Semplici');
  set('Sassuolo', 'Andrea Pirlo');
  // Torino: no manager name provided by user; skipping until provided

  // Note: these names are placeholders. If you prefer to use real-world coaches or specific names,
  // provide a list and I will update the file accordingly.
  // Portuguese league managers (mapped using canonical team names from teams.js)
  set('Estoril Praia', 'Ian Cathro');
  set('FC Arouca', 'Vasco Seabra');
  set('FC Alverca', 'Custódio Castro');
  set('SL Benfica', 'José Mourinho');
  set('AVS Futebol SAD', 'João Pedro Sousa');
  // Canonical-name mappings (fuzzy/variant matches resolved)
  set('Tottenham Hotspur', 'Thomas Frank');
  set('FC Barcelona', 'Hansi Flick');
  set('Getafe', 'José Bordalás');
  set('Mallorca', 'Jagoba Arrasate');
  set('Osasuna', 'Alessio Lisci');
  set('Elche', 'Eder Sarabia');
  set('AS Roma', 'Daniele De Rossi');
  set('Villarreal CF', 'Marcelino');
  set('Celta Vigo', 'Claudio Giráldez');
  set('Atlético de Madrid', 'Diego Simeone');
  set('West Ham United', 'Nuno Espírito Santo');
})();
