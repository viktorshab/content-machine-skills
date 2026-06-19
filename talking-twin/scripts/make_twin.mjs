// make_twin.mjs — Цифровой двойник без камеры
//
// Собирает вертикальный ролик 9:16: твоё лицо (HeyGen-аватар) + ТВОЙ голос.
// Голос можно дать тремя путями:
//   1) свой готовый аудиофайл (живой голос ИЛИ заранее сделанный клон):
//        node make_twin.mjs --audio materials/M7/my_voice.mp3
//   2) из текста твоим клон-голосом ElevenLabs (озвучит и соберёт за один заход):
//        node make_twin.mjs --say "Привет, это мой двойник" --voice <elevenlabs_voice_id>
//   3) fallback без своего голоса (озвучит голосом HeyGen — на русском слабее):
//        node make_twin.mjs --text "Привет"
//
// Посмотреть СВОИ аватары и голоса (готовые id для --avatar/--voice, чтобы не искать руками):
//        node make_twin.mjs --list
//
// Почему это «правильный путь» без ловушки Voice Mirroring:
//   когда мы подаём аудио (type:"audio"), HeyGen НЕ переозвучивает — он только
//   синхронизирует губы под наш звук, тембр сохраняется. Voice Mirroring — это
//   UI-галочка, которая, наоборот, переозвучивает голосом аватара; здесь её нет.
//
// Аватар: HEYGEN_AVATAR_ID в .env или --avatar <id>; без него берётся библиотечный.
//   Тип аватара (фото-аватар talking_photo / Avatar IV ИЛИ обычный-видео avatar)
//   скрипт определяет сам. У фото-аватара фон «вшит» в исходное фото и параметром
//   не меняется — другой фон выбирается при создании аватара, не здесь.
// Ключи из .env рядом со скриптом (директория скилла), по образцу .env.example:
//   HEYGEN_API_KEY      — обязателен;
//   ELEVENLABS_API_KEY  — нужен только для режима --say (клон из текста).
// По умолчанию шлём test:true. На стартовом плане это БЕСПЛАТНОЕ превью с watermark;
// на платном API-плане test может идти БЕЗ watermark, но ТРАТИТ API-кредиты — поэтому
// перед генерацией скрипт показывает их остаток. Чистовое (--final) — только по «да».

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Директория этого скрипта (scripts/) — от неё ищем .env в корне скилла.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const HEYGEN_API = 'https://api.heygen.com';
const HEYGEN_UPLOAD = 'https://upload.heygen.com/v1/asset';
const ELEVEN_API = 'https://api.elevenlabs.io/v1/text-to-speech';
const OUT_DIR = process.env.TWIN_OUT_DIR || 'materials/M7';
const OUT_MP4 = path.join(OUT_DIR, 'm7_twin_reel.mp4');

// ── аргументы ──
function readArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--audio') out.audio = argv[++i];
    else if (a === '--say') out.say = argv[++i];
    else if (a === '--voice') out.voice = argv[++i];
    else if (a === '--text') out.text = argv[++i];
    else if (a === '--avatar') out.avatar = argv[++i];
    else if (a === '--model') out.model = argv[++i];
    else if (a === '--list') out.list = true;
    else if (a === '--final') out.final = true;
  }
  return out;
}
const args = readArgs(process.argv.slice(2));
const TEST = !args.final; // превью (watermark, бесплатно) по умолчанию

// ── режим голоса ──
// audioPath !== null  → подаём своё аудио (type:"audio"); иначе TTS HeyGen (type:"text").
let audioPath = args.audio || null;
let TEXT = args.text || null;

// ── ключи из окружения / .env ──
// .env берём только рядом со скриптом (директория скилла), по образцу .env.example.
// В личные/чужие пути не лезем.
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
const HEYGEN_KEY = readKey('HEYGEN_API_KEY');
if (!HEYGEN_KEY) {
  console.error('❌ HEYGEN_API_KEY не найден. Положи .env рядом со скриптом по образцу .env.example:\n   заведи ключ на developers.heygen.com (Settings → API), пополни API-кошелёк (от $5)\n   и впиши HEYGEN_API_KEY=... в .env.');
  process.exit(1);
}
const HEYGEN_JSON = { 'X-Api-Key': HEYGEN_KEY, 'Content-Type': 'application/json' };

