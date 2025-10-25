#!/bin/bash
# Script para extrair questões do Simulados-CEA-2024-JULHO.pdf

echo "🔍 Procurando arquivo Simulados-CEA-2024-JULHO.pdf..."

# Verifica se o arquivo existe na pasta backend
if [ -f "Simulados-CEA-2024-JULHO.pdf" ]; then
    echo "✅ Arquivo encontrado na pasta backend!"
    echo "🚀 Iniciando extração..."
    python extrator_pdf.py "Simulados-CEA-2024-JULHO.pdf" -o "CEA_2024_JULHO_extraido" -f both --verbose
elif [ -f "../Simulados-CEA-2024-JULHO.pdf" ]; then
    echo "✅ Arquivo encontrado na pasta principal!"
    echo "🚀 Iniciando extração..."
    python extrator_pdf.py "../Simulados-CEA-2024-JULHO.pdf" -o "CEA_2024_JULHO_extraido" -f both --verbose
else
    echo "❌ Arquivo Simulados-CEA-2024-JULHO.pdf não encontrado!"
    echo ""
    echo "📁 Coloque o arquivo em uma dessas pastas:"
    echo "   1. $(pwd)/Simulados-CEA-2024-JULHO.pdf"
    echo "   2. $(dirname $(pwd))/Simulados-CEA-2024-JULHO.pdf"
    echo ""
    echo "📝 Depois execute:"
    echo "   bash extrair_cea_julho.sh"
    echo ""
    echo "🔍 Ou execute diretamente:"
    echo "   python extrator_pdf.py 'caminho/para/Simulados-CEA-2024-JULHO.pdf'"
fi