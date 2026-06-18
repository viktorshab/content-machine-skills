# Фаза 4 — промты под модель (+ отладочные приёмы)

> Промты пишешь ТЫ под конкретный движок, и показываешь человеку заранее — он правит до генерации. Промты на английском (модели понимают лучше); человеку английский знать не нужно — ты строишь промт сам, он подставляет смысл по-русски. Основано на: OSideMedia (формула MCSLA и дисциплина), видео-разборах (отладочные приёмы), rediumvex (язык камеры).

## Формула промта

**MCSLA** (OSideMedia, дословно — грамматика промта): **M**odel · **C**amera · **S**ubject · **L**ook · **A**ction. Самый надёжный порядок изложения — **Subject → Action → Camera → Style**, держать промт **под 200 слов** («tightness over padding» — плотность важнее объёма).

Развёрнутый каркас кадра (библиотека вау-промтов): **субъект + действие + окружение + движение камеры + свет + настроение + стиль**. Субъект — первым, потом сцена.

## Что вшить в КАЖДЫЙ промт

- **Same style header** (ODN, дословно: *«same style header, same lighting, lens, acting style, physics locked across all shots»*) — единый заголовок стиля/света/линзы/физики на все шоты, чтобы ролик выглядел цельным.
- **`no music, only environmental sound effects`** (ODN) — музыку накладываем в монтаже, не в генерации.
- **Identity по референсу, не переописанием** — лицо/товар держим ссылкой на ассет (Фаза 0), а не повторным описанием внешности.
- **Негатив-блок** — общий список того, чего не должно быть (артефакты рук, лишние пальцы, морфинг). Для Veo добавлять `No subtitles` (иначе впечатывает субтитры).

## Кинематографичность (рычаги, что реально «удорожают» кадр)

Из Reddit-практики + библиотеки (брать по одному на кадр, не стакать пять — иначе артефакты):
- **оптика**: `shot on 35mm` / `85mm portrait lens`, `shallow depth of field / bokeh`;
- **named lighting**: `golden hour`, `soft rim light`, `low-key dramatic lighting`, `volumetric light` (предсказуемее, чем «beautiful lighting»);
- **движение камеры** — самый сильный рычаг: всегда называй тип — `slow dolly-in`, `360 orbit`, `tracking shot`, `handheld`, `crane up`; с замедлением смотрится дороже и реже ломает геометрию;
- **плёночный лук**: `subtle film grain`, `anamorphic`, `cinematic color grade`.

## Image-to-video (оживление кадра)

При оживлении уже готовой картинки в промт пишем **только инструкции движения и камеры — картинку НЕ переописываем** (внешность держит сам кадр). Глаголом про движение субъекта, не статикой: не `a man standing`, а `a man slowly turns his head and smiles`. Указывай темп (`slow motion` / `real-time`).

### Промт для frame chaining (следующий клип)
Внешность держит стартовый кадр — промт только про движение/камеру. Образец (библиотека):
`The woman turns from the window and walks toward camera, camera slowly pushes in, handheld, soft window light.`

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
- **Называй модель и формат явно** (a6lAPOo4CXA, дословно): *«обязательно уточняю, в какой модели генерировать… далее формат и качество»* — иначе агент выберет за тебя.
- Можно дать агенту **prompt-builder skill** под конкретный движок (учит точному формату промтов этой модели) — приём из видео.

🛑 **Стоп-гейт фазы 4:** покажи промты и спроси — **«промты сильные? Видео ещё НЕ генерим.»** Анти-рационализация (методслой): имена моделей и форматы НЕ угадывай — сверься с паспортом движка. «Правдоподобно ≠ верно».

---
*Источники: [OSideMedia/higgsfield-ai-prompt-skill](https://github.com/OSideMedia/higgsfield-ai-prompt-skill) (MIT) — MCSLA, <200 слов, дисциплина; видео-разборы (same style header, no music, отладочные приёмы, заметки-директивы, «называй модель/формат»); [rediumvex/ai-video-generator-claude](https://github.com/rediumvex/ai-video-generator-claude) (MIT) — язык камеры/света. Англоязычные образцы — дословные иллюстрации; агент строит промт сам.*
