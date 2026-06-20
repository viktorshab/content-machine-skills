# Библиотека video-промтов под тип кадра (7 шаблонов)

> Готовые шаблоны оживления (image-to-video) под типовые кадры тизера. Каждый — в 4 слоя (действие / камера / направление / стиль) + строка негатива. Берёшь шаблон под свой кадр, подставляешь свой субъект и сцену (тут как пример — мотоцикл/герой, у тебя может быть товар, человек, животное). Структура промта и логика — `03-prompts.md`; ось и continuity bible — `02-brief-shotlist.md`; выбор модели — `05-engines-channels.md`. Источник: research по AI-раскадровке 2026-06 (доки Runway/Kling/MiniMax/Veo).

## Как пользоваться

- **Подставляй свой субъект** вместо «rider/motorcycle» — структура слоёв остаётся.
- **Слой «направление» не выкидывай** — он держит вектор движения (защита от «едет назад»). Направление бери одно на весь ролик из continuity bible.
- **Негатив** — у каждого шаблона своя строка; для Runway negative не работает — переписывай в позитив (см. `03-prompts.md`, раздел про негатив).
- **Hailuo** — команду камеры ставь в начало промта в `[квадратных скобках]`.
- Английский — потому что модели понимают его лучше; ученику знать его не нужно, промт строит ассистент.

## A. Establishing push-in (герой + объект, мир сцены)

```text
Action: The rider stands beside the black cafe-racer motorcycle at sunset. He slowly turns his head toward screen right, focused and calm. The motorcycle remains parked, the headlight softly flickers on, his jacket moves in a light wind.
Camera: slow cinematic push-in from a medium-wide vertical 9:16 frame to a tighter medium shot, subtle handheld realism, no cut.
Direction: the rider's eyeline stays screen right, toward the future direction of travel; the motorcycle faces screen right.
Style: golden hour amber rim light, deep shadows, shallow depth of field, warm reflections on the black fuel tank, realistic premium look.
Negative: reverse motion, sudden cut, camera teleport, identity drift, face morphing, warped motorcycle frame, deformed wheels, flicker, duplicate rider, extra limbs, text, watermark
```
Hailuo: добавь `[Push in]` в начало. Runway: вместо негатива — `Continuous seamless shot; the face stays stable; the motorcycle geometry stays solid; the camera moves smoothly forward.`

## B. Деталь / макро (контакт, фактура)

```text
Action: a close macro shot of the rider's hand sliding slowly across the glossy black fuel tank toward the handlebar; sunset reflections move across the curved metal; tiny dust particles drift in the warm light.
Camera: locked macro camera, very slow push-in, subtle rack focus from the hand to the tank.
Direction: the hand moves from screen left to screen right, matching the established travel direction.
Style: tactile realistic detail, shallow depth of field, warm golden highlights.
Negative: extra fingers, deformed hand, melting skin, warped fuel tank, floating hand, flickering reflections, sudden cut, camera shake, text, watermark
```

## C. Close-up лица (живой взгляд, без дрейфа)

```text
Action: close-up of the rider's face; he breathes calmly, blinks once, and shifts his eyes toward screen right with quiet determination; a light wind moves a few strands of hair and the collar of his jacket.
Camera: almost static close-up, very subtle dolly-in, stable framing, no head turn beyond a few degrees.
Direction: his eyeline stays screen right, toward the road and the direction of travel.
Style: natural skin texture, golden rim light from screen right, soft shadow opposite, realistic cinematic portrait.
Negative: face morphing, identity drift, melted face, asymmetrical eyes, distorted mouth, flickering skin, sudden smile, large head turn, duplicate face, jitter, text, watermark
```
Малая амплитуда здесь обязательна — большой поворот головы заставляет модель пересоздать лицо.

## D. Посадка / смена позы

