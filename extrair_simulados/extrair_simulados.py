#!/usr/bin/env python3
import re
import os
import csv
import fitz  # PyMuPDF

PDF_PATH = "Simulados-CEA-2024-JULHO.pdf"
CSV_OUT  = "simulados.csv"
IMG_DIR  = "imagens"

os.makedirs(IMG_DIR, exist_ok=True)

# ---------------- Tema por palavras-chave ----------------
THEME_RULES = [
    ("Sistema Financeiro e Regulação", r"\b(CVM|BACEN|BCB|SUSEP|PREVIC|ANBIMA|CMN|COPOM|regula(ç|c)ão|c[oó]digo anbima)\b"),
    ("Produtos e Investimentos", r"\b(CDB|LCI|LCA|CRI|CRA|LFT|LTN|NTN|deb(e|ê)ntur|ETF|fundos?|a[cç]ões?|poupan(ç|c)a|tesouro|COE|FIDC)\b"),
    ("Análise, Planejamento e Gestão", r"\b(planejamento|rebalanceamento|carteira|aloca(ç|c)[aã]o|CMPC|WACC|VPL|TIR|gest(ã|a)o|or(ç|c)amento)\b"),
    ("Mercado Financeiro e Economia", r"\b(Selic|infla(ç|c)[aã]o|c(â|a)mbio|PIB|balan(ç|c)a comercial|balan(ç|c)a de pagamentos|juros|mercado)\b"),
    ("Ética e Compliance", r"\b(lavagem de dinheiro|insider trading|compliance|[ée]tica|infra(ç|c)[aã]o|COAF)\b"),
    ("Perfil e Comportamento do Investidor", r"\b(perfil do investidor|suitability|comportamental|vi[ée]s|avers(ã|a)o a risco|conservador|moderado|arrojado)\b"),
]
FALLBACK_THEME = "Produtos e Investimentos"

def classify_theme(text: str) -> str:
    t = (text or "").lower()
    for label, pat in THEME_RULES:
        if re.search(pat, t, flags=re.IGNORECASE):
            return label
    return FALLBACK_THEME

# ---------------- Regexes ----------------
# Âncora: número + [ID que pode ter letras/hífen] + enunciado
ANCHOR_RE = re.compile(r"^(\d{1,2})\s+\[([^\]]+)\]\s*(.*)$")

# Rótulos das alternativas SUPER tolerantes:
# aceita 'a) ', 'a ) ', 'a)texto', ' a )texto', maiúsc/minúsc
def alt_label(label: str) -> re.Pattern:
    return re.compile(rf"^\s*{label}\s*\)\s*", re.IGNORECASE)

ALT_A_RE = alt_label("a")
ALT_B_RE = alt_label("b")
ALT_C_RE = alt_label("c")
ALT_D_RE = alt_label("d")

# Fallback em bloco (captura entre marcadores onde quer que estejam, com quebras)
# a) ... b) ... c) ... d) ...
FALLBACK_BLOCK_RE = re.compile(
    r"a\)\s*(.*?)\s*b\)\s*(.*?)\s*c\)\s*(.*?)\s*d\)\s*(.*)$",
    re.IGNORECASE | re.DOTALL
)

# Gabarito
GAB_SIM_HEAD = re.compile(r"CEA:\s*SIMULADO\s*\((\d+)\)", re.IGNORECASE)
GAB_PAIR = re.compile(r"(\d{1,2})\.\s*([ABCD])")

def get_page_blocks(page):
    return page.get_text("blocks")

def get_page_images(page):
    try:
        return page.get_image_info(xrefs=True)
    except Exception:
        infos = []
        for i in page.get_images(full=True):
            xref = i[0]
            infos.append({"xref": xref, "bbox": None, "width": i[2], "height": i[3]})
        return infos

def is_qrcode_like(width, height):
    ratio = width / float(height or 1)
    return (0.85 <= ratio <= 1.15) and (min(width, height) <= 500)

