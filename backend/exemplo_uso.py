#!/usr/bin/env python3
"""
Exemplo de Uso do Extrator de PDF
================================

Este arquivo demonstra como usar o extrator_pdf.py para extrair
questões, imagens e gabarito de PDFs de simulados.
"""

import os
import sys
from pathlib import Path

# Adiciona o diretório backend ao path
sys.path.append(str(Path(__file__).parent))

from extrator_pdf import PDFExtractor


def exemplo_basico():
    """Exemplo básico de uso"""
    print("=== EXEMPLO BÁSICO ===")
    
    # Substitua pelo caminho do seu PDF
    pdf_path = "exemplo_simulado.pdf"
    
    if not Path(pdf_path).exists():
        print(f"⚠️  Arquivo {pdf_path} não encontrado.")
        print("   Coloque um arquivo PDF na pasta backend/ e atualize o caminho.")
        return
    
    try:
        # Cria o extrator
        extractor = PDFExtractor(pdf_path, "output_exemplo")
        
        # Verifica dependências
        deps = extractor.check_dependencies()
        
        # Executa extração
        results = extractor.extract_all()
        
        # Salva em ambos os formatos
        extractor.save_results(results, 'json')
        extractor.save_results(results, 'csv')
        
        print(f"✅ Extração concluída!")
        print(f"   📁 Resultados em: output_exemplo/")
        print(f"   📊 Questões: {results['total_questoes']}")
        print(f"   🖼️  Imagens: {results['total_imagens']}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")


def exemplo_avancado():
    """Exemplo avançado com configurações personalizadas"""
    print("\n=== EXEMPLO AVANÇADO ===")
    
    pdf_path = "simulado_complexo.pdf"
    
    if not Path(pdf_path).exists():
        print(f"⚠️  Arquivo {pdf_path} não encontrado para exemplo avançado.")
        return
    
    try:
        # Extrator personalizado
        extractor = PDFExtractor(pdf_path, "output_avancado")
        
        # Adiciona padrões personalizados para questões
        extractor.question_patterns.extend([
            r'^\s*Item\s+(\d+)[\.\:\-]\s*(.*?)(?=^\s*Item\s+\d+|\Z)',  # Item 1: ...
            r'^\s*Q(\d+)[\.\:\-]\s*(.*?)(?=^\s*Q\d+|\Z)',  # Q1: ...
        ])
        
        # Adiciona padrões para gabarito específicos
        extractor.answer_patterns.extend([
            r'CHAVE\s+DE\s+RESPOSTAS[:\s]*(.+)',
            r'Alternativas\s+corretas[:\s]*(.+)',
        ])
        
        # Executa extração
        results = extractor.extract_all()
        
        # Pós-processamento personalizado
        for question in results['questoes']:
            # Adiciona categorização automática baseada em palavras-chave
            enunciado = question['enunciado'].lower()
            
            if any(word in enunciado for word in ['matemática', 'cálculo', 'equação']):
                question['tema'] = 'matemática'
            elif any(word in enunciado for word in ['português', 'gramática', 'texto']):
                question['tema'] = 'português'
            elif any(word in enunciado for word in ['história', 'século', 'guerra']):
                question['tema'] = 'história'
            elif any(word in enunciado for word in ['física', 'velocidade', 'força']):
                question['tema'] = 'física'
            else:
                question['tema'] = 'geral'
            
            # Define dificuldade baseada no tamanho do enunciado
            if len(question['enunciado']) > 500:
                question['dificuldade'] = 'difícil'
            elif len(question['enunciado']) > 200:
                question['dificuldade'] = 'média'
            else:
                question['dificuldade'] = 'fácil'
        
        # Salva com categorização
        extractor.save_results(results, 'json')
        
        # Relatório detalhado
        print(f"✅ Extração avançada concluída!")
        print(f"   📁 Resultados em: output_avancado/")
        
        # Estatísticas por tema
        temas = {}
        for question in results['questoes']:
            tema = question['tema']
            temas[tema] = temas.get(tema, 0) + 1
        
        print("\n📊 Questões por tema:")
        for tema, count in temas.items():
            print(f"   {tema}: {count}")
        
    except Exception as e:
        print(f"❌ Erro no exemplo avançado: {e}")


def verificar_instalacao():
    """Verifica se todas as dependências estão instaladas"""
    print("=== VERIFICAÇÃO DE INSTALAÇÃO ===")
    
    dependencias = {
        'PyPDF2': 'pip install PyPDF2',
        'pdfplumber': 'pip install pdfplumber',
        'fitz (PyMuPDF)': 'pip install PyMuPDF',
        'PIL (Pillow)': 'pip install Pillow',
        'cv2 (OpenCV)': 'pip install opencv-python',
        'pytesseract': 'pip install pytesseract'
    }
    
    for lib, comando in dependencias.items():
        try:
            if lib == 'PyPDF2':
                import PyPDF2
            elif lib == 'pdfplumber':
                import pdfplumber
            elif lib == 'fitz (PyMuPDF)':
                import fitz
            elif lib == 'PIL (Pillow)':
                from PIL import Image
            elif lib == 'cv2 (OpenCV)':
                import cv2
            elif lib == 'pytesseract':
                import pytesseract
            
            print(f"✅ {lib} - Instalado")
            
        except ImportError:
            print(f"❌ {lib} - NÃO instalado")
            print(f"   💡 Instale com: {comando}")


def dicas_uso():
    """Dicas para melhor uso do extrator"""
    print("\n=== DICAS DE USO ===")
    
    dicas = [
        "📄 Formatos suportados: PDF com texto (não apenas imagens)",
        "🎯 Funciona melhor com PDFs bem formatados",
        "🖼️  Imagens são extraídas automaticamente",
        "📝 Padrões de questões podem ser personalizados",
        "💾 Resultados são salvos em JSON e CSV",
        "🔍 Use modo verbose (-v) para debug",
        "⚙️  OCR pode ser necessário para PDFs escaneados",
        "🎨 Formatos de questão: '1.', 'Questão 1:', '1 -', etc.",
        "✅ Alternativas: 'a)', 'A)', 'a.', 'A.', etc.",
        "📊 Gabarito: 'Gabarito:', 'Respostas:', '1:a 2:b', etc."
    ]
    
    for dica in dicas:
        print(f"   {dica}")


if __name__ == "__main__":
    print("🔧 EXTRATOR DE PDF - SIMULADO CEA")
    print("=" * 50)
    
    # Verifica instalação
    verificar_instalacao()
    
    # Executa exemplos
    exemplo_basico()
    exemplo_avancado()
    
    # Mostra dicas
    dicas_uso()
    
    print("\n" + "=" * 50)
    print("📚 Para usar:")
    print("   python extrator_pdf.py arquivo.pdf")
    print("   python extrator_pdf.py arquivo.pdf -o pasta_saida -f json")
    print("   python extrator_pdf.py arquivo.pdf --verbose")
    print("\n📖 Documentação completa no arquivo extrator_pdf.py")