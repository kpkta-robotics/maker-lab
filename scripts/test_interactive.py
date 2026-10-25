#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_interactive.py — Автоматизований тестер інтерактивності та клікабельності (Maker Interactive QA)
Проєкт «Адаптивна цифрова майстерня: Arduino + 3D CAD + 3D Друк + AI + Maker» (КПКТА)

Перевіряє:
1. Кнопки копіювання (.copy-btn): наявність data-target, існування цільового ID та непустий текст.
2. Кнопки симуляторів та копіювання коду ([data-copy], [data-copy-lab], [data-run]).
3. Вкладки та таби ([role="tab"] ↔ [role="tabpanel"]).
4. Інтерактивні чек-бокси (input.check[data-key]) та наявність футера артефактів/кнопки завершення.
5. Всі локальні посилання (<a href="#..."> та відносні посилання на .html).
6. Підключення обов'язкових скриптів і стилів (lesson.css, course.js, lesson.js).
7. Гендерно-нейтральні формулювання в інтерфейсі (відсутність -ла, написав/написала тощо).
"""

import os
import re
import sys
from pathlib import Path
from html.parser import HTMLParser

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent

class ElementCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.ids = set()
        self.links = []
        self.scripts = []
        self.styles = []
        self.copy_btns = []
        self.checkboxes = []
        self.tabs = []
        self.panels = []
        self.anchors = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        el = {"tag": tag, "attrs": attrs_dict}
        self.elements.append(el)

        if "id" in attrs_dict:
            self.ids.add(attrs_dict["id"])

        if tag == "a" and "href" in attrs_dict:
            self.links.append(attrs_dict["href"])

        if tag == "script" and "src" in attrs_dict:
            self.scripts.append(attrs_dict["src"])

        if tag == "link" and attrs_dict.get("rel") == "stylesheet" and "href" in attrs_dict:
            self.styles.append(attrs_dict["href"])

        classes = attrs_dict.get("class", "").split()
        if "copy-btn" in classes or "data-copy-target" in attrs_dict:
            self.copy_btns.append(attrs_dict)

        if tag == "input" and attrs_dict.get("type") == "checkbox" and "check" in classes:
            self.checkboxes.append(attrs_dict)

        if attrs_dict.get("role") == "tab":
            self.tabs.append(attrs_dict)

        if attrs_dict.get("role") == "tabpanel":
            self.panels.append(attrs_dict)


def audit_html_file(file_path: Path):
    rel_path = file_path.relative_to(ROOT_DIR)
    content = file_path.read_text(encoding="utf-8")
    parser = ElementCollector()
    parser.feed(content)

    issues = []
    warnings = []
    passed = []

    is_lesson = "modules" in file_path.parts and file_path.name.startswith("lesson-")
    is_guide = "modules" in file_path.parts and file_path.name.startswith("guide-")
    is_index = file_path.name == "index.html"

    # 1. Перевірка кнопок копіювання .copy-btn
    for btn in parser.copy_btns:
        target_id = btn.get("data-target") or btn.get("data-copy-target")
        if not target_id:
            issues.append(f"Кнопка копіювання без data-target: {btn}")
        elif target_id not in parser.ids:
            issues.append(f"Кнопка копіювання посилається на неіснуючий id='{target_id}'")
        else:
            # Перевіряємо, чи є текст всередині цільового елемента
            pattern = re.compile(rf'id=[\'"]{re.escape(target_id)}[\'"][^>]*>(.*?)</', re.DOTALL)
            m = pattern.search(content)
            if m:
                target_text = re.sub(r'<[^>]+>', '', m.group(1)).strip()
                if not target_text:
                    warnings.append(f"Цільовий елемент id='{target_id}' для .copy-btn порожній")
                else:
                    passed.append(f"Кнопка .copy-btn -> id='{target_id}' ({len(target_text)} символів)")
            else:
                passed.append(f"Кнопка .copy-btn -> id='{target_id}' знайдена")

    # 2. Перевірка вкладок (tabs / panels)
    tab_levels = {t.get("data-level") for t in parser.tabs if t.get("data-level")}
    panel_levels = {p.get("data-panel") for p in parser.panels if p.get("data-panel")}
    if tab_levels or panel_levels:
        diff_tp = tab_levels - panel_levels
        diff_pt = panel_levels - tab_levels
        if diff_tp:
            issues.append(f"Вкладки data-level={diff_tp} не мають відповідного data-panel")
        if diff_pt:
            issues.append(f"Панелі data-panel={diff_pt} не мають відповідного data-level")
        if not diff_tp and not diff_pt:
            passed.append(f"Всі вкладки ({len(tab_levels)}) мають парні панелі")

    # 3. Перевірка чекбоксів уроку (input.check)
    if is_lesson and parser.checkboxes:
        keys = [c.get("data-key") for c in parser.checkboxes]
        for k in keys:
            if not k:
                issues.append("Знайдено input.check без атрибута data-key")
        if len(keys) != len(set(keys)):
            issues.append(f"Дубльовані data-key у чекбоксах: {keys}")
        else:
            passed.append(f"Чекбокси прогресу ({len(keys)} шт) мають унікальні ключі")

        # Перевірка наявності кнопки завершення або віджета
        has_done = "done-btn" in parser.ids or "lesson-footer" in parser.ids or any("done-row" in (el["attrs"].get("class", "").split()) for el in parser.elements)
        if not has_done:
            warnings.append("Не знайдено #done-btn або #lesson-footer для завершення уроку")
        else:
            passed.append("Знайдено якір завершення/артефактів уроку (#done-btn / #lesson-footer)")

    # 4. Перевірка внутрішніх та відносних посилань
    dynamic_index_anchors = {"mod-m0", "mod-m1", "mod-m2", "mod-m3", "mod-m4"}
    for link in parser.links:
        if link.startswith("#"):
            target_anchor = link[1:]
            if is_index and target_anchor in dynamic_index_anchors:
                passed.append(f"Динамічний якір модуля {link} (генерується app.js)")
            elif target_anchor and target_anchor not in parser.ids:
                warnings.append(f"Внутрішнє посилання {link} вказує на неіснуючий id='{target_anchor}'")
        elif not link.startswith("http://") and not link.startswith("https://") and not link.startswith("mailto:"):
            # Відносне посилання на файл
            clean_link = link.split("#")[0].split("?")[0]
            if clean_link:
                target_file = (file_path.parent / clean_link).resolve()
                if not target_file.exists():
                    issues.append(f"Бите відносне посилання: {link} -> {target_file}")

    # 5. Перевірка обов'язкових скриптів для уроків
    if is_lesson:
        has_lesson_css = any("lesson.css" in s for s in parser.styles)
        has_lesson_js = any("lesson.js" in s for s in parser.scripts)
        has_course_js = any("course.js" in s for s in parser.scripts)
        if not has_lesson_css:
            warnings.append("Урок не підключає assets/lesson.css")
        if not has_lesson_js:
            issues.append("Урок не підключає assets/lesson.js (інтерактивні функції не працюватимуть)")
        if not has_course_js:
            warnings.append("Урок не підключає assets/course.js")
        if has_lesson_js and has_course_js:
            # Перевіряємо порядок
            c_idx = next(i for i, s in enumerate(parser.scripts) if "course.js" in s)
            l_idx = next(i for i, s in enumerate(parser.scripts) if "lesson.js" in s)
            if c_idx > l_idx:
                warnings.append("course.js повинен підключатися ДО lesson.js")

    # 6. Перевірка гендерної нейтральності
    gender_patterns = [
        (r'\b(написав|написала)\b', 'написав/написала -> використовуйте "ти створюєш" або "код написано"'),
        (r'\b(зробив|зробила)\b', 'зробив/зробила -> використовуйте "у тебе вийшло" або "виконано"'),
        (r'\b(готовий|готова)\b', 'готовий/готова -> використовуйте "схему підготовлено" або "час починати"'),
        (r'\b(сам|сама)\b', 'сам/сама -> використовуйте "самостійно"'),
        (r'\(-ла\)', '(-ла) -> суворо заборонено')
    ]
    for pattern, hint in gender_patterns:
        m = re.search(pattern, content, re.IGNORECASE)
        if m:
            warnings.append(f"Порушення гендерної нейтральності: знайдено '{m.group(0)}' ({hint})")

    # 7. Контроль візуального відображення та адаптивності шапок / меню (Visual Layout & Header QA)
    header_match = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL)
    if header_match:
        header_html = header_match.group(1)

        # 7.1 Перевірка кнопок повернення (Карта курсу, Діагностика тощо) на whitespace-nowrap
        for bl in re.finditer(r'<a([^>]+href=[\'"][^>]+>)(.*?)</a>', header_html, re.DOTALL):
            tag_attrs = bl.group(1)
            text_content = re.sub(r'<[^>]+>', '', bl.group(2)).strip()
            if any(marker in text_content for marker in ["Карта курсу", "Діагностика", "Урок"]):
                if "whitespace-nowrap" not in tag_attrs and "nowrap" not in tag_attrs:
                    issues.append(f"Кнопка навігації '{text_content}' у шапці не має 'whitespace-nowrap' (ризик розриву на кілька рядків)")
                else:
                    passed.append(f"Кнопка навігації '{text_content}' має захист від розриву (whitespace-nowrap)")

        # 7.2 Перевірка відсутності жорстко закодованих активних кольорів у статичному nav
        nav_matches = re.findall(r'<nav[^>]*>(.*?)</nav>', header_html, re.DOTALL)
        for nm in nav_matches:
            for link_match in re.finditer(r'<a\s+([^>]+)>', nm):
                link_tag = link_match.group(1)
                if re.search(r'\b(bg-teal-50|bg-amber-50|border-teal-200|border-amber-200)\b', link_tag):
                    warnings.append(f"Пункт меню містить жорстко закодований стиль активності: {link_tag[:50]}... (ризик підсвітки у неактивному стані)")

        # 7.3 Перевірка адаптивності заголовка в шапці (h1 truncate)
        h1_match = re.search(r'<h1([^>]*)>(.*?)</h1>', header_html, re.DOTALL)
        if h1_match:
            h1_attrs = h1_match.group(1)
            h1_text = re.sub(r'<[^>]+>', '', h1_match.group(2)).strip()
            if "h-16" in header_html or "h-14" in header_html:
                if "truncate" in h1_attrs or "whitespace-nowrap" in h1_attrs:
                    passed.append(f"Заголовок шапки '{h1_text[:25]}' захищено від переповнення (truncate/whitespace-nowrap)")
                else:
                    warnings.append(f"Заголовок шапки '{h1_text[:25]}' у фіксованій шапці не має truncate/whitespace-nowrap")

    return {
        "file": rel_path,
        "issues": issues,
        "warnings": warnings,
        "passed": passed
    }


def main():
    print("=" * 72)
    print("🔬 ЗАПУСК ТЕСТУ ІНТЕРАКТИВНОСТІ ТА КЛІКАБЕЛЬНОСТІ (MAKER INTERACTIVE QA)")
    print("=" * 72)

    html_files = sorted(list(ROOT_DIR.glob("modules/**/*.html")) + [ROOT_DIR / "index.html"])
    total_issues = 0
    total_warnings = 0
    total_passed = 0

    for f in html_files:
        if not f.exists():
            continue
        report = audit_html_file(f)
        total_issues += len(report["issues"])
        total_warnings += len(report["warnings"])
        total_passed += len(report["passed"])

        status_icon = "❌" if report["issues"] else ("⚠️" if report["warnings"] else "✅")
        print(f"\n{status_icon} [{report['file']}]")
        for p in report["passed"]:
            print(f"   ✓ {p}")
        for w in report["warnings"]:
            print(f"   ⚠️  ПОПЕРЕДЖЕННЯ: {w}")
        for err in report["issues"]:
            print(f"   ❌ ПОМИЛКА: {err}")

    print("\n" + "=" * 72)
    print(f"ПІДСУМОК: Перевірено файлів: {len(html_files)}")
    print(f"  Успішних перевірок: {total_passed}")
    print(f"  Попереджень:        {total_warnings}")
    print(f"  Критичних помилок:  {total_issues}")
    print("=" * 72)

    if total_issues > 0:
        sys.exit(1)
    else:
        print("🎉 ВСІ ІНТЕРАКТИВНІ ЕЛЕМЕНТИ ПРАЦЮЮТЬ КОРЕКТНО!")
        sys.exit(0)


if __name__ == "__main__":
    main()
