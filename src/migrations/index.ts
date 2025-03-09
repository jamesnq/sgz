import * as migration_20250309_080059 from './20250309_080059';
import * as migration_20250309_083743 from './20250309_083743';

export const migrations = [
  {
    up: migration_20250309_080059.up,
    down: migration_20250309_080059.down,
    name: '20250309_080059',
  },
  {
    up: migration_20250309_083743.up,
    down: migration_20250309_083743.down,
    name: '20250309_083743'
  },
];
