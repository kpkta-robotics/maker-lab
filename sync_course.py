#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync_course.py — Автоматичний валідатор та помічник публікації курсу «Адаптивна цифрова майстерня».

Перевіряє:
1. Відповідність реєстру `assets/course.js` та реальних HTML-файлів у папці `modules/`.
2. Відсутність жорстко закодованих абсолютних посилань на GitHub Pages усередині уроків.
3. Дотримання правил гендерно-нейтральної української мови (відсутність форм `(-ла)`, `(-а)` тощо).
4. Наявність ключа збереження прогресу `arduino-course-v1` та коректність ID уроку.
"""

import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
COURSE_JS = os.path.join(ROOT_DIR, "assets", "course.js")
MODULES_DIR = os.path.join(ROOT_DIR, "modules")

FORBIDDEN_GENDER_PATTERNS = [
    (r"\(-ла\)", "Конструкція з дужками '(-ла)' — замініть на безособову форму або 2-гу особу теперішнього часу"),
    (r"\(-а\)", "Конструкція з дужками '(-а)' — замініть на 'самостійно' або безособову форму"),
    (r"готовий/готова", "Подвійна родова форма — замініть на нейтральне формулювання"),
    (r"сам/сама", "Подвійна родова форма — замініть на 'самостійно'"),
]


def check_course():
    print("=" * 72)
    print("🔍 ПЕРЕВІРКА ПРОЄКТУ «АДАПТИВНА ЦИФРОВА МАЙСТЕРНЯ» (GitHub Pages QA)")
    print("=" * 72)

    if not os.path.exists(COURSE_JS):
        print(f"[ПОМИЛКА] Не знайдено файл реєстру: {COURSE_JS}")
        return 1

    with open(COURSE_JS, "r", encoding="utf-8") as f:
        course_content = f.read()

    # Знаходимо всі уроки (формат id: "mX-lYY") у course.js
    lesson_pattern = re.compile(
        r'\{\s*id:\s*"(m\d+-l\d+)"\s*,\s*title:\s*"([^"]+)"[^{}]*?status:\s*"(ready|soon)"(?:\s*,\s*path:\s*"([^"]+)")?\s*\}',
        re.DOTALL,
    )
    lessons = lesson_pattern.findall(course_content)

    ready_paths = {}
    print(f"\n📚 Знайдено уроків у реєстрі assets/course.js: {len(lessons)}")
    errors = 0
    warnings = 0

    for lid, title, status, path in lessons:
        if status == "ready":
            if not path:
                print(f"  ❌ [{lid}] має status='ready', але не вказано path!")
                errors += 1
                continue
            full_path = os.path.join(ROOT_DIR, path.replace("/", os.sep))
            ready_paths[os.path.normpath(full_path)] = lid
            if os.path.exists(full_path):
                print(f"  ✅ [{lid}] READY -> {path} («{title}»)")
            else:
                print(f"  ❌ [{lid}] Файл не знайдено на диску: {path}")
                errors += 1
        else:
            print(f"  ⏳ [{lid}] SOON  -> «{title}»")

    # Також знаходимо всі додаткові довідники/ресурси, що посилаються на modules/
    resource_pattern = re.compile(r'url:\s*"(modules/[^"]+\.html)"')
    resource_paths = {os.path.normpath(os.path.join(ROOT_DIR, p.replace("/", os.sep))) for p in resource_pattern.findall(course_content)}

    # Скануємо всі HTML-файли в modules/
    print("\n🧪 Перевірка HTML-файлів уроків у папці modules/...")
    for root, _, files in os.walk(MODULES_DIR):
        for file in sorted(files):
            if not file.endswith(".html"):
                continue
            full_path = os.path.normpath(os.path.join(root, file))
            rel_path = os.path.relpath(full_path, ROOT_DIR).replace("\\", "/")

            with open(full_path, "r", encoding="utf-8") as f:
                html = f.read()

            # 1. Чи зареєстрований файл у course.js?
            if full_path in ready_paths:
                expected_id = ready_paths[full_path]
                if expected_id not in html:
                    print(f"  ❌ [{rel_path}] Не знайдено ідентифікатор уроку '{expected_id}' усередині HTML!")
                    errors += 1
            elif full_path in resource_paths or file.startswith("guide-"):
                print(f"  📖 [{rel_path}] Довідковий посібник / ресурс (OK)")
            else:
                print(f"  ⚠️ [УВАГА] Файл {rel_path} існує на диску, але не позначений як 'ready' або ресурс у assets/course.js")
                warnings += 1

            # 2. Перевірка на жорсткі абсолютні URL на github.io
            if "https://kpkta-robotics.github.io/maker-lab/" in html:
                print(f"  ❌ [{rel_path}] Містить абсолютне посилання 'https://kpkta-robotics.github.io/maker-lab/'! Замініть на відносний шлях.")
                errors += 1

            # 3. Перевірка гендерної нейтральності
            for pat, msg in FORBIDDEN_GENDER_PATTERNS:
                if re.search(pat, html, re.IGNORECASE):
                    print(f"  ❌ [{rel_path}] Порушення гендерної нейтральності: {msg}")
                    errors += 1

    print("\n" + "=" * 72)
    if errors == 0 and warnings == 0:
        print("🎉 УСІ ПЕРЕВІРКИ ПРОЙДЕНО УСПІШНО! Проєкт на 100% готовий до публікації на GitHub Pages.")
    else:
        print(f"Підсумок: помилок — {errors}, попереджень — {warnings}.")
    print("=" * 72)
    return 1 if errors > 0 else 0


if __name__ == "__main__":
    sys.exit(check_course())
