# Фаза 4 — промты под модель (+ отладочные приёмы)

> Промты пишешь ТЫ под конкретный движок, и показываешь человеку заранее — он правит до генерации. Промты на английском (модели понимают лучше); человеку английский знать не нужно — ты строишь промт сам, он подставляет смысл по-русски. Основано на: OSideMedia (формула MCSLA и дисциплина), видео-разборах (отладочные приёмы), rediumvex (язык камеры).

## Формула промта

**MCSLA** (OSideMedia, дословно — грамматика промта): **M**odel · **C**amera · **S**ubject · **L**ook · **A**ction. Самый надёжный порядок изложения — **Subject → Action → Camera → Style**, держать промт **под 200 слов** («tightness over padding» — плотность важнее объёма).

Развёрнутый каркас кадра (библиотека вау-промтов): **субъект + действие + окружение + движение камеры + свет + настроение + стиль**. Субъект — первым, потом сцена.

**Для оживления (video-промт) — добавь явный слой «направление».** Промт движения держи в 4 слоя: (1) **действие** объекта глаголом; (2) **движение камеры**; (3) **направление в кадре** — куда едет/идёт объект и куда ведёт камера (`screen left to screen right`, `away from camera`, `toward camera`); (4) **физика среды** (вес, инерция, пыль, ветер). Слой «направление» — то, чего обычно нет в промте и из-за чего транспорт «едет назад»: модель не угадывает вектор, его надо назвать словами и подкрепить кадром (continuity bible — `02-brief-shotlist.md`). Формула Runway для image-to-video: *«The camera [motion] as the subject [action]»* — камера и субъект описываются раздельно.

## Что вшить в КАЖДЫЙ промт

- **Same style header** (ODN, дословно: *«same style header, same lighting, lens, acting style, physics locked across all shots»*) — единый заголовок стиля/света/линзы/физики на все шоты, чтобы ролик выглядел цельным.
- **`no music, only environmental sound effects`** (ODN) — музыку накладываем в монтаже, не в генерации.
- **Identity по референсу, не переописанием** — лицо/товар держим ссылкой на ассет (Фаза 0), а не повторным описанием внешности.
- **Негатив-блок** — общий список того, чего не должно быть (артефакты рук, лишние пальцы, морфинг, реверс движения). Готовая строка против реверса/морфинга и **позитивная версия для Runway** (он negative не понимает) — ниже, в разделе «Негатив против реверса и морфинга». Для Veo добавлять `No subtitles` (иначе впечатывает субтитры).

## Кинематографичность (рычаги, что реально «удорожают» кадр)

Из Reddit-практики + библиотеки (брать по одному на кадр, не стакать пять — иначе артефакты):
- **оптика**: `shot on 35mm` / `85mm portrait lens`, `shallow depth of field / bokeh`;
- **named lighting**: `golden hour`, `soft rim light`, `low-key dramatic lighting`, `volumetric light` (предсказуемее, чем «beautiful lighting»);
- **движение камеры** — самый сильный рычаг: всегда называй тип — `slow dolly-in`, `360 orbit`, `tracking shot`, `handheld`, `crane up`; с замедлением смотрится дороже и реже ломает геометрию;
- **плёночный лук**: `subtle film grain`, `anamorphic`, `cinematic color grade`.

## Identity-lock для КАДРОВ с лицом (Image 2 / gpt-image-2)

Это про генерацию **статичного кадра с лицом ученика** (Фаза 5), до оживления. Формула MCSLA выше — про видео; для кадра с лицом нужен отдельный блок. По реальному тесту лицо держит **Image 2 (gpt-image-2)**, а не Flux-reference (тот проваливается — «не он»). Подаёшь 3–6 чистых фото лица (разные ракурсы) через референс на вход + вшиваешь в промт полный identity-блок. Без него модель «усредняет» лицо в красивого незнакомца. Ниже — всё нужное самодостаточно: 7 принципов, эталонный блок, готовый шаблон сцены, чек-лист контроля и частые ошибки.

**Структура любого кадра с лицом:** `Image roles → Identity lock → Realism → Change (сцена/свет/одежда) → Constraints`. Identity-блок между кадрами **не меняешь** — меняешь только сцену.

**Компактный эталонный identity-блок** (вставлять как есть, на английском):

