import * as migration_20250312_121853 from './20250312_121853';
import * as migration_20250314_140230 from './20250314_140230';
import * as migration_20250318_095854 from './20250318_095854';
import * as migration_20250321_094323 from './20250321_094323';
import * as migration_20250330_035041 from './20250330_035041';

export const migrations = [
  {
    up: migration_20250312_121853.up,
    down: migration_20250312_121853.down,
    name: '20250312_121853',
  },
  {
    up: migration_20250314_140230.up,
    down: migration_20250314_140230.down,
    name: '20250314_140230',
  },
  {
    up: migration_20250318_095854.up,
    down: migration_20250318_095854.down,
    name: '20250318_095854',
  },
  {
    up: migration_20250321_094323.up,
    down: migration_20250321_094323.down,
    name: '20250321_094323',
  },
  {
    up: migration_20250330_035041.up,
    down: migration_20250330_035041.down,
    name: '20250330_035041'
  },
];
