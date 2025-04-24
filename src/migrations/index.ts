import * as migration_20250312_121853 from './20250312_121853';
import * as migration_20250314_140230 from './20250314_140230';
import * as migration_20250318_095854 from './20250318_095854';
import * as migration_20250321_094323 from './20250321_094323';
import * as migration_20250330_034707 from './20250330_034707';
import * as migration_20250407_053645 from './20250407_053645';
import * as migration_20250410_045337 from './20250410_045337';
import * as migration_20250415_101939 from './20250415_101939';
import * as migration_20250419_161826 from './20250419_161826';
import * as migration_20250424_123414 from './20250424_123414';

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
    up: migration_20250330_034707.up,
    down: migration_20250330_034707.down,
    name: '20250330_034707',
  },
  {
    up: migration_20250407_053645.up,
    down: migration_20250407_053645.down,
    name: '20250407_053645',
  },
  {
    up: migration_20250410_045337.up,
    down: migration_20250410_045337.down,
    name: '20250410_045337',
  },
  {
    up: migration_20250415_101939.up,
    down: migration_20250415_101939.down,
    name: '20250415_101939',
  },
  {
    up: migration_20250419_161826.up,
    down: migration_20250419_161826.down,
    name: '20250419_161826',
  },
  {
    up: migration_20250424_123414.up,
    down: migration_20250424_123414.down,
    name: '20250424_123414'
  },
];