async function withRetry(fn, label, max = 3) {
  let last;
  for (let i = 0; i < max; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      const s = e.status;
      if (!(!s || s === 429 || (s >= 500 && s < 600)) || i === max - 1) break;
      const d = 2000 * 2 ** i;
      console.warn(`  ⚠ ${label}: попытка ${i + 1} (${e.message}), retry ${d}ms`);
      await new Promise(r => setTimeout(r, d));
    }
  }
  throw last;
}

async function heygen(method, urlPath, body) {
  const res = await fetch(HEYGEN_API + urlPath, { method, headers: HEYGEN_JSON, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) { const t = await res.text(); const e = new Error(`${method} ${urlPath} → ${res.status}: ${t.slice(0, 300)}`); e.status = res.status; throw e; }
  return res.json();
}

// Тип аватара: фото-аватар (talking_photo / Avatar IV) или обычный-видео (avatar).
// Фото-аватар отвечает 200 на /v2/photo_avatar/{id} — по этому и различаем,
// чтобы ученику не нужно было знать, какой у него тип аватара.
async function avatarKind(id) {
  try {
    const res = await fetch(`${HEYGEN_API}/v2/photo_avatar/${id}`, { headers: { 'X-Api-Key': HEYGEN_KEY } });
    if (res.ok) { const j = await res.json(); if (j.data?.id === id) return 'talking_photo'; }
  } catch { /* не фото — считаем обычным аватаром */ }
  return 'avatar';
}

// Остаток API-кредитов (их ест генерация; на платном плане каждый ролик платный,
// даже в test-режиме). Возвращает число или null, если узнать не вышло.
async function apiCreditsLeft() {
  try {
    const res = await fetch(`${HEYGEN_API}/v2/user/remaining_quota`, { headers: { 'X-Api-Key': HEYGEN_KEY } });
    if (res.ok) { const j = await res.json(); return j.data?.details?.api ?? j.data?.remaining_quota ?? null; }
  } catch { /* не вышло — не блокируем работу */ }
  return null;
}

// ── Списки ТВОИХ аватаров (HeyGen) и голосов (ElevenLabs) ──
// Ассистент вызывает `--list`, показывает человеку и спрашивает, какой брать,
// чтобы ученику не искать id руками. id аватара/голоса — не секрет, показывать можно.
async function listAssets() {
  console.log('Твои аватары в HeyGen (это «лицо» двойника; id ниже — готовое значение для --avatar):');
  try {
    const seen = new Set();
    const print = (name, id, tag) => { if (!id || seen.has(id)) return; seen.add(id); console.log(`    • ${name || '(без имени)'}${tag ? '  [' + tag + ']' : ''}  →  --avatar ${id}`); };
    // отдельные фото-аватары
    const av = await withRetry(() => heygen('GET', '/v2/avatars'), 'avatars');
    for (const p of (av.data?.talking_photos || av.talking_photos || [])) print(p.talking_photo_name, p.talking_photo_id, 'фото');
    // «лица» внутри твоих групп — именно их (а не id-группы) принимает генерация.
    // Обходим ПОСЛЕДОВАТЕЛЬНО: параллельный запуск роняет node на слабой машине.
    const gr = await withRetry(() => heygen('GET', '/v2/avatar_group.list'), 'groups');
    const groups = gr.data?.avatar_group_list || gr.data?.groups || (Array.isArray(gr.data) ? gr.data : []);
    for (const g of groups) {
      try {
        const lr = await withRetry(() => heygen('GET', `/v2/avatar_group/${g.id || g.group_id}/avatars`), 'looks');
        const looks = lr.data?.avatar_list || lr.data?.avatars || (Array.isArray(lr.data) ? lr.data : []);
        for (const l of looks) print(l.name || l.avatar_name, l.id || l.avatar_id || l.talking_photo_id, g.name);
      } catch { /* группа не раскрылась — пропускаем */ }
    }
    if (!seen.size) console.log('  (своих аватаров не видно — создай аватара в HeyGen, потом запусти --list снова)');
  } catch (e) { console.log('  ⚠ не вышло получить аватары: ' + e.message); }

  console.log('\nТвои голоса в ElevenLabs (это «голос» двойника):');
  const key = readKey('ELEVENLABS_API_KEY');
  if (!key) { console.log('  (ELEVENLABS_API_KEY не задан — впиши его в .env, тогда покажу клон-голоса)'); return; }
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
    if (!res.ok) { console.log('  ⚠ ElevenLabs ответил ' + res.status); return; }
    const j = await res.json();
    const voices = j.voices || [];
    const mine = voices.filter(v => /cloned|generated|professional/i.test(v.category || ''));
    const show = mine.length ? mine : voices;
    if (!show.length) { console.log('  (голосов нет — склонируй свой голос в ElevenLabs, потом --list снова)'); return; }
    for (const v of show) console.log(`    • ${v.name || '(без имени)'}  →  --voice ${v.voice_id}  (${v.category || ''})`);
  } catch (e) { console.log('  ⚠ не вышло получить голоса: ' + e.message); }
}

