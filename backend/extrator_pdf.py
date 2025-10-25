#!/usr/bin/env python3
"""
Extrator de Questões, Imagens e Gabarito de PDF
==============================================

Este script extrai questões, imagens e gabarito de arquivos PDF
para uso no sistema SIMULADO-CEA.

Requisitos:
- PyPDF2 ou pypdf
- pdfplumber
- Pillow (PIL)
- fitz (PyMuPDF)
- opencv-python
- pytesseract (para OCR se necessário)

Instalação:
pip install PyPDF2 pdfplumber Pillow PyMuPDF opencv-python pytesseract

Uso:
python extrator_pdf.py arquivo.pdf
"""

import os
import re
import json
import csv
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging

# Imports condicionais para bibliotecas de PDF
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class PDFExtractor:
    """Classe principal para extração de conteúdo de PDFs"""
    
    def __init__(self, pdf_path: str, output_dir: str = "extracted_content"):
        self.pdf_path = Path(pdf_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Diretórios de saída
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(exist_ok=True)
        
        # Padrões regex para identificar questões
        self.question_patterns = [
            r'(?:^|\n)\s*(\d+)[\.\)]\s*(.*?)(?=(?:^|\n)\s*\d+[\.\)]|$)',  # 1. Questão...
            r'(?:^|\n)\s*Questão\s+(\d+)[\.\:\-]\s*(.*?)(?=(?:^|\n)\s*Questão\s+\d+|$)',  # Questão 1:...
            r'(?:^|\n)\s*(\d+)\s*[-–]\s*(.*?)(?=(?:^|\n)\s*\d+\s*[-–]|$)',  # 1 - Questão...
            r'(?:^|\n)\s*Item\s+(\d+)[\.\:\-]\s*(.*?)(?=(?:^|\n)\s*Item\s+\d+|$)',  # Item 1:...
        ]
        
        # Padrões para alternativas
        self.alternative_patterns = [
            r'(?:^|\n)\s*([a-eA-E])\)\s*(.*?)(?=(?:^|\n)\s*[a-eA-E]\)|$)',  # a) alternativa
            r'(?:^|\n)\s*([a-eA-E])[\.\-]\s*(.*?)(?=(?:^|\n)\s*[a-eA-E][\.\-]|$)',  # a. alternativa
        ]
        
        # Padrões para gabarito
        self.answer_patterns = [
            r'Gabarito[:\s]*(.+)',
            r'Respostas[:\s]*(.+)',
            r'Answers[:\s]*(.+)',
            r'(\d+)[:\.\-\s]*([a-eA-E])',  # 1: a, 2: b, etc.
        ]

    def check_dependencies(self) -> Dict[str, bool]:
        """Verifica quais bibliotecas estão disponíveis"""
        deps = {
            'PyPDF2': HAS_PYPDF2,
            'pdfplumber': HAS_PDFPLUMBER,
            'PyMuPDF': HAS_PYMUPDF,
            'PIL': HAS_PIL,
            'OpenCV': HAS_OPENCV,
            'Tesseract': HAS_TESSERACT
        }
        
        logger.info("Dependências disponíveis:")
        for lib, available in deps.items():
            status = "✓" if available else "✗"
            logger.info(f"  {status} {lib}")
        
        return deps

    def extract_text_pypdf2(self) -> str:
        """Extrai texto usando PyPDF2"""
        if not HAS_PYPDF2:
            raise ImportError("PyPDF2 não está instalado")
        
        text = ""
        try:
            with open(self.pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    text += f"\n--- PÁGINA {page_num + 1} ---\n{page_text}\n"
        except Exception as e:
            logger.error(f"Erro ao extrair texto com PyPDF2: {e}")
        
        return text

    def extract_text_pdfplumber(self) -> str:
        """Extrai texto usando pdfplumber (melhor para layouts complexos)"""
        if not HAS_PDFPLUMBER:
            raise ImportError("pdfplumber não está instalado")
        
        text = ""
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += f"\n--- PÁGINA {page_num + 1} ---\n{page_text}\n"
        except Exception as e:
            logger.error(f"Erro ao extrair texto com pdfplumber: {e}")
        
        return text

    def extract_images_pymupdf(self) -> List[str]:
        """Extrai imagens usando PyMuPDF"""
        if not HAS_PYMUPDF:
            raise ImportError("PyMuPDF não está instalado")
        
        image_paths = []
        try:
            doc = fitz.open(self.pdf_path)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images()
                
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    pix = fitz.Pixmap(doc, xref)
                    
                    if pix.n - pix.alpha < 4:  # GRAY ou RGB
                        img_name = f"page_{page_num + 1}_img_{img_index + 1}.png"
                        img_path = self.images_dir / img_name
                        pix.save(str(img_path))
                        image_paths.append(str(img_path))
                        logger.info(f"Imagem extraída: {img_name}")
                    
                    pix = None
            
            doc.close()
        except Exception as e:
            logger.error(f"Erro ao extrair imagens com PyMuPDF: {e}")
        
        return image_paths

    def extract_images_pdfplumber(self) -> List[str]:
        """Extrai imagens usando pdfplumber"""
        if not HAS_PDFPLUMBER:
            raise ImportError("pdfplumber não está instalado")
        
        image_paths = []
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    if hasattr(page, 'images'):
                        for img_index, img in enumerate(page.images):
                            # pdfplumber não extrai imagens diretamente,
                            # mas pode identificar suas posições
                            logger.info(f"Imagem detectada na página {page_num + 1}: {img}")
        except Exception as e:
            logger.error(f"Erro ao detectar imagens com pdfplumber: {e}")
        
        return image_paths

    def parse_questions(self, text: str) -> List[Dict]:
        """Extrai questões do texto usando regex"""
        questions = []
        
        for pattern in self.question_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.DOTALL | re.IGNORECASE)
            
            for match in matches:
                question_num = match.group(1)
                question_text = match.group(2).strip()
                
                # Valida se é realmente uma questão (não apenas um número solto)
                if len(question_text) < 10:  # Questões muito curtas provavelmente são falsos positivos
                    continue
                
                # Extrai alternativas
                alternatives = self.extract_alternatives(question_text)
                
                # Remove alternativas do texto da questão
                clean_question = self.clean_question_text(question_text)
                
                question_data = {
                    'numero': int(question_num),
                    'enunciado': clean_question,
                    'alternativas': alternatives,
                    'tipo': 'multipla_escolha' if alternatives else 'dissertativa',
                    'tema': '',  # A ser preenchido manualmente
                    'dificuldade': 'media',  # A ser preenchido manualmente
                    'imagens': []  # A ser associado manualmente
                }
                
                questions.append(question_data)
        
        # Remove duplicatas e ordena
        questions = self.remove_duplicate_questions(questions)
        questions.sort(key=lambda x: x['numero'])
        
        return questions

    def extract_alternatives(self, question_text: str) -> List[Dict]:
        """Extrai alternativas de uma questão"""
        alternatives = []
        found_letters = set()
        
        for pattern in self.alternative_patterns:
            matches = re.finditer(pattern, question_text, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                alt_letter = match.group(1).lower()
                alt_text = match.group(2).strip()
                
                # Evita duplicatas e valida se é realmente uma alternativa
                if alt_letter not in found_letters and len(alt_text) > 2:
                    found_letters.add(alt_letter)
                    
                    alternative = {
                        'letra': alt_letter,
                        'texto': alt_text
                    }
                    
                    alternatives.append(alternative)
        
        # Ordena por letra
        alternatives.sort(key=lambda x: x['letra'])
        
        return alternatives

    def clean_question_text(self, text: str) -> str:
        """Remove alternativas do texto da questão"""
        # Remove alternativas do texto
        for pattern in self.alternative_patterns:
            text = re.sub(pattern, '', text, flags=re.MULTILINE | re.IGNORECASE)
        
        # Limpa espaços extras
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = text.strip()
        
        return text

    def remove_duplicate_questions(self, questions: List[Dict]) -> List[Dict]:
        """Remove questões duplicadas"""
        seen_numbers = set()
        unique_questions = []
        
        for question in questions:
            if question['numero'] not in seen_numbers:
                seen_numbers.add(question['numero'])
                unique_questions.append(question)
        
        return unique_questions

    def extract_answers(self, text: str) -> Dict[int, str]:
        """Extrai gabarito do texto"""
        answers = {}
        
        for pattern in self.answer_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                if len(match.groups()) == 2:
                    # Padrão: número: letra
                    try:
                        question_num = int(match.group(1))
                        answer_letter = match.group(2).lower()
                        
                        # Valida se é uma resposta válida (a-e)
                        if answer_letter in 'abcde' and 1 <= question_num <= 1000:
                            answers[question_num] = answer_letter
                    except ValueError:
                        continue
                else:
                    # Padrão: sequência de respostas
                    answer_text = match.group(1)
                    parsed_answers = self.parse_answer_sequence(answer_text)
                    
                    # Valida respostas antes de adicionar
                    for num, letter in parsed_answers.items():
                        if letter in 'abcde' and 1 <= num <= 1000:
                            answers[num] = letter
        
        return answers

    def parse_answer_sequence(self, answer_text: str) -> Dict[int, str]:
        """Analisa uma sequência de respostas (ex: 1a 2b 3c)"""
        answers = {}
        
        # Padrões para sequências de respostas
        patterns = [
            r'(\d+)\s*([a-eA-E])',  # 1a, 2b, 3c
            r'(\d+)[:\.\-\s]+([a-eA-E])',  # 1:a, 2.b, 3-c, 4 d
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, answer_text)
            for match in matches:
                try:
                    question_num = int(match.group(1))
                    answer_letter = match.group(2).lower()
                    
                    # Valida se é uma resposta válida
                    if answer_letter in 'abcde' and 1 <= question_num <= 100:
                        answers[question_num] = answer_letter
                except ValueError:
                    continue
        
        return answers

    def extract_all(self) -> Dict:
        """Executa extração completa do PDF"""
        logger.info(f"Iniciando extração de: {self.pdf_path}")
        
        # Verifica dependências
        deps = self.check_dependencies()
        
        # Extrai texto
        text = ""
        if deps['pdfplumber']:
            logger.info("Extraindo texto com pdfplumber...")
            text = self.extract_text_pdfplumber()
        elif deps['PyPDF2']:
            logger.info("Extraindo texto com PyPDF2...")
            text = self.extract_text_pypdf2()
        else:
            raise ImportError("Nenhuma biblioteca de PDF disponível. Instale pdfplumber ou PyPDF2")
        
        # Salva texto extraído
        text_file = self.output_dir / "texto_extraido.txt"
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write(text)
        logger.info(f"Texto salvo em: {text_file}")
        
        # Extrai imagens
        image_paths = []
        if deps['PyMuPDF']:
            logger.info("Extraindo imagens com PyMuPDF...")
            image_paths = self.extract_images_pymupdf()
        elif deps['pdfplumber']:
            logger.info("Detectando imagens com pdfplumber...")
            image_paths = self.extract_images_pdfplumber()
        
        # Extrai questões
        logger.info("Extraindo questões...")
        questions = self.parse_questions(text)
        
        # Extrai gabarito
        logger.info("Extraindo gabarito...")
        answers = self.extract_answers(text)
        
        # Combina questões com gabarito
        for question in questions:
            if question['numero'] in answers:
                question['gabarito'] = answers[question['numero']]
        
        # Resultado final
        result = {
            'arquivo_origem': str(self.pdf_path),
            'total_questoes': len(questions),
            'total_imagens': len(image_paths),
            'questoes': questions,
            'gabarito': answers,
            'imagens': image_paths,
            'texto_completo': text
        }
        
        return result

    def save_results(self, results: Dict, format_type: str = 'json'):
        """Salva resultados em diferentes formatos"""
        
        if format_type == 'json':
            # Salva como JSON
            json_file = self.output_dir / "questoes_extraidas.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            logger.info(f"Resultados salvos em JSON: {json_file}")
        
        elif format_type == 'csv':
            # Salva como CSV
            csv_file = self.output_dir / "questoes_extraidas.csv"
            with open(csv_file, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                
                # Cabeçalho
                writer.writerow(['Numero', 'Enunciado', 'Alternativas', 'Gabarito', 'Tipo', 'Tema'])
                
                # Questões
                for question in results['questoes']:
                    alternatives_text = ' | '.join([f"{alt['letra']}) {alt['texto']}" for alt in question.get('alternativas', [])])
                    writer.writerow([
                        question['numero'],
                        question['enunciado'],
                        alternatives_text,
                        question.get('gabarito', ''),
                        question['tipo'],
                        question['tema']
                    ])
            
            logger.info(f"Resultados salvos em CSV: {csv_file}")
        
        # Sempre salva o gabarito separadamente
        gabarito_file = self.output_dir / "gabarito.txt"
        with open(gabarito_file, 'w', encoding='utf-8') as f:
            f.write("GABARITO\n")
            f.write("=" * 50 + "\n")
            for num, answer in sorted(results['gabarito'].items()):
                f.write(f"Questão {num}: {answer.upper()}\n")
        
        logger.info(f"Gabarito salvo em: {gabarito_file}")


def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Extrator de Questões, Imagens e Gabarito de PDF')
    parser.add_argument('pdf_file', help='Caminho para o arquivo PDF')
    parser.add_argument('-o', '--output', default='extracted_content', help='Diretório de saída')
    parser.add_argument('-f', '--format', choices=['json', 'csv', 'both'], default='both', help='Formato de saída')
    parser.add_argument('-v', '--verbose', action='store_true', help='Modo verboso')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Verifica se o arquivo existe
    if not Path(args.pdf_file).exists():
        logger.error(f"Arquivo não encontrado: {args.pdf_file}")
        return 1
    
    try:
        # Cria extrator
        extractor = PDFExtractor(args.pdf_file, args.output)
        
        # Executa extração
        results = extractor.extract_all()
        
        # Salva resultados
        if args.format in ['json', 'both']:
            extractor.save_results(results, 'json')
        
        if args.format in ['csv', 'both']:
            extractor.save_results(results, 'csv')
        
        # Resumo
        logger.info("\n" + "="*50)
        logger.info("RESUMO DA EXTRAÇÃO")
        logger.info("="*50)
        logger.info(f"Arquivo: {results['arquivo_origem']}")
        logger.info(f"Questões encontradas: {results['total_questoes']}")
        logger.info(f"Imagens extraídas: {results['total_imagens']}")
        logger.info(f"Respostas no gabarito: {len(results['gabarito'])}")
        logger.info(f"Resultados salvos em: {args.output}")
        
        if results['total_questoes'] > 0:
            logger.info("\nPrimeiras questões encontradas:")
            for i, question in enumerate(results['questoes'][:3]):
                logger.info(f"  {question['numero']}. {question['enunciado'][:100]}...")
        
        return 0
        
    except Exception as e:
        logger.error(f"Erro durante a extração: {e}")
        return 1


if __name__ == "__main__":
    exit(main())