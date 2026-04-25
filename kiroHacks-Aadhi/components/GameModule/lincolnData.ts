import type { SlotConfig, PanelConfig } from './GameModule';

export const GRID_WIDTH = 13;
export const GRID_HEIGHT = 13;

// Verified intersections:
//   (r0,c0): LINCOLN[0]=L, LAWYER[0]=L  ✓
//   (r6,c4): UNION[4]=N,   NOBLE[0]=N   ✓
//   (r10,c4): SLAVERY[4]=E, NOBLE[4]=E  ✓
export const lincolnSlots: SlotConfig[] = [
  { id:'lincoln-across', ans:'LINCOLN',    clue:'16th President of the United States (7)',          dir:'a', row:0,  col:0, pid:'p1' },
  { id:'lawyer-down',    ans:'LAWYER',     clue:"Lincoln's profession before the presidency (6)",   dir:'d', row:0,  col:0, pid:'p1' },
  { id:'cabin-across',   ans:'CABIN',      clue:'Lincoln was born in a log ___ (5)',                dir:'a', row:3,  col:3, pid:'p1' },
  { id:'union-across',   ans:'UNION',      clue:'What Lincoln fought to preserve (5)',              dir:'a', row:6,  col:0, pid:'p2' },
  { id:'noble-down',     ans:'NOBLE',      clue:"Word describing Lincoln's character (5)",          dir:'d', row:6,  col:4, pid:'p2' },
  { id:'slavery-across', ans:'SLAVERY',    clue:'Institution abolished by the 13th Amendment (7)', dir:'a', row:10, col:0, pid:'p2' },
  { id:'freedom-across', ans:'FREEDOM',    clue:'Core value of the Emancipation Proclamation (7)', dir:'a', row:8,  col:5, pid:'p3' },
  { id:'gettysburg',     ans:'GETTYSBURG', clue:"Site of Lincoln's famous 1863 address (10)",      dir:'a', row:11, col:0, pid:'p3' },
  { id:'abolish-across', ans:'ABOLISH',    clue:'To formally put an end to slavery (7)',           dir:'a', row:12, col:0, pid:'p3' },
];

export const lincolnPanels: PanelConfig[] = [
  { id:'p1', label:'PANEL 1 — EARLY LIFE', imageSrc:'/panels/1.png', badgeText:'🏅 EARLY LIFE!',  unlockPct:33  },
  { id:'p2', label:'PANEL 2 — CIVIL WAR',  imageSrc:'/panels/2.png', badgeText:'🏅 CIVIL WAR!',   unlockPct:66  },
  { id:'p3', label:'PANEL 3 — LEGACY',     imageSrc:'/panels/3.png', badgeText:'🏆 LEGACY!',       unlockPct:100 },
];
