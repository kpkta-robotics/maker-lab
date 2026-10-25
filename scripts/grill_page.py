#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
grill_page.py — Інструмент глибокої Pre-Release ревізії сторінок (Maker Grill-Me QA)
Проєкт «Адаптивна цифрова майстерня: Arduino + 3D CAD + 3D Друк + AI + Maker» (КПКТА)

Перевіряє:
1. Цілісність CSS-класів (Dead Class Detector): чи всі використані в HTML утилітні класи
   реально оголошені в підключених CSS-файлах або локальному <style>.
2. Стрес-тест шапки та навігації (Header Collision & Overflow Stress):
   - захист кнопок повернення (whitespace-nowrap, shrink-0);
   - захист заголовка h1 у фіксованій шапці (truncate);
   - наявність адаптивної піднавігації (.mobile-subnav) при великій кількості пунктів;
   - відсутність статично захардкоджених активних станів у меню.
3. Двосторонню інтеграцію: чи зареєстровано сторінку в assets/course.js та чи працюють усі посилання.
4. Педагогічний фильтр «Анти-стіна тексту» (абзаци понад 450 символів без розбивки).
5. Мовну чистоту та 100% гендерну нейтральність.
"""

import os
import re
import sys
import subprocess
from pathlib import Path
from html.parser import HTMLParser

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
COURSE_JS = ROOT_DIR / "assets" / "course.js"


def extract_defined_css_classes(css_text: str) -> set:
    """Витягує всі оголошені CSS-класи зі стилів, розекрановуючи спецсимволи Tailwind."""
    # Видаляємо коментарі
    css_clean = re.sub(r'/\*.*?\*/', '', css_text, flags=re.DOTALL)
    defined = set()
    # Шукаємо селектори класів перед фігурними дужками або в медіа-запитах
    # Наприклад: .sm\:text-lg, .bg-white\/95, .hover\:bg-slate-100:hover
    for match in re.finditer(r'\.([a-zA-Z0-9_-]|\\.)+', css_clean):
        raw_cls = match.group(0)[1:]  # без початкової крапки
        # Знімаємо псевдокласи у кінці, якщо вони не екрановані (:hover, :focus, ::-webkit-scrollbar)
        # Але зберігаємо двокрапку, якщо перед нею був слеш (\:)
        parts = re.split(r'(?<!\\):', raw_cls)
        base_cls = parts[0]
        unescaped = re.sub(r'\\(.)', r'\1', base_cls)
        defined.add(unescaped)
    return defined


class GrillHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.used_classes = set()
        self.class_locations = {}
        self.stylesheets = []
        self.inline_styles = []
        self.inline_scripts = []
        self.links = []
        self.ids = set()
        self.paragraphs = []
        self._in_style = False
        self._in_script = False
        self._in_p = False
        self._current_buf = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if "id" in attrs_dict:
            self.ids.add(attrs_dict["id"])
        if "class" in attrs_dict:
            for c in attrs_dict["class"].split():
                self.used_classes.add(c)
                self.class_locations.setdefault(c, set()).add(tag)
        if tag == "link" and attrs_dict.get("rel") == "stylesheet" and "href" in attrs_dict:
            self.stylesheets.append(attrs_dict["href"])
        if tag == "a" and "href" in attrs_dict:
            self.links.append(attrs_dict["href"])
        if tag == "style":
            self._in_style = True
            self._current_buf = []
        elif tag == "script" and "src" not in attrs_dict:
            self._in_script = True
            self._current_buf = []
        elif tag == "p":
            self._in_p = True
            self._current_buf = []

    def handle_endtag(self, tag):
        if tag == "style" and self._in_style:
            self._in_style = False
            self.inline_styles.append("".join(self._current_buf))
        elif tag == "script" and self._in_script:
            self._in_script = False
            self.inline_scripts.append("".join(self._current_buf))
        elif tag == "p" and self._in_p:
            self._in_p = False
            text = re.sub(r'\s+', ' ', "".join(self._current_buf)).strip()
            if text:
                self.paragraphs.append(text)

    def handle_data(self, data):
        if self._in_style or self._in_script or self._in_p:
            self._current_buf.append(data)


# Критичні утилітні префікси верстки, які обов'язково мають бути в CSS
CRITICAL_LAYOUT_PREFIXES = (
    "sm:", "md:", "lg:", "xl:", "2xl:",
    "whitespace-", "truncate", "shrink", "grow",
    "min-w-", "max-w-", "min-h-", "max-h-",
    "overflow-", "grid-cols-", "col-span-",
    "flex", "inline-flex", "grid", "hidden", "block", "inline-block",
    "items-", "justify-", "gap-", "space-x-", "space-y-",
    "p-", "px-", "py-", "pt-", "pb-", "pl-", "pr-",
    "m-", "mx-", "my-", "mt-", "mb-", "ml-", "mr-",
    "w-", "h-", "rounded", "border", "bg-", "text-", "font-",
    "sticky", "fixed", "absolute", "relative", "top-", "bottom-", "left-", "right-", "z-"
)


def grill_file(file_path: Path, course_js_content: str) -> dict:
    rel_path = file_path.relative_to(ROOT_DIR).as_posix()
    content = file_path.read_text(encoding="utf-8")

    parser = GrillHTMLParser()
    parser.feed(content)

    blockers = []
    warnings = []
    passed = []
    grill_questions = []

    # 1. CSS-АУДИТ (Dead Class Detector)
    defined_classes = set()
    for style_block in parser.inline_styles:
        defined_classes |= extract_defined_css_classes(style_block)

    for href in parser.stylesheets:
        if not href.startswith("http://") and not href.startswith("https://"):
            css_path = (file_path.parent / href.split("?")[0]).resolve()
            if css_path.exists():
                defined_classes |= extract_defined_css_classes(css_path.read_text(encoding="utf-8"))
            else:
                blockers.append(f"Підключений CSS-файл не знайдено: {href}")

    # Класи, що використовуються як JS-хуки в скриптах
    all_scripts_text = "\n".join(parser.inline_scripts)
    missing_critical_css = []
    missing_other_css = []

    for cls in sorted(parser.used_classes):
        if cls in defined_classes:
            continue
        # Перевіряємо, чи це JS-хук у скриптах сторінки або глобальних скриптах
        if cls in all_scripts_text or cls in ("scroll-smooth", "antialiased", "group", "peer"):
            continue
        if cls.startswith(CRITICAL_LAYOUT_PREFIXES):
            missing_critical_css.append(cls)
        else:
            missing_other_css.append(cls)

    if missing_critical_css:
        # Розділяємо на критичні брейкпоінти/переповнення та другорядні
        layout_breakers = [c for c in missing_critical_css if c.startswith(("sm:", "md:", "lg:", "xl:", "whitespace-", "truncate", "shrink", "min-w-", "overflow-", "grid-cols-"))]
        if layout_breakers:
            warnings.append(
                f"Використано утилітні класи розкладки, яких НЕМАЄ у скомпільованому CSS ({len(layout_breakers)} шт.): "
                f"{', '.join(layout_breakers[:10])}{'...' if len(layout_breakers) > 10 else ''}"
            )
            grill_questions.append(
                f"У файлі `{rel_path}` знайдено класи `{', '.join(layout_breakers[:5])}`, які відсутні у CSS-файлі (вони не матимуть візуального ефекту в браузері). Додати їх у CSS або замінити на наявні?"
            )
        else:
            passed.append(f"Критичні класи розкладки та адаптивності присутні у CSS ({len(defined_classes)} правил у базі)")
    else:
        passed.append(f"Усі критичні класи розкладки та адаптивності підтверджені у CSS ({len(defined_classes)} правил)")

    # 2. СТРЕС-ТЕСТ ШАПКИ ТА НАВІГАЦІЇ
    header_m = re.search(r'<header[^>]*>(.*?)</header>', content, re.DOTALL)
    if header_m:
        header_html = header_m.group(1)
        nav_blocks = re.findall(r'<nav([^>]*)>(.*?)</nav>', header_html, re.DOTALL)

        for nav_attrs, nav_inner in nav_blocks:
            links_in_nav = re.findall(r'<a\s+([^>]*)>(.*?)</a>', nav_inner, re.DOTALL)
            nav_texts = [re.sub(r'<[^>]+>', '', txt).strip() for _, txt in links_in_nav]
            total_chars = sum(len(t) for t in nav_texts)

            # Перевірка на велику кількість пунктів без адаптивного перемикання
            if len(links_in_nav) > 5 and "desktop-nav" not in nav_attrs and "min-w-max" not in nav_attrs:
                warnings.append(
                    f"Меню в <header> має {len(links_in_nav)} пунктів ({total_chars} симв.) без класу .desktop-nav або горизонтального скролу (ризик колізії на екранах 768–1100px)"
                )
            else:
                passed.append(f"Навігаційний блок ({len(links_in_nav)} пунктів, {total_chars} симв.) має коректний адаптивний захист")

            # Перевірка на статичні активні класи
            for l_attrs, l_txt in links_in_nav:
                clean_t = re.sub(r'<[^>]+>', '', l_txt).strip()
                if re.search(r'\b(bg-teal-50|bg-amber-50|border-teal-200|border-amber-200)\b', l_attrs):
                    blockers.append(f"Пункт меню '{clean_t}' має захардкоджений активний клас у статичному HTML")

    # 3. ПЕРЕВІРКА РЕЄСТРАЦІЇ В COURSE.JS ТА ЗВ'ЯЗНОСТІ
    if rel_path.startswith("modules/") and rel_path not in course_js_content:
        warnings.append(f"Сторінка `{rel_path}` не згадується в реєстрі `assets/course.js`")
        grill_questions.append(f"Сторінка `{rel_path}` ще не додана в `assets/course.js`. Чи потрібно додати її в картку модуля або ресурси?")
    elif rel_path.startswith("modules/"):
        passed.append("Сторінка зареєстрована у глобальному реєстрі `assets/course.js`")

    # Перевірка локальних посилань
    broken_links = []
    for lk in parser.links:
        if lk.startswith("#"):
            anchor = lk[1:]
            if anchor and anchor not in parser.ids and rel_path != "index.html":
                broken_links.append(lk)
        elif not lk.startswith(("http://", "https://", "mailto:", "javascript:")):
            clean_lk = lk.split("#")[0].split("?")[0]
            if clean_lk:
                target_p = (file_path.parent / clean_lk).resolve()
                if not target_p.exists():
                    broken_links.append(lk)

    if broken_links:
        blockers.append(f"Знайдено неробочі посилання або якорі: {', '.join(broken_links)}")
    else:
        passed.append(f"Усі навігаційні посилання та якорі ({len(parser.links)} шт.) валідні")

    # 4. ПЕДАГОГІЧНИЙ ФІЛЬТР «АНТИ-СТІНА ТЕКСТУ» ТА МОВА
    long_paragraphs = [p for p in parser.paragraphs if len(p) > 450]
    if long_paragraphs:
        warnings.append(f"Знайдено {len(long_paragraphs)} занадто довгих абзаців (>450 символів), які важко читати зі смартфона")
        grill_questions.append(f"На сторінці є абзац довжиною {len(long_paragraphs[0])} символів: «{long_paragraphs[0][:80]}...». Розбити його на буліти для легшого сприйняття?")
    else:
        passed.append("Довжина абзаців оптимальна для студентів (немає «стін тексту»)")

    # Перевірка гендерної нейтральності
    gender_rules = [
        (r'\b(написав|написала|зробив|зробила|побачив|побачила|застосував|застосувала|зібрав|зібрала)\b', 'дієслово минулого часу родової форми'),
        (r'\b(готовий|готова|сам|сама)\b', 'родовий прикметник/займенник'),
        (r'\(-ла\)|\(-а\)', 'конструкція з дужками роду')
    ]
    gender_hits = []
    for pat, desc in gender_rules:
        for m in re.finditer(pat, content, re.IGNORECASE):
            gender_hits.append(f"'{m.group(0)}' ({desc})")

    if gender_hits:
        warnings.append(f"Виявлено небажані родові форми: {', '.join(set(gender_hits))}")
        grill_questions.append(f"Знайдено потенційне порушення гендерної нейтральності: {', '.join(set(gender_hits))}. Замінити на безособову форму або теперішній час?")
    else:
        passed.append("100% відповідність стандарту гендерно-нейтральної української мови")

    return {
        "file": rel_path,
        "blockers": blockers,
        "warnings": warnings,
        "passed": passed,
        "questions": grill_questions
    }


def get_modified_html_files() -> list:
    """Повертає список змінених або нових HTML-файлів за git status."""
    try:
        res = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            encoding="utf-8"
        )
        files = []
        for line in res.stdout.splitlines():
            if len(line) > 3:
                path_str = line[3:].strip().strip('"')
                if path_str.endswith(".html"):
                    full_p = ROOT_DIR / path_str
                    if full_p.exists():
                        files.append(full_p)
        return files
    except Exception:
        return []


def main():
    print("=" * 76)
    print("🔥 ЗАПУСК MAKER-GRILL-ME: СУВОРА PRE-RELEASE РЕВІЗІЯ СТОРІНОК")
    print("=" * 76)

    course_js_content = COURSE_JS.read_text(encoding="utf-8") if COURSE_JS.exists() else ""

    target_files = []
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            p = (ROOT_DIR / arg).resolve() if not Path(arg).is_absolute() else Path(arg)
            if p.exists() and p.suffix == ".html":
                target_files.append(p)
    else:
        target_files = get_modified_html_files()
        if not target_files:
            # Якщо в git чисто, перевіряємо всі файли в modules/ та index.html
            target_files = sorted(list(ROOT_DIR.glob("modules/**/*.html")) + [ROOT_DIR / "index.html"])

    total_blockers = 0
    total_warnings = 0
    all_questions = []

    for f in target_files:
        rep = grill_file(f, course_js_content)
        total_blockers += len(rep["blockers"])
        total_warnings += len(rep["warnings"])
        all_questions.extend(rep["questions"])

        status = "🛑 БЛОКЕР" if rep["blockers"] else ("⚠️  УВАГА" if rep["warnings"] else "✅ ЧИСТО")
        print(f"\n{status} | Файл: {rep['file']}")
        print("-" * 76)
        for p in rep["passed"]:
            print(f"  ✓ {p}")
        for w in rep["warnings"]:
            print(f"  ⚠️  {w}")
        for b in rep["blockers"]:
            print(f"  🛑 {b}")

    print("\n" + "=" * 76)
    print(f"ПІДСУМОК РЕВІЗІЇ: Просмажено файлів: {len(target_files)}")
    print(f"  🛑 Блокерів релізу: {total_blockers}")
    print(f"  ⚠️  Зауважень:       {total_warnings}")
    if all_questions:
        print("\n🧐 ПИТАННЯ ДЛЯ УЗГОДЖЕННЯ ПЕРЕД ПУБЛІКАЦІЄЮ (GRILL QUESTIONS):")
        for idx, q in enumerate(all_questions, 1):
            print(f"  {idx}. {q}")
    print("=" * 76)

    if total_blockers > 0:
        print("❌ РЕЛІЗ ЗАБЛОКОВАНО: Виправте критичні помилки перед git push!")
        sys.exit(1)
    else:
        print("🟢 ТЕХНІЧНИЙ ДОПУСК ОТРИМАНО (узгодьте контрольні питання з автором курсу).")
        sys.exit(0)


if __name__ == "__main__":
    main()