def collect_text_between(all_blocks, start, end):
    (sp, sy) = start
    (ep, ey) = end
    texts = []
    for p in range(sp, ep + 1):
        blocks = all_blocks[p]
        for (x0, y0, x1, y1, text, *_rest) in blocks:
            if not text:
                continue
            if sp == ep:
                cond = (y0 >= sy and y0 < ey)
            elif p == sp:
                cond = (y0 >= sy)
            elif p == ep:
                cond = (y0 < ey)
            else:
                cond = True
            if cond:
                texts.append(text)
    return "\n".join(texts)

def collect_images_between(doc, start, end):
    (sp, sy) = start
    (ep, ey) = end
    found = []
    for p in range(sp, ep + 1):
        page = doc[p]
        infos = get_page_images(page)
        page_h = page.rect.height
        for info in infos:
            xref = info.get("xref")
            bbox = info.get("bbox")
            width = info.get("width", 0)
            height = info.get("height", 0)

            if bbox is None:
                if sp != ep:
                    continue
                center_y = page_h / 2
            else:
                _, y0, _, y1 = bbox
                center_y = (y0 + y1) / 2.0

            if sp == ep and not (center_y >= sy and center_y < ey):
                continue
            if p == sp and ep != sp and center_y < sy:
                continue
            if p == ep and ep != sp and center_y >= ey:
                continue

            if (center_y / page_h) > 0.85:
                continue
            if is_qrcode_like(width, height):
                continue

            try:
                base = doc.extract_image(xref)
                found.append((p, xref, base["image"], width, height))
            except Exception:
                pass
    return found

def normalize_spaces(s: str) -> str:
    # Comprime múltiplos espaços/linhas e remove quebra dupla esquisita
    return re.sub(r"\s+", " ", s or "").strip()

def parse_segment_text(segment_text):
    """
    Retorna: (id_orig, enunciado, alt_a, alt_b, alt_c, alt_d)
    Usa parser linha-a-linha com regex tolerante e, se falhar,
    aplica fallback por bloco (A→B→C→D).
    """
    # 1) Primeiro, tente linha-a-linha
    raw = segment_text
    # preserve \n’s to detectar linhas; depois normalizamos
    lines = [ln.rstrip() for ln in raw.split("\n") if ln.strip()]

    # Achar âncora
    anchor_idx = None
    id_orig = None
    enun_start = ""
    for i, ln in enumerate(lines):
        m = ANCHOR_RE.match(ln.strip())
        if m:
            anchor_idx = i
            _qnum, id_in_br, tail = m.groups()
            id_orig = f"[{id_in_br}]"
            enun_start = tail.strip()
            break

    if anchor_idx is None:
        return None

    enun_parts = [enun_start] if enun_start else []
    a_lines, b_lines, c_lines, d_lines = [], [], [], []
    mode = "enun"

    for ln in lines[anchor_idx + 1:]:
        s = ln.strip()
        if ALT_A_RE.match(s):
            mode = "a"
            a_lines.append(ALT_A_RE.sub("", s))
            continue
        if ALT_B_RE.match(s):
            mode = "b"
            b_lines.append(ALT_B_RE.sub("", s))
            continue
        if ALT_C_RE.match(s):
            mode = "c"
            c_lines.append(ALT_C_RE.sub("", s))
            continue
        if ALT_D_RE.match(s):
            mode = "d"
            d_lines.append(ALT_D_RE.sub("", s))
            continue

        if mode == "enun":
            enun_parts.append(s)
        elif mode == "a":
            a_lines.append(s)
        elif mode == "b":
            b_lines.append(s)
        elif mode == "c":
            c_lines.append(s)
        elif mode == "d":
            d_lines.append(s)

    enunciado = normalize_spaces(" ".join(enun_parts))
    alt_a = normalize_spaces(" ".join(a_lines))
    alt_b = normalize_spaces(" ".join(b_lines))
    alt_c = normalize_spaces(" ".join(c_lines))
    alt_d = normalize_spaces(" ".join(d_lines))

    # 2) Se alguma alternativa ficou vazia, aplica fallback por bloco no texto completo
    if not (alt_a and alt_b and alt_c and alt_d):
        # Cortar o cabeçalho "NN [ID] ..." e analisar do restante pra frente
        tail_text = "\n".join(lines[anchor_idx:])  # inclui âncora e depois
        # remove a linha de âncora da string para não confundir
        if "\n" in tail_text:
            tail_text = tail_text.split("\n", 1)[1]
        m = FALLBACK_BLOCK_RE.search(tail_text)
        if m:
            a_fb, b_fb, c_fb, d_fb = m.groups()
            alt_a = normalize_spaces(a_fb) or alt_a
            alt_b = normalize_spaces(b_fb) or alt_b
            alt_c = normalize_spaces(c_fb) or alt_c
            alt_d = normalize_spaces(d_fb) or alt_d

    return id_orig, enunciado, alt_a, alt_b, alt_c, alt_d