```text
Action: the rider grips the handlebar, steps closer, swings one leg over the black cafe-racer motorcycle, and settles onto the seat with natural body weight; the motorcycle rocks slightly under him.
Camera: medium side shot from the cafe side of the street, smooth handheld tracking in place, slight push-in as he sits.
Direction: the motorcycle faces screen right; the rider's body moves into the bike from screen left toward screen right (setup for forward travel).
Style: realistic weight, grounded physics, sunset backlight, jacket in the wind, subtle dust near the tires.
Negative: floating body, impossible leg motion, extra legs, twisted limbs, deformed hands, warped seat, broken handlebar, motorcycle sliding backward, sudden cut, flicker
```
Если посадка ломает ноги — не оживляй целиком, сделай два чистых кадра (до/после) и используй их как start+end (`04-generate-stitch.md`).

## E. Tracking-проезд с явным направлением (главный фикс «едет назад»)

```text
Action: the rider accelerates the black cafe-racer motorcycle forward from screen left to screen right; the front wheel points screen right; the rider leans forward as the bike gains speed; the wheels rotate correctly; dust and warm light trail behind the rear tire on screen left.
Camera: low side tracking shot, moving parallel with the motorcycle at the same speed, smooth energetic camera, slight road vibration, subtle motion blur.
Direction: clear left-to-right forward travel; the bike never moves backward; it enters from the left third and exits toward the right third.
Style: dynamic sunset street, realistic physics, warm amber highlights, controlled motion blur.
Negative: reverse motion, moving backward, wheels spinning backward, motorcycle sliding sideways, broken wheels, warped spokes, deformed motorcycle geometry, rider detaching from bike, duplicate bike, flicker, sudden cut, camera teleport, text, watermark
```
Hailuo: `[Tracking shot,Truck right]` в начало. Kling Motion Brush: выдели rider+motorcycle одним куском, стрелку — вправо, дальний фон зафиксируй Static Brush. Для этого кадра задавай **start + end** (старт — байк слева, конец — байк справа).

## F. Low-angle динамичный пролёт

```text
Action: the black cafe-racer motorcycle rushes past the camera from screen left to screen right, close to the lens; the front wheel enters first, then the tank and rider pass through frame, then the rear wheel exits, leaving dust and a warm flare behind.
Camera: very low-angle near-ground camera, slight whip-pan following the bike as it passes, fast but readable motion, realistic motion blur, no cut.
Direction: one continuous left-to-right pass; the bike approaches from the left, crosses center, exits right.
Style: high-energy cinematic teaser, sunset flare, asphalt texture, spinning wheel detail, wind and dust.
Negative: reverse pass, backward movement, bike jumping, broken wheel, warped tire, floating motorcycle, rider sliding off, excessive blur, unreadable subject, sudden cut, duplicate motorcycle, flicker, watermark
```

## G. Финальный отъезд от камеры

```text
Action: the rider drives the black cafe-racer motorcycle away from the camera down the sunset street; the motorcycle gets smaller as it recedes into the road perspective; dust and warm golden haze linger behind.
Camera: rear three-quarter wide shot, camera almost locked with a very slow pull-back, road lines lead toward the horizon.
Direction: the motorcycle moves forward away from camera (not toward camera); it recedes into the distance along the center-right perspective line.
Style: elegant cinematic ending, golden sunset silhouette, long shadows, warm haze.
Negative: reverse motion, motorcycle approaching camera, moving backward, scale growing larger, warped road perspective, flickering silhouette, broken wheels, duplicate rider, sudden cut, text, watermark
```
Для надёжного направления — пара start/end: старт — байк близко к камере; конец — байк маленький вдали, дорога ведёт к закату.

---
*Источник: research по AI-раскадровке и оживлению 2026-06, на основе доков Runway (motion-first, разделение камера/субъект), Kling (Start/End, Motion Brush), MiniMax/Hailuo (`[command]`-синтаксис), Veo. Шаблоны — адаптация под раскадровку; не дословные цитаты. Субъект/сцену подставляешь свои.*