// ── ElevenLabs: текст → mp3 клон-голосом (режим --say) ──
async function ttsElevenLabs(text, voiceId, model) {
  const key = readKey('ELEVENLABS_API_KEY');
  if (!key) throw new Error('ELEVENLABS_API_KEY не найден в .env — он нужен для режима --say (клон из текста).');
  if (!voiceId) throw new Error('Не задан --voice <elevenlabs_voice_id> (id твоего клон-голоса).');
  const res = await fetch(`${ELEVEN_API}/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: model || 'eleven_multilingual_v2', // стабильнее на русском (research 06/2026)
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) { const t = await res.text(); const e = new Error(`ElevenLabs → ${res.status}: ${t.slice(0, 300)}`); e.status = res.status; throw e; }
  const ab = await res.arrayBuffer();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, 'm7_twin_voice.mp3');
  fs.writeFileSync(out, Buffer.from(ab));
  console.log(`  ✔ озвучка клоном сохранена → ${out}`);
  return out;
}

// ── HeyGen: загрузить локальный аудиофайл → asset_id ──
async function uploadAudio(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Аудиофайл не найден: ${filePath}`);
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const ct = ext === '.wav' ? 'audio/wav' : 'audio/mpeg'; // wav в legacy-загрузке ненадёжен — лучше mp3
  const res = await fetch(HEYGEN_UPLOAD, { method: 'POST', headers: { 'x-api-key': HEYGEN_KEY, 'Content-Type': ct }, body: buf });
  if (!res.ok) { const t = await res.text(); const e = new Error(`upload audio → ${res.status}: ${t.slice(0, 300)}`); e.status = res.status; throw e; }
  const j = await res.json();
  const id = j.data?.id || j.data?.asset_id;
  if (!id) throw new Error('upload audio: не вернулся asset id: ' + JSON.stringify(j).slice(0, 300));
  return id;
}

function pickVoice(voices) {
  if (process.env.HEYGEN_VOICE_ID) return { voice_id: process.env.HEYGEN_VOICE_ID };
  const ru = voices.filter(v => /russian|русск/i.test(v.language || ''));
  const pool = ru.length ? ru : voices.filter(v => /multilingual/i.test((v.language || '') + (v.name || '')));
  if (!pool.length) return null;
  const female = pool.filter(v => /female|женск/i.test(v.gender || ''));
  return female[0] || pool[0];
}