```text
IMAGE ROLES: The uploaded photos are IDENTITY REFERENCES ONLY of the same real person. Use them strictly to reproduce the exact face and head; do NOT copy their backgrounds, outfits, lighting or poses.
IDENTITY LOCK (reproduce exactly, do not alter): face shape, facial proportions, bone structure, eye shape and spacing, eyelids, brow, nose bridge, nose tip, nostrils, cheekbones, jawline, chin, mouth shape, lips, smile lines, skin tone, natural skin texture, hairline, hairstyle outline, facial hair, moles, freckles, scars, natural asymmetry. SAME exact person, instantly recognizable.
REALISM: real photograph, natural skin texture with visible pores, subtle asymmetry, believable imperfections, realistic hair. NO plastic or waxy skin, NO airbrushing, NO over-beautified influencer face, NO anime, NO CGI.
CONSTRAINTS: do NOT make the person younger, more generic, more symmetrical, more glamorous or more handsome; keep the real face exactly. No extra people, no text, no watermark, no distorted eyes, no face-swap artifacts.
```

После него дописываешь только сцену (`Change: place the person in [локация], [одежда], [поза], [свет]`). Анти-beauty в блоке (`NO over-beautified influencer face`, `do not make more glamorous/handsome`) обязателен — beauty-слова (`flawless`, `perfect`, `symmetrical`, `model-like`) убивают сходство и дают generic-лицо.

**Размер задавай параметром, не суффиксом в промте.** Не пиши `--ar 9:16` / `9:16` в тексте — формат у Image 2 задаётся параметром `size` (через OpenAI API) или `aspect_ratio` (через Replicate). Реальные размеры и потолок вертикали — `05-engines-channels.md`. nano-banana-pro тоже умеет лицо (до 6 референсов), но в нашем опыте «с возни» — основной движок для лица остаётся Image 2.

**Несколько вариантов на выбор.** Первый кадр / обложку генерируй сразу в **3 варианта** — у модели нет 100% консистентности с первой попытки, поэтому делаешь несколько и отбираешь лучший по landmark (глаза, нос, челюсть, hairline), а не «похоже в целом». Подробнее — `01-assets-phase0.md` и `05-engines-channels.md`.

### 7 принципов лица (держать все)

1. **Роль каждому референсу.** В промте прямо: `Images 1-3 are identity references only` (лицо), `Image 4 is style reference only` + `do not copy background/outfit from identity refs`. Не «просто загрузил фото».
2. **Не «same person», а landmark-список** существительными: форма лица, пропорции, костная структура, разрез и расстояние глаз, веки, брови, спинка/кончик/крылья носа, скулы, челюсть, подбородок, губы, линия улыбки, тон кожи, hairline, контур причёски, растительность, родинки, веснушки, шрамы, естественная асимметрия.
3. **Структура `Change + Preserve + Realism + Constraints`** — не поток красивых слов: что меняем / что сохраняем / как выглядит реализм / что запрещено.
4. **Физика кадра вместо `8K cinematic masterpiece`.** Конкретика: источник света, время дня, тип линзы как подсказка, дистанция, глубина резкости, натуральная кожа с порами, лёгкое зерно, реальные тени/отражения.
5. **Один крупный фактор за раз.** Сменишь разом лицо+возраст+позу+ракурс+свет+одежду+фон — модель усреднит лицо. Меняешь сцену, identity-блок держишь неизменным.
6. **Серия — через character bible.** Сначала генеришь reference-sheet (фронт, 3/4, профиль, разные эмоции), потом подаёшь его референсом в каждый кадр — лицо не плывёт по серии.
7. **Дрейф не чинят постобработкой.** Поплыло лицо → не «спасай» кадр, а перегенери от оригиналов / character bible. Цикл: генерация → отбраковка по landmark → перегенерация.

### Готовый промт-шаблон кадра с лицом (копируй, меняй только сцену)

```text
Create a vertical 9:16 photorealistic still of the same person from the uploaded identity references.
Image roles: Images 1-N are identity references only. Use them to preserve the same real person. Do not copy their original background, outfit, pose or lighting unless requested.
Subject: the exact same person, [expression], looking [at camera / slightly off-camera].
Preserve (do not alter): face shape, facial proportions, bone structure, eye shape and spacing, eyelids, brow, nose bridge, nose tip, nostrils, cheekbones, jawline, chin, mouth, lips, smile lines, skin tone, natural skin texture, hairline, hairstyle outline, facial hair, moles, freckles, scars, natural asymmetry.
Change (scene only): place the person in [локация], [одежда], [поза], [действие].
Photorealism: real photograph, natural skin texture with visible pores, subtle asymmetry, believable imperfections, realistic hair. NO plastic/waxy skin, NO airbrushing, NO over-beautified influencer face, NO anime, NO CGI.
Camera & light: [close-up / medium], [35/50/85mm] natural lens feel, [soft window / golden-hour side / practical neon] light, realistic shadows, slight film grain, sharp focus on the eyes.
Constraints: do NOT make the person younger, more generic, more symmetrical, more glamorous or more handsome. No extra people, no text, no watermark, no distorted eyes, no face-swap artifacts.
```

