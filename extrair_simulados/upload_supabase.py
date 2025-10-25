import os
import csv
import time
import sys
from typing import List, Dict, Any

# ========= CONFIG =========
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias")
    print("Configure-as antes de executar este script:")
    print("export SUPABASE_URL='sua_url_aqui'")
    print("export SUPABASE_ANON_KEY='sua_chave_aqui'")
    sys.exit(1)

TABLE_NAME = "questoes"
CSV_PATH   = "simulados.csv"
BATCH_SIZE = 500
# ==========================

try:
    from supabase import create_client, Client
except Exception as e:
    raise SystemExit(f"❌ Instale com: pip install supabase\nErro: {e}")

def read_csv_rows(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    for r in rows:
        for k in ("id", "simulado_numero"):
            if k in r and r[k] not in (None, "", "NULL", "null"):
                try:
                    r[k] = int(r[k])
                except ValueError:
                    pass

        # ✅ CONVERSÃO CORRETA PARA BOOLEAN
        if "ha_imagem" in r:
            v = str(r["ha_imagem"]).strip().upper()
            r["ha_imagem"] = True if v.startswith("S") else False

        for col in [
            "id","id_questao_origem","tema","enunciado",
            "alternativa_a","alternativa_b","alternativa_c","alternativa_d",
            "resposta_correta","ha_imagem","comentario","simulado_numero"
        ]:
            r.setdefault(col, "")

    return rows

def rls_hint(action: str) -> str:
    return (
        f"\n💡 **Permissão RLS ausente para {action}**\n"
        "No Supabase, vá em **Table Editor → questoes → Policies** e permita essa ação.\n"
        "Ex: USING (true)  ou  USING (auth.role() = 'anon')\n"
    )

def main():
    print("🔗 Conectando ao Supabase…")
    supa: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    print("🩺 Testando permissão de SELECT…")
    try:
        sel = supa.table(TABLE_NAME).select("id", count="exact").limit(1).execute()
        print(f"✅ SELECT OK. Registros atuais na tabela (aprox): {sel.count}")
    except Exception as e:
        print(f"❌ Falhou no SELECT: {e}")
        print(rls_hint("SELECT"))
        return

    print(f"🧹 Apagando TODOS os registros da tabela '{TABLE_NAME}' (via delete)…")
    try:
        supa.table(TABLE_NAME).delete().gt("id", 0).execute()
        print("✅ DELETE total concluído.")
    except Exception as e:
        print(f"❌ Falhou ao apagar: {e}")
        print(rls_hint("DELETE"))
        return

    print(f"📄 Lendo CSV: {CSV_PATH}")
    rows = read_csv_rows(CSV_PATH)
    total = len(rows)
    if total == 0:
        print("⚠️ CSV vazio.")
        return

    print(f"⬆️ Inserindo {total} registros em lotes de {BATCH_SIZE}…")
    inserted = 0
    for i in range(0, total, BATCH_SIZE):
        batch = rows[i:i+BATCH_SIZE]
        try:
            supa.table(TABLE_NAME).insert(batch).execute()
            inserted += len(batch)
            print(f"✅ Lote {i//BATCH_SIZE + 1}: {len(batch)} ok (total {inserted}/{total})")
            time.sleep(0.2)
        except Exception as e:
            print(f"❌ Erro no INSERT: {e}")
            print(rls_hint("INSERT"))
            return

    print("🎉 CONCLUÍDO COM SUCESSO!")
    print(f"→ Registros inseridos: {inserted}")

if __name__ == "__main__":
    main()

