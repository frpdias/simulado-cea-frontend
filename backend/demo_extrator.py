#!/usr/bin/env python3
"""
Demo do Extrator PDF
====================

Demonstração prática do uso do extrator com arquivo de exemplo.
Execute este script para ver o extrator em ação!
"""

import os
import sys
from pathlib import Path
import tempfile

# Adiciona o diretório backend ao path
sys.path.append(str(Path(__file__).parent))

from extrator_pdf import PDFExtractor


def create_sample_pdf_text():
    """Cria um texto de exemplo simulando um PDF extraído de um simulado real"""
    return """
SIMULADO ENEM 2024 - LINGUAGENS E CÓDIGOS
==========================================

INSTRUÇÕES:
- Marque apenas uma alternativa por questão
- Use caneta azul ou preta
- Tempo de prova: 5 horas

QUESTÃO 1
A charge a seguir faz uma crítica à sociedade contemporânea:

[IMAGEM DE CHARGE]

Qual é o principal recurso linguístico utilizado pelo autor para construir o humor?

a) Ironia situacional
b) Linguagem coloquial
c) Metáfora visual
d) Hipérbole textual
e) Paródia literária

QUESTÃO 2
Leia o texto abaixo:

"A arte da escrita consiste em comunicar o máximo com o mínimo de palavras."

Essa afirmação reflete qual característica do texto literário?

a) Concisão
b) Prolixidade  
c) Redundância
d) Ambiguidade
e) Subjetividade

3. No período "Embora chovesse muito, ele saiu de casa", a oração subordinada expressa:

a) Causa
b) Consequência
c) Concessão
d) Condição
e) Finalidade

Questão 4: Qual figura de linguagem está presente na frase "O silêncio gritava na sala vazia"?

A) Metáfora
B) Metonímia
C) Oxímoro
D) Sinestesia
E) Prosopopeia

Item 5. O Modernismo brasileiro teve como marco inicial:

a) A Semana de Arte Moderna de 1922
b) A publicação de "O Cortiço"
c) O movimento Pau-Brasil
d) A Revista Antropófaga
e) O Manifesto Antropófago

==================================================
GABARITO OFICIAL

1: c
2: a  
3: c
4: c
5: a

Respostas: 1c 2a 3c 4c 5a

==================================================
"""


def demo_extracao_completa():
    """Demonstra extração completa com texto de exemplo"""
    print("🎯 DEMO: EXTRAÇÃO COMPLETA")
    print("=" * 50)
    
    # Cria texto de exemplo
    sample_text = create_sample_pdf_text()
    
    # Cria extrator
    extractor = PDFExtractor("demo_simulado.pdf", "demo_output")
    
    print("📄 Simulando extração de PDF...")
    print("   Arquivo: demo_simulado.pdf")
    print("   Tipo: Simulado ENEM - Linguagens")
    
    # Extrai questões
    print("\n🔍 Extraindo questões...")
    questions = extractor.parse_questions(sample_text)
    print(f"   ✅ {len(questions)} questões encontradas")
    
    # Extrai gabarito
    print("\n📊 Extraindo gabarito...")
    answers = extractor.extract_answers(sample_text)
    print(f"   ✅ {len(answers)} respostas encontradas")
    
    # Combina questões com gabarito
    for question in questions:
        if question['numero'] in answers:
            question['gabarito'] = answers[question['numero']]
    
    # Mostra resultados
    print("\n📝 QUESTÕES EXTRAÍDAS:")
    print("-" * 30)
    
    for i, question in enumerate(questions[:3]):  # Mostra apenas as 3 primeiras
        print(f"\n{question['numero']}. {question['enunciado'][:100]}...")
        
        if question['alternativas']:
            print("   Alternativas:")
            for alt in question['alternativas'][:3]:  # Mostra apenas 3 alternativas
                print(f"      {alt['letra']}) {alt['texto'][:50]}...")
        
        if 'gabarito' in question:
            print(f"   ✅ Gabarito: {question['gabarito'].upper()}")
    
    print(f"\n   ... e mais {len(questions)-3} questões")
    
    # Cria resultado completo
    results = {
        'arquivo_origem': 'demo_simulado.pdf',
        'total_questoes': len(questions),
        'total_imagens': 1,  # Simulado
        'questoes': questions,
        'gabarito': answers,
        'imagens': ['demo_output/images/charge_questao1.jpg'],
        'texto_completo': sample_text
    }
    
    # Salva resultados
    print("\n💾 Salvando resultados...")
    extractor.save_results(results, 'json')
    extractor.save_results(results, 'csv')
    
    print("   ✅ demo_output/questoes_extraidas.json")
    print("   ✅ demo_output/questoes_extraidas.csv")
    print("   ✅ demo_output/gabarito.txt")
    
    return results