async function main() {
  // 0) только показать твои аватары и голоса (ассистент спросит, какой брать)
  if (args.list) { await listAssets(); return; }

  // 1) определить голос
  if (args.say) {
    console.log('1) Озвучиваю текст твоим клон-голосом (ElevenLabs)…');
    audioPath = await ttsElevenLabs(args.say, args.voice || readKey('ELEVENLABS_VOICE_ID'), args.model);
  }
  if (!audioPath && !TEXT) {
    console.error('❌ Не задан голос. Варианты:\n   --audio <файл.mp3>            (своё готовое аудио: живой голос или клон)\n   --say "текст" --voice <id>     (озвучить клоном ElevenLabs из текста)\n   --text "текст"                (fallback: голос HeyGen, на русском слабее)');
    process.exit(1);
  }
  if (TEXT && (TEXT.length < 5 || TEXT.length > 4800)) { console.error('❌ Текст пустой или длиннее лимита HeyGen (~5000 символов).'); process.exit(1); }

  // 2) аватар (нужен в любом режиме). Свой аватар выбираешь сам — вслепую из общей
  //    библиотеки не берём, иначе это будет чужой аватар, а не твой двойник.
  let avatarId = args.avatar || readKey('HEYGEN_AVATAR_ID') || null;
  if (!avatarId) {
    console.error('❌ Не задан аватар. Посмотри своих:  node make_twin.mjs --list\n   и передай нужного:  --avatar <id>   (или впиши HEYGEN_AVATAR_ID в .env).');
    process.exit(1);
  }
  // голос HeyGen нужен только в fallback-режиме --text (последовательно — параллель роняет node)
  let voiceId = null;
  if (!audioPath) {
    console.log('2) Беру голос HeyGen (fallback-режим --text)…');
    const vRes = await withRetry(() => heygen('GET', '/v2/voices'), 'voices');
    const voices = vRes.data?.voices || vRes.voices || [];
    const v = pickVoice(voices);
    if (!v) { console.error('❌ Не нашёл русский голос HeyGen. Дай свой голос через --audio или --say.'); process.exit(1); }
    voiceId = v.voice_id;
  }
  const kind = await avatarKind(avatarId);
  console.log(`  аватар: ${avatarId} (${kind === 'talking_photo' ? 'фото-аватар' : 'видео/обычный'})${audioPath ? ' | голос: моё аудио (тембр сохранён, без переозвучки)' : ' | голос HeyGen: ' + voiceId}`);

  // 3) если есть своё аудио — загрузить в HeyGen
  let audioAssetId = null;
  if (audioPath) {
    console.log('3) Загружаю аудио в HeyGen…');
    audioAssetId = await withRetry(() => uploadAudio(audioPath), 'upload');
    console.log(`  asset_id: ${audioAssetId}`);
  }

  // 4) собрать видео
  const voice = audioAssetId
    ? { type: 'audio', audio_asset_id: audioAssetId }            // свой голос: липсинк под наш звук, без TTS
    : { type: 'text', input_text: TEXT, voice_id: voiceId, speed: 1.0 }; // fallback: голос HeyGen
  const creditsLeft = await apiCreditsLeft();
  if (creditsLeft != null) console.log(`  Остаток API-кредитов HeyGen: ${creditsLeft}${creditsLeft <= 6 ? ' ⚠ мало — может не хватить на ролик' : ''}`);
  console.log(TEST ? '4) Генерация ПРЕВЬЮ 9:16 (test-режим; на стартовом плане бесплатно с watermark, на платном тратит кредиты)…' : '4) Генерация ЧИСТОВОГО видео 9:16 (--final, тратит кредиты)…');
  const gen = await withRetry(() => heygen('POST', '/v2/video/generate', {
    test: TEST,
    caption: false,
    dimension: { width: 720, height: 1280 },
    video_inputs: [{
      character: kind === 'talking_photo'
        ? { type: 'talking_photo', talking_photo_id: avatarId }   // фото-аватар (Avatar IV)
        : { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' }, // обычный/видео-аватар
      voice,
      background: { type: 'color', value: '#EFE9E1' },
    }],
  }), 'generate');
  const videoId = gen.data?.video_id || gen.video_id;
  if (!videoId) { console.error('❌ Нет video_id:', JSON.stringify(gen).slice(0, 300)); process.exit(1); }
  console.log(`  video_id: ${videoId}${TEST ? ' (TEST — watermark)' : ''}`);

  // 5) дождаться готовности
  console.log('5) Жду готовности (каждые 15 сек)…');
  let url = null;
  for (let i = 0; i < 80; i++) {
    await new Promise(r => setTimeout(r, 15000));
    const st = await withRetry(() => heygen('GET', `/v1/video_status.get?video_id=${videoId}`), 'status');
    const d = st.data || st;
    console.log(`  [${i + 1}] ${d.status}`);
    if (d.status === 'completed') { url = d.video_url; break; }
    if (d.status === 'failed') { console.error('❌ failed:', JSON.stringify(d.error || d).slice(0, 300)); process.exit(1); }
  }
  if (!url) { console.error('❌ Не дождался за ~20 мин. video_id:', videoId); process.exit(1); }

  // 6) скачать
  console.log('6) Скачиваю mp4…');
  const res = await withRetry(() => fetch(url), 'download');
  if (!res.ok) { console.error('❌ Скачивание:', res.status); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(OUT_MP4));
  const mb = (fs.statSync(OUT_MP4).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Готово → ${OUT_MP4} (${mb} MB)`);
}

main().catch(e => { console.error(`❌ ${e.message}`); process.exit(1); });
