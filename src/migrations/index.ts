import * as migration_20250312_121853 from './20250312_121853';

export const migrations = [
  {
    up: migration_20250312_121853.up,
    down: migration_20250312_121853.down,
    name: '20250312_121853'
  },
];
