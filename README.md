# Content Machine Skills

Скиллы для код-агентов (**Claude Code** / **Codex**), которые превращают идею в готовый контент. Командуешь словами — агент сам идёт в нужный сервис, генерирует и приносит результат.

## Скиллы в наборе

| Скилл | Что делает |
|---|---|
| **storyboard-builder** | Из одной фразы-идеи собирает мини-ролик «как режиссёр»: креативный бриф → ассеты (лицо/товар/локация) → шотлист → промты → кадры-картинки → оживление в видео → склейка в тизер. Держит одно лицо во всех кадрах, делает плавные переходы и не сжигает кредиты — останавливается и спрашивает «ок?» перед каждой тратой. |

## Установка

```bash
# для Claude Code
npx skills add viktorshab/content-machine-skills --agent claude-code

# для Codex
npx skills add viktorshab/content-machine-skills --agent codex
```

После установки агент подхватывает скилл автоматически. Запуск — обычной фразой, например:

> собери раскадровку: я владелец кофейни, эффектный тизер нового сезонного меню, 9:16, 7 кадров, на ключевых кадрах — моё лицо

## Что нужно, чтобы скилл работал

Подключённый **канал генерации** картинок и видео — на выбор:
- **Higgsfield** (через MCP, одной командой, вход в браузере) — самый низкий порог;
- **Replicate** (по ключу-токену, оплата по факту центами) — больше моделей и контроля.

Скилл не дёргает API руками — он просит агента сгенерировать через ваш подключённый канал.

## Как устроен storyboard-builder

- `SKILL.md` — ядро: дух, 6 законов (image-first, один референс лица, frame chaining, стоп-гейт перед тратой, «не правишь промт руками — даёшь заметки», одна ось движения), конвейер из 8 фаз со стоп-гейтами, методслой и границы.
- `references/01-assets-phase0.md` — ассеты-«паспорта» (лицо/товар/локация/пропсы) и тест связки.
- `references/02-brief-shotlist.md` — креативный бриф → референсы → шотлист.
- `references/03-prompts.md` — формула промта (MCSLA), identity-lock лица (7 принципов + готовый промт-шаблон + чек-лист по landmark + частые ошибки), единый style header, отладочные приёмы.
- `references/04-generate-stitch.md` — генерация кадров, оживление (frame chaining), склейка (ffmpeg), папки проекта.
- `references/05-engines-channels.md` — Higgsfield / Replicate / Flux LoRA, выбор модели (Kling 3.0 Omni под лицо, nano-banana / gpt-image-2 для кадров), безопасность ключа.
- `references/06-prompt-library.md` — 7 готовых video-шаблонов под тип кадра (establishing push-in, макро-деталь, close-up лица, посадка, tracking-проезд, low-angle пролёт, финальный отъезд).

## Благодарности (источники методики)

Скилл собран на основе публичных материалов:
- референс-каркас (папки `attempts/approved/disapproved`, approval-gates, frame anchoring, ffmpeg-склейка) — [Samin12/ai-storyboard-video-starter](https://github.com/Samin12/ai-storyboard-video-starter) (MIT);
- дисциплина промтинга (формула MCSLA, «plausibility is not validity») — [OSideMedia/higgsfield-ai-prompt-skill](https://github.com/OSideMedia/higgsfield-ai-prompt-skill) (MIT);
- identity-lock (Soul ID) и безопасная работа с ключом — [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills) (MIT);
- язык камеры/света — [rediumvex/ai-video-generator-claude](https://github.com/rediumvex/ai-video-generator-claude) (MIT);
- методика конвейера и приёмы продакшена — публичные видео-разборы (Higgsfield + Claude).

Методический слой (стоп-гейты, анти-рационализация, проверка результата «чужими глазами») — авторский.

## Лицензия

MIT — см. [LICENSE](LICENSE).
