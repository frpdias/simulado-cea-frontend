# 📄 Extrator de Questões PDF - SIMULADO CEA

Sistema para extrair automaticamente questões, imagens e gabarito de arquivos PDF para uso no sistema SIMULADO-CEA.

## 🚀 Funcionalidades

- ✅ **Extração de Questões**: Identifica automaticamente questões numeradas
- 🖼️ **Extração de Imagens**: Salva todas as imagens do PDF
- 📊 **Extração de Gabarito**: Identifica respostas corretas
- 📝 **Múltiplos Formatos**: Salva em JSON e CSV
- 🎯 **Padrões Flexíveis**: Suporta diferentes formatos de questões
- 🔧 **Configurável**: Padrões personalizáveis via código

## 📦 Instalação

### Pré-requisitos

```bash
# Instalar Python 3.8+ se não tiver
python3 --version

# Instalar dependências
pip install -r requirements.txt
```

### Dependências Principais

```bash
# Básico (escolha um)
pip install PyPDF2          # Para PDFs simples
pip install pdfplumber      # Para PDFs complexos (recomendado)

# Avançado
pip install PyMuPDF         # Para extração de imagens
pip install Pillow          # Processamento de imagens
pip install opencv-python   # Manipulação avançada de imagens
pip install pytesseract     # OCR para PDFs escaneados
```

## 📖 Uso

### Uso Básico

```bash
# Extrair questões de um PDF
python extrator_pdf.py arquivo_simulado.pdf

# Especificar pasta de saída
python extrator_pdf.py arquivo.pdf -o minha_pasta

# Escolher formato de saída
python extrator_pdf.py arquivo.pdf -f json     # Apenas JSON
python extrator_pdf.py arquivo.pdf -f csv      # Apenas CSV
python extrator_pdf.py arquivo.pdf -f both     # Ambos (padrão)

# Modo verboso (para debug)
python extrator_pdf.py arquivo.pdf --verbose
```

### Uso Programático

```python
from extrator_pdf import PDFExtractor

# Criar extrator
extractor = PDFExtractor("simulado.pdf", "pasta_saida")

# Verificar dependências disponíveis
deps = extractor.check_dependencies()

# Extrair tudo
results = extractor.extract_all()

# Salvar resultados
extractor.save_results(results, 'json')

print(f"Questões encontradas: {results['total_questoes']}")
print(f"Imagens extraídas: {results['total_imagens']}")
```

## 📋 Formatos Suportados

### Questões

O extrator reconhece estes padrões de questões:

```
1. Qual é a capital do Brasil?
Questão 1: Qual é a capital do Brasil?
1 - Qual é a capital do Brasil?
Item 1. Qual é a capital do Brasil?
Q1: Qual é a capital do Brasil?
```

### Alternativas

```
a) Brasília
A) Brasília
a. Brasília
A. Brasília
a- Brasília
```

### Gabarito

```
Gabarito: 1a 2b 3c 4d 5e
Respostas: a b c d e
1: a
2: b
3: c
Chave de Respostas: abcde
```

## 📊 Estrutura de Saída

### JSON (questoes_extraidas.json)

```json
{
  "arquivo_origem": "simulado.pdf",
  "total_questoes": 50,
  "total_imagens": 15,
  "questoes": [
    {
      "numero": 1,
      "enunciado": "Qual é a capital do Brasil?",
      "alternativas": [
        {"letra": "a", "texto": "São Paulo"},
        {"letra": "b", "texto": "Rio de Janeiro"},
        {"letra": "c", "texto": "Brasília"},
        {"letra": "d", "texto": "Salvador"}
      ],
      "gabarito": "c",
      "tipo": "multipla_escolha",
      "tema": "",
      "dificuldade": "media",
      "imagens": []
    }
  ],
  "gabarito": {
    "1": "c",
    "2": "a",
    "3": "b"
  },
  "imagens": [
    "extracted_content/images/page_1_img_1.png"
  ]
}
```

### CSV (questoes_extraidas.csv)

```csv
Numero,Enunciado,Alternativas,Gabarito,Tipo,Tema
1,"Qual é a capital do Brasil?","a) São Paulo | b) Rio de Janeiro | c) Brasília | d) Salvador",c,multipla_escolha,
```