def extract_all():
    with fitz.open(PDF_PATH) as doc:
        all_blocks = [get_page_blocks(doc[p]) for p in range(len(doc))]
        anchors = []
        for p in range(len(doc)):
            for (x0, y0, x1, y1, text, *_rest) in all_blocks[p]:
                if not text:
                    continue
                for ln in text.split("\n"):
                    s = ln.strip()
                    if s and ANCHOR_RE.match(s):
                        anchors.append({"page": p, "y0": y0, "start_line": s})
        anchors.sort(key=lambda a: (a["page"], a["y0"]))

        segments = []
        for i, a in enumerate(anchors):
            start = (a["page"], a["y0"])
            if i < len(anchors) - 1:
                nxt = anchors[i + 1]
                end = (nxt["page"], nxt["y0"])
            else:
                end = (len(doc) - 1, float("inf"))
            segments.append({"start": start, "end": end})

        # Gabarito
        gabaritos = {}
        current_sim = None
        for p in range(len(doc)):
            text = doc[p].get_text("text")
            for line in text.split("\n"):
                head = GAB_SIM_HEAD.search(line)
                if head:
                    current_sim = int(head.group(1))
                    if current_sim not in gabaritos:
                        gabaritos[current_sim] = {}
                for num, letter in GAB_PAIR.findall(line):
                    if current_sim:
                        gabaritos[current_sim][int(num)] = letter.upper().strip()

        rows = []
        for i, seg in enumerate(segments):
            raw = collect_text_between(all_blocks, seg["start"], seg["end"])
            parsed = parse_segment_text(raw)
            if not parsed:
                continue
            id_orig, enunciado, a, b, c, d = parsed

            imgs = collect_images_between(doc, seg["start"], seg["end"])
            ha_img = (len(imgs) > 0)
            for idx, (_p, _xref, img_bytes, _w, _h) in enumerate(imgs):
                base = id_orig if idx == 0 else (id_orig[:-1] + f"_{idx}]")
                with open(os.path.join(IMG_DIR, f"{base}.png"), "wb") as f:
                    f.write(img_bytes)

            qid = len(rows) + 1
            simulado_numero = (qid - 1) // 70 + 1
            tema = classify_theme(" ".join([enunciado or "", a or "", b or "", c or "", d or ""]))

            rows.append({
                "id": qid,
                "id_questao_origem": id_orig,
                "tema": tema,
                "enunciado": enunciado,
                "alternativa_a": a,
                "alternativa_b": b,
                "alternativa_c": c,
                "alternativa_d": d,
                "resposta_correta": "",
                "ha_imagem": "SIM" if ha_img else "NAO",
                "comentario": "",
                "simulado_numero": simulado_numero
            })

        # Preenche gabarito
        for q in rows:
            sim = q["simulado_numero"]
            within = ((q["id"] - 1) % 70) + 1
            q["resposta_correta"] = gabaritos.get(sim, {}).get(within, "")

        # CSV (sobrescreve)
        header = ["id","id_questao_origem","tema","enunciado",
                  "alternativa_a","alternativa_b","alternativa_c","alternativa_d",
                  "resposta_correta","ha_imagem","comentario","simulado_numero"]
        with open(CSV_OUT, "w", encoding="utf-8", newline="") as f:
            wr = csv.DictWriter(f, fieldnames=header)
            wr.writeheader()
            for r in rows:
                wr.writerow(r)

        print("✅ Extração concluída (alternativas robustas).")
        print(f"→ CSV sobrescrito: {CSV_OUT}")
        print(f"→ Imagens: {IMG_DIR}/")

if __name__ == "__main__":
    extract_all()