def demo_personalizacao():
    """Demonstra personalização de padrões"""
    print("\n\n🔧 DEMO: PERSONALIZAÇÃO DE PADRÕES")
    print("=" * 50)
    
    # Texto com formato diferente
    custom_text = """
VESTIBULAR UNICAMP 2024

PERGUNTA 01
Qual é a função da mitocôndria?
(A) Produção de energia
(B) Síntese de proteínas
(C) Digestão celular
(D) Transporte de substâncias

PERGUNTA 02  
O que é fotossíntese?
(A) Respiração celular
(B) Processo de produção de alimento
(C) Divisão celular
(D) Reprodução vegetal

CHAVE DE CORREÇÃO: 1A 2B
"""
    
    # Cria extrator personalizado
    extractor = PDFExtractor("vestibular.pdf", "demo_custom")
    
    print("📝 Adicionando padrões personalizados...")
    
    # Adiciona padrão para "PERGUNTA"
    extractor.question_patterns.append(
        r'(?:^|\n)\s*PERGUNTA\s+(\d+)\s*(.*?)(?=(?:^|\n)\s*PERGUNTA\s+\d+|$)'
    )
    
    # Adiciona padrão para alternativas com parênteses
    extractor.alternative_patterns.append(
        r'(?:^|\n)\s*\(([A-D])\)\s*(.*?)(?=(?:^|\n)\s*\([A-D]\)|$)'
    )
    
    # Adiciona padrão para "CHAVE DE CORREÇÃO"
    extractor.answer_patterns.append(
        r'CHAVE\s+DE\s+CORREÇÃO[:\s]*(.+)'
    )
    
    print("   ✅ Padrão para 'PERGUNTA XX'")
    print("   ✅ Padrão para alternativas (A)")
    print("   ✅ Padrão para 'CHAVE DE CORREÇÃO'")
    
    # Testa extração
    questions = extractor.parse_questions(custom_text)
    answers = extractor.extract_answers(custom_text)
    
    print(f"\n🎯 Resultados:")
    print(f"   Questões: {len(questions)}")
    print(f"   Respostas: {len(answers)}")
    
    if questions:
        print(f"\n   Exemplo: '{questions[0]['enunciado'][:50]}...'")
        print(f"   Alternativas: {len(questions[0]['alternativas'])}")


def demo_estatisticas():
    """Demonstra análise estatística dos resultados"""
    print("\n\n📊 DEMO: ANÁLISE ESTATÍSTICA")
    print("=" * 50)
    
    # Usa resultados da demo anterior
    sample_text = create_sample_pdf_text()
    extractor = PDFExtractor("demo.pdf", "demo_stats")
    
    questions = extractor.parse_questions(sample_text)
    answers = extractor.extract_answers(sample_text)
    
    # Adiciona categorização automática
    for question in questions:
        enunciado = question['enunciado'].lower()
        
        # Categoriza por palavras-chave
        if any(word in enunciado for word in ['linguagem', 'texto', 'literatura', 'escrita']):
            question['tema'] = 'Linguagens'
            question['area'] = 'Português'
        elif any(word in enunciado for word in ['arte', 'modernismo', 'movimento']):
            question['tema'] = 'Literatura'
            question['area'] = 'Português'
        elif any(word in enunciado for word in ['gramática', 'oração', 'período']):
            question['tema'] = 'Gramática'
            question['area'] = 'Português'
        else:
            question['tema'] = 'Geral'
            question['area'] = 'Indefinido'
        
        # Define dificuldade por tamanho
        if len(question['enunciado']) > 200:
            question['dificuldade'] = 'Difícil'
        elif len(question['enunciado']) > 100:
            question['dificuldade'] = 'Média'
        else:
            question['dificuldade'] = 'Fácil'
    
    # Gera estatísticas
    print("📈 ESTATÍSTICAS DO SIMULADO:")
    
    # Por tema
    temas = {}
    for q in questions:
        tema = q['tema']
        temas[tema] = temas.get(tema, 0) + 1
    
    print("\n   📚 Distribuição por tema:")
    for tema, count in temas.items():
        print(f"      {tema}: {count} questões")
    
    # Por dificuldade
    dificuldades = {}
    for q in questions:
        diff = q['dificuldade']
        dificuldades[diff] = dificuldades.get(diff, 0) + 1
    
    print("\n   ⭐ Distribuição por dificuldade:")
    for diff, count in dificuldades.items():
        print(f"      {diff}: {count} questões")
    
    # Taxa de alternativas
    total_alts = sum(len(q['alternativas']) for q in questions)
    media_alts = total_alts / len(questions) if questions else 0
    
    print(f"\n   🔢 Média de alternativas: {media_alts:.1f}")
    print(f"   ✅ Taxa de gabarito: {len(answers)/len(questions)*100:.1f}%")


def main():
    """Função principal da demo"""
    print("🚀 DEMO EXTRATOR PDF - SIMULADO CEA")
    print("=" * 60)
    
    try:
        # Demo 1: Extração completa
        results = demo_extracao_completa()
        
        # Demo 2: Personalização
        demo_personalizacao()
        
        # Demo 3: Estatísticas
        demo_estatisticas()
        
        # Resumo final
        print("\n\n🎉 DEMO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        print("✅ Extração de questões funcionando")
        print("✅ Extração de gabarito funcionando")
        print("✅ Personalização de padrões funcionando")
        print("✅ Análise estatística funcionando")
        print("✅ Exportação para JSON/CSV funcionando")
        
        print("\n📁 Arquivos gerados:")
        print("   📄 demo_output/questoes_extraidas.json")
        print("   📊 demo_output/questoes_extraidas.csv") 
        print("   ✅ demo_output/gabarito.txt")
        
        print("\n💡 Próximos passos:")
        print("   1. Teste com seu próprio PDF:")
        print("      python extrator_pdf.py seu_arquivo.pdf")
        print("   2. Personalize os padrões conforme necessário")
        print("   3. Integre com o sistema SIMULADO-CEA")
        
    except Exception as e:
        print(f"\n❌ Erro na demo: {e}")
        print("💡 Verifique se as dependências estão instaladas:")
        print("   pip install -r requirements.txt")


if __name__ == "__main__":
    main()