### Чек-лист контроля (после генерации — по частям, не «похоже в целом»)
Глаза и межглазное расстояние · веки · нос (спинка/кончик) · губы и линия улыбки · ширина лица · скулы · челюсть · подбородок · hairline · возраст · тон кожи · родинки/шрамы. Сменился крупный landmark → отбраковка, а не спасение постобработкой.

### Частые ошибки лица
- **`flawless / perfect face / symmetrical / model-like / glamorous`** → generic-красавчик. Пиши `natural, real, subtle asymmetry, visible pores, do not over-beautify`.
- **Цепочка из generated-кадров как новый референс** → накопление дрейфа. Поплыло — возвращайся к оригиналам / character bible.
- **`--ar 9:16` в тексте промта** → формат так не форсится. Размер — параметром (`size` в OpenAI API: `1152x2048`/`1440x2560`; `aspect_ratio` на Replicate). Детали — `05-engines-channels.md`.
- **Путаница OpenAI API vs Replicate** → в API валиден `size` 9:16; на Replicate прямого 9:16 нет, ближайший `aspect_ratio: 2:3`.

## Image-to-video (оживление кадра)

При оживлении уже готовой картинки в промт пишем **только инструкции движения и камеры — картинку НЕ переописываем** (внешность держит сам кадр). Глаголом про движение субъекта, не статикой: не `a man standing`, а `a man slowly turns his head and smiles`. Указывай темп (`slow motion` / `real-time`).

**Динамика рождается из глаголов и смены дистанции, а не из слова `cinematic`.** `standing near motorcycle, cinematic` даст «живое фото»; `engine kicks on, jacket snaps in the wind, camera pushes low toward the headlight, dust trails behind the rear wheel` даст действие. Если кадр ощущается мёртвым — добавь глагол-событие + движение камеры, меняющее дистанцию (push-in/pull-out).

