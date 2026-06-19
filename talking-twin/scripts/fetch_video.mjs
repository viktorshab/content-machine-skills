// fetch_video.mjs — забрать готовый ролик по video_id.
//
// Нужен, если сборка зависла или процесс оборвался на ожидании: видео всё равно
// дособирается на сервере HeyGen. НЕ запускай сборку заново (это новый расход
// кредитов) — забери уже готовый результат по его id:
//   node scripts/fetch_video.mjs <video_id>
// video_id печатает make_twin.mjs сразу после отправки задачи — возьми его из вывода.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Директория этого скрипта (scripts/) — от неё ищем .env в корне скилла.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const OUT_DIR = process.env.TWIN_OUT_DIR || 'materials/M7';
const OUT_MP4 = path.join(OUT_DIR, 'm7_twin_reel.mp4');

// Ключ берётся из окружения или из .env рядом со скриптом (директория скилла).
// В чужие/личные пути не лезем — .env должен лежать здесь, по образцу .env.example.
function readKey(name) {
  if (process.env[name]) return process.env[name];
  for (const p of [path.join(SCRIPT_DIR, '..', '.env'), '.env']) {
    try {
      const m = fs.readFileSync(p, 'utf-8').match(new RegExp('^' + name + '=(.*)$', 'm'));
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch { /* нет файла — пробуем следующий */ }
  }
  return null;
}

const KEY = readKey('HEYGEN_API_KEY');
const videoId = process.argv[2];
if (!KEY) { console.error('❌ HEYGEN_API_KEY не найден. Положи .env рядом со скриптом по образцу .env.example и впиши ключ.'); process.exit(1); }
if (!videoId) { console.error('Дай video_id: node scripts/fetch_video.mjs <video_id>'); process.exit(1); }

const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, { headers: { 'X-Api-Key': KEY } });
const j = await res.json();
const d = j.data || j;
console.log('status:', d.status);
if (d.status === 'completed') {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dl = await fetch(d.video_url);
  await pipeline(Readable.fromWeb(dl.body), fs.createWriteStream(OUT_MP4));
  console.log(`✅ Готово → ${OUT_MP4} (${(fs.statSync(OUT_MP4).size / 1024 / 1024).toFixed(1)} MB)`);
} else if (d.status === 'failed') {
  console.error('❌ failed:', JSON.stringify(d.error || d).slice(0, 300));
  process.exit(1);
} else {
  console.log('Ещё не готово — повтори через ~20–30 секунд той же командой.');
}
