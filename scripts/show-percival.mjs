import { PERCIVAL, SOURCES } from '../src/percival/data.ts';
import { calculatePercival } from '../src/percival/rules.ts';

// Consulta somente: não persiste evolução, não consome recursos e não acessa a rede.
console.log(JSON.stringify({
  record: PERCIVAL,
  calculated: calculatePercival(PERCIVAL),
  sources: SOURCES,
}, null, 2));