**Лицо и техника — разные амплитуды.** На лице держи МАЛОЕ движение (взгляд, дыхание, ветер в волосах, микроповорот) — большой поворот головы заставляет модель пересоздать лицо, и оно «плывёт». На колёсах/дороге/проезде — наоборот, движения больше. Поэтому лицо и технику часто оживляют разными моделями: для своего лица бери `kling-v3-omni-video` (принимает 2–4 фото-референса лица и держит идентичность Element Binding'ом), технику — любой сильной по движению (см. `05-engines-channels.md`).

### Промт для frame chaining (следующий клип)
Внешность держит стартовый кадр — промт только про движение/камеру. Образец (библиотека):
`The woman turns from the window and walks toward camera, camera slowly pushes in, handheld, soft window light.`

### Готовые шаблоны под тип кадра
Семь типовых video-промтов (установка-push-in, деталь/макро, close-up лица, посадка, проезд-tracking, low-angle пролёт, финальный отъезд) — каждый в 4 слоя + негатив + варианты под Runway/Hailuo — собраны в `06-prompt-library.md`. Бери готовый под свой кадр и подставляй сцену.

## Негатив против реверса и морфинга (video)

Видео-негатив отличается от негатива для картинок (там — пластиковая кожа, лишние пальцы). Для оживления главные враги — **реверс движения и морфинг**. Готовая строка для моделей, где есть поле `negative_prompt` (Kling, Hailuo):

```text
reverse motion, moving backward, moonwalking, vehicle sliding sideways, wheels spinning backward, warped wheels, deformed motorcycle frame, morphing motorcycle, rider detaching from motorcycle, floating body, extra limbs, twisted hands, face morphing, identity drift, melting face, flickering skin, jitter, duplicate subject, sudden cut, camera teleport, inconsistent lighting, warped perspective, text, logo, watermark
```

**Runway negative НЕ понимает** (Gen-4/4.5 ломается на запретах — может выдать ровно то, что запрещаешь). Там запреты переписываются в **позитивные ограничения**:

```text
The motion is continuous and physically natural. The subject keeps moving forward in the established direction. The wheels rotate correctly. The face and geometry remain consistent. The camera movement is smooth and uninterrupted.
```

Мини-чек перед запуском (против реверса/морфинга): направление названо словами и видно в стартовом кадре? для проезда заложен end-кадр? лицо без большого поворота головы? у Runway запрет переписан в позитив?

## Отладочные приёмы (когда генерация вышла не та)

Все три — из видео `ODNzk5x2tR4`, это режиссёрский слой:

1. **«Опиши, что видит КАМЕРА, а не что происходит».** Если кадр вышел мёртвым/статичным — переключись с описания действия на покадровое описание камеры. Цитата-якорь: *«Before I told Claude what happens. Now I'm telling it what the camera sees.»*
Образец: `the shot starts with a close-up on the rival's leg as he kicks the ball, then cut to an over-the-shoulder shot, then cut to a ready stance; camera dynamic, handheld shake, low angle`.

2. **«Слова не работают — покажи СХЕМУ» (a map beats a paragraph).** Если объект «телепортируется» между генерациями (нет якоря позиции) — словами не чинится. Делаешь вид локации сверху → ставишь точки, где стоят объекты (любой редактор, от руки) → просишь собрать `location scheme` (модель достроит расстояния, размеры, компас). Схему подаёшь в каждую генерацию.
Образец: `put the objects into image one where the circles are located and create a location scheme` + правило `in every generation, objects must appear exactly according to the scheme; use them as a reference, not a key frame`.

3. **Перегруженную сцену — на 2 промта.** Дословно: *«give each moment room to breathe»* — две чистые генерации лучше одной каши.

4. **Не правишь руками — даёшь заметки.** Человек диктует правки словами, ты переписываешь промт. Образец заметки-директивы (ODN): `keep moving fast, add handheld camera, he runs forward not backwards, fix the face: natural smile, alive eyes, no color change`.

## Анти-дрейф персонажа

Если лицо/одежда «поплыли» между кадрами — короткое напоминание в промт (библиотека): `Maintain the character's [причёска] and [одежда]`.

## Модель-специфика (сверять на дату — `05-engines-channels.md`)

- **Seedance** — промт ~50–70 слов; единый аудио-видео-движок.
- **Veo** — одно действие на 8-секундное окно; обязательно `No subtitles`.
- **Runway (Gen-4/4.5)** — negative-промт НЕ поддерживает: запреты переписывай в позитивные ограничения (см. раздел «Негатив против реверса и морфинга» выше).
- **Hailuo (MiniMax)** — понимает явные команды камеры в квадратных скобках в начале промта (`[Tracking shot]`, `[Push in]`, `[Truck right]`, макс 3 комбинированных); для точного контроля ставить `prompt_optimizer: false`.
- **Называй модель и формат явно** (a6lAPOo4CXA, дословно): *«обязательно уточняю, в какой модели генерировать… далее формат и качество»* — иначе агент выберет за тебя.
- Можно дать агенту **prompt-builder skill** под конкретный движок (учит точному формату промтов этой модели) — приём из видео.

🛑 **Стоп-гейт фазы 4:** покажи промты и спроси — **«промты сильные? Видео ещё НЕ генерим.»** Анти-рационализация (методслой): имена моделей и форматы НЕ угадывай — сверься с паспортом движка. «Правдоподобно ≠ верно».

---
*Источники: [OSideMedia/higgsfield-ai-prompt-skill](https://github.com/OSideMedia/higgsfield-ai-prompt-skill) (MIT) — MCSLA, <200 слов, дисциплина; видео-разборы (same style header, no music, отладочные приёмы, заметки-директивы, «называй модель/формат»); [rediumvex/ai-video-generator-claude](https://github.com/rediumvex/ai-video-generator-claude) (MIT) — язык камеры/света; 4-й слой «направление», негатив против реверса + Runway-positive, синтаксис Hailuo — из research по AI-раскадровке 2026-06 (доки Runway/Kling/MiniMax); identity-блок, 7 принципов и шаблоны лица — из практики промтинга gpt-image-2 (OpenAI Cookbook + fal.ai + Replicate `openai/gpt-image-2` + полевые тесты). Англоязычные образцы — дословные иллюстрации; агент строит промт сам.*