### Gabarito (gabarito.txt)

```
GABARITO
==================================================
Questão 1: C
Questão 2: A
Questão 3: B
```

## 🔧 Personalização

### Adicionando Novos Padrões de Questões

```python
extractor = PDFExtractor("arquivo.pdf")

# Adicionar padrão personalizado
extractor.question_patterns.append(
    r'^\s*Pergunta\s+(\d+)[\.\:\-]\s*(.*?)(?=^\s*Pergunta\s+\d+|\Z)'
)

# Extrair com novos padrões
results = extractor.extract_all()
```

### Adicionando Padrões de Gabarito

```python
# Adicionar padrão de gabarito personalizado
extractor.answer_patterns.append(
    r'Chave[:\s]*(.+)'
)
```

## 🔍 Solução de Problemas

### Questões Não Detectadas

1. **Verifique o formato**: O PDF tem texto ou é apenas imagem?
2. **Padrões**: As questões seguem um padrão numerado?
3. **Teste manual**: Abra o PDF e verifique se o texto é selecionável
4. **Use modo verboso**: `python extrator_pdf.py arquivo.pdf --verbose`

### Imagens Não Extraídas

1. **Instale PyMuPDF**: `pip install PyMuPDF`
2. **Verifique dependências**: Execute `python exemplo_uso.py`
3. **Formato do PDF**: Algumas imagens podem estar incorporadas de forma especial

### Gabarito Não Detectado

1. **Verifique o padrão**: O gabarito segue um formato reconhecido?
2. **Adicione padrão**: Customize os padrões de detecção
3. **Extraia manualmente**: Use o texto extraído como base

### PDFs Escaneados

Para PDFs que são apenas imagens escaneadas:

```bash
# Instalar Tesseract OCR
# macOS: brew install tesseract
# Ubuntu: sudo apt-get install tesseract-ocr
# Windows: Baixar do GitHub oficial

pip install pytesseract

# O extrator tentará usar OCR automaticamente
```

## 📚 Exemplos de Uso

### Exemplo 1: Simulado ENEM

```python
# Para simulados no formato ENEM
extractor = PDFExtractor("enem_2023.pdf")

# Padrões específicos do ENEM
extractor.question_patterns = [
    r'^\s*QUESTÃO\s+(\d+)\s*(.*?)(?=^\s*QUESTÃO\s+\d+|\Z)'
]

results = extractor.extract_all()
```

### Exemplo 2: Concurso Público

```python
# Para provas de concurso
extractor = PDFExtractor("concurso.pdf")

# Padrões comuns em concursos
extractor.question_patterns.extend([
    r'^\s*(\d+)\.?\s*\([^)]*\)\s*(.*?)(?=^\s*\d+\.?\s*\(|\Z)'
])

results = extractor.extract_all()
```

### Exemplo 3: Processamento em Lote

```python
import os
from pathlib import Path

# Processar múltiplos PDFs
pdf_folder = Path("simulados/")
output_folder = Path("extraido/")

for pdf_file in pdf_folder.glob("*.pdf"):
    print(f"Processando: {pdf_file}")
    
    extractor = PDFExtractor(pdf_file, output_folder / pdf_file.stem)
    results = extractor.extract_all()
    extractor.save_results(results, 'both')
    
    print(f"✅ {results['total_questoes']} questões extraídas")
```

## 🤝 Contribuição

Para contribuir com melhorias:

1. **Adicione novos padrões** de questões/gabarito
2. **Melhore a detecção** de alternativas
3. **Adicione suporte** para novos formatos de PDF
4. **Implemente OCR** mais robusto
5. **Crie testes** para diferentes tipos de PDF

## 📞 Suporte

Para dúvidas ou problemas:

1. **Verifique os exemplos** em `exemplo_uso.py`
2. **Use modo verboso** para debug
3. **Teste com PDFs simples** primeiro
4. **Verifique dependências** instaladas

## 📄 Licença

Este projeto é parte do sistema SIMULADO-CEA e segue a mesma licença do projeto principal.