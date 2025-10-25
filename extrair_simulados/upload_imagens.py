#!/usr/bin/env python3
import os
import mimetypes
import sys
from supabase import create_client, Client

# CONFIG - Usar variáveis de ambiente para credenciais
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias")
    print("Configure-as antes de executar este script:")
    print("export SUPABASE_URL='sua_url_aqui'")
    print("export SUPABASE_ANON_KEY='sua_chave_aqui'")
    sys.exit(1)

TABLE_NAME = "questoes"
BUCKET = "questoes-images"
LOCAL_DIR = "imagens"

def sanitize_filename(id_questao):
    clean = id_questao.strip("[]")       # remove colchetes
    clean = clean.replace("-", "_")      # troca hífen por underline
    return clean + ".png"

def find_local_image(qid):
    expected = sanitize_filename(qid)          # 104217_A.png
    original = f"[{qid}].png" if not qid.startswith("[") else f"{qid}.png"

    path_original = os.path.join(LOCAL_DIR, original.strip("[]") if original.endswith(".png") else original)
    path_bracket = os.path.join(LOCAL_DIR, original)
    path_sanitized = os.path.join(LOCAL_DIR, expected)

    if os.path.isfile(path_original): return path_original
    if os.path.isfile(path_bracket): return path_bracket
    if os.path.isfile(path_sanitized): return path_sanitized

    return None

def upload_image(supa, qid):
    filename = sanitize_filename(qid)
    local_path = find_local_image(qid)

    if not local_path:
        print(f"⚠️ Imagem não encontrada para {qid} → ignorado")
        return False

    remote_path = f"public/{filename}"
    mime, _ = mimetypes.guess_type(filename)
    mime = mime or "image/png"

    with open(local_path, "rb") as f:
        supa.storage.from_(BUCKET).upload(
            remote_path,
            f.read(),
            {"content-type": mime, "upsert": "true"}
        )

    public_url = supa.storage.from_(BUCKET).get_public_url(remote_path)
    supa.table(TABLE_NAME).update({"url_imagem": public_url}).eq("id_questao_origem", qid).execute()

    print(f"✅ OK → {qid} → {public_url}")
    return True

def main():
    supa = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    print("🧹 Limpando bucket…")
    try:
        files = supa.storage.from_(BUCKET).list("public/")
        if files:
            supa.storage.from_(BUCKET).remove([f"public/{f['name']}" for f in files])
    except Exception:
        pass
    print("✅ Bucket limpo")

    print("🔍 Buscando ha_imagem = true…")
    rows = supa.table(TABLE_NAME).select("id_questao_origem").eq("ha_imagem", True).execute().data
    print(f"→ {len(rows)} imagens para enviar\n")

    count = 0
    for row in rows:
        if upload_image(supa, row["id_questao_origem"]):
            count += 1

    print(f"\n🎉 FINALIZADO — {count} imagens enviadas com sucesso.")

if __name__ == "__main__":
    main()

