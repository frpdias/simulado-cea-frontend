#!/usr/bin/env python3
"""
Script de Teste do Extrator PDF
==============================

Testa o extrator com dados simulados para verificar funcionamento.
"""

import tempfile
import json
from pathlib import Path
from extrator_pdf import PDFExtractor


def create_test_text():
    """Cria texto de teste simulando um PDF extraído"""
    return """
SIMULADO DE TESTE - VESTIBULAR 2024

1. Qual é a capital do Brasil?
a) São Paulo
b) Rio de Janeiro 
c) Brasília
d) Salvador
e) Belo Horizonte

2. Em que ano foi proclamada a Independência do Brasil?
a) 1822
b) 1500
c) 1889
d) 1888
e) 1824

Questão 3: Qual é o resultado de 2 + 2?
A) 3
B) 4
C) 5
D) 6
E) 7

4 - Qual planeta é conhecido como "Planeta Vermelho"?
a. Terra
b. Vênus  
c. Marte
d. Júpiter
e. Saturno

Item 5. Quem escreveu "Dom Casmurro"?
a) Machado de Assis
b) José de Alencar
c) Clarice Lispector
d) Graciliano Ramos
e) Jorge Amado

GABARITO: 1c 2a 3b 4c 5a

Respostas:
1: c
2: a
3: b
4: c
5: a
"""


def test_question_parsing():
    """Testa a extração de questões"""
    print("🧪 Testando extração de questões...")
    
    # Cria extrator mock
    extractor = PDFExtractor("teste.pdf", "test_output")
    
    # Texto de teste
    text = create_test_text()
    
    # Testa extração de questões
    questions = extractor.parse_questions(text)
    
    print(f"   ✅ Questões encontradas: {len(questions)}")
    
    if len(questions) > 0:
        print("   📝 Primeira questão:")
        q = questions[0]
        print(f"      Número: {q['numero']}")
        print(f"      Enunciado: {q['enunciado'][:50]}...")
        print(f"      Alternativas: {len(q['alternativas'])}")
    
    return len(questions) == 5


def test_answer_parsing():
    """Testa a extração de gabarito"""
    print("\n🧪 Testando extração de gabarito...")
    
    extractor = PDFExtractor("teste.pdf", "test_output")
    text = create_test_text()
    
    # Testa extração de respostas
    answers = extractor.extract_answers(text)
    
    print(f"   ✅ Respostas encontradas: {len(answers)}")
    
    if len(answers) > 0:
        print("   📊 Gabarito:")
        for num, answer in sorted(answers.items()):
            print(f"      Questão {num}: {answer}")
    
    return len(answers) == 5


def test_dependencies():
    """Testa dependências disponíveis"""
    print("\n🧪 Testando dependências...")
    
    extractor = PDFExtractor("teste.pdf", "test_output")
    deps = extractor.check_dependencies()
    
    available = sum(deps.values())
    total = len(deps)
    
    print(f"   📦 Dependências disponíveis: {available}/{total}")
    
    return available > 0


def test_full_workflow():
    """Testa o fluxo completo com arquivo simulado"""
    print("\n🧪 Testando fluxo completo...")
    
    try:
        # Cria arquivo temporário
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(create_test_text())
            temp_file = f.name
        
        # Simula extração (usando texto ao invés de PDF)
        extractor = PDFExtractor("teste.pdf", "test_output")
        
        text = create_test_text()
        questions = extractor.parse_questions(text)
        answers = extractor.extract_answers(text)
        
        # Combina questões com respostas
        for question in questions:
            if question['numero'] in answers:
                question['gabarito'] = answers[question['numero']]
        
        # Cria resultado mock
        results = {
            'arquivo_origem': 'teste.pdf',
            'total_questoes': len(questions),
            'total_imagens': 0,
            'questoes': questions,
            'gabarito': answers,
            'imagens': [],
            'texto_completo': text
        }
        
        # Testa salvamento
        extractor.save_results(results, 'json')
        
        # Verifica se arquivo foi criado
        json_file = Path("test_output/questoes_extraidas.json")
        if json_file.exists():
            with open(json_file) as f:
                saved_data = json.load(f)
            
            print(f"   ✅ Arquivo salvo: {json_file}")
            print(f"   📊 Questões no arquivo: {saved_data['total_questoes']}")
            
            return True
        
    except Exception as e:
        print(f"   ❌ Erro no teste: {e}")
        return False
    
    finally:
        # Limpa arquivo temporário
        try:
            Path(temp_file).unlink()
        except:
            pass
    
    return False


def run_all_tests():
    """Executa todos os testes"""
    print("🧪 EXECUTANDO TESTES DO EXTRATOR PDF")
    print("=" * 50)
    
    tests = [
        ("Dependências", test_dependencies),
        ("Extração de Questões", test_question_parsing),
        ("Extração de Gabarito", test_answer_parsing),
        ("Fluxo Completo", test_full_workflow),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            status = "✅ PASSOU" if result else "❌ FALHOU"
            results.append(result)
            print(f"\n{test_name}: {status}")
        except Exception as e:
            print(f"\n{test_name}: ❌ ERRO - {e}")
            results.append(False)
    
    # Resumo final
    print("\n" + "=" * 50)
    print("📊 RESUMO DOS TESTES")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Testes executados: {total}")
    print(f"Testes passou: {passed}")
    print(f"Taxa de sucesso: {passed/total*100:.1f}%")
    
    if passed == total:
        print("\n🎉 Todos os testes passaram! O extrator está funcionando.")
    else:
        print(f"\n⚠️  {total-passed} teste(s) falharam. Verifique as dependências.")
    
    print("\n💡 Para testar com PDF real:")
    print("   python extrator_pdf.py seu_arquivo.pdf")


if __name__ == "__main__":
    run_all_tests()