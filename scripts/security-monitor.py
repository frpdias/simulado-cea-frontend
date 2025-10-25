#!/usr/bin/env python3
"""
Monitor de Segurança em Tempo Real
Monitora logs de segurança e detecta atividades suspeitas
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Any

class SecurityMonitor:
    def __init__(self):
        self.suspicious_ips = set()
        self.rate_limit_violations = defaultdict(list)
        self.failed_logins = defaultdict(list)
        self.payment_attempts = defaultdict(list)
        self.alerts = deque(maxlen=100)
        
        # Configurações de alerta
        self.MAX_FAILED_LOGINS = 5
        self.MAX_PAYMENT_ATTEMPTS = 3
        self.TIME_WINDOW = 900  # 15 minutos
        
    def analyze_log_entry(self, log_entry: Dict[str, Any]):
        """Analisa uma entrada de log para detectar atividade suspeita"""
        timestamp = log_entry.get('timestamp')
        event_type = log_entry.get('event')
        client_ip = log_entry.get('clientIP', 'unknown')
        
        if not timestamp or not event_type:
            return
            
        current_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        # Analisar diferentes tipos de eventos
        if 'login' in event_type and 'error' in event_type:
            self._track_failed_login(client_ip, current_time)
            
        elif event_type.startswith('payment_'):
            self._track_payment_activity(client_ip, current_time, log_entry)
            
        elif 'rate_limit' in event_type or event_type == 'api_access':
            self._track_api_usage(client_ip, current_time)
            
        # Detectar padrões suspeitos
        self._detect_suspicious_patterns(client_ip, current_time)
    
    def _track_failed_login(self, ip: str, timestamp: datetime):
        """Rastreia tentativas de login falhadas"""
        self.failed_logins[ip].append(timestamp)
        
        # Limpar entradas antigas
        cutoff = timestamp - timedelta(seconds=self.TIME_WINDOW)
        self.failed_logins[ip] = [t for t in self.failed_logins[ip] if t > cutoff]
        
        # Verificar se excedeu o limite
        if len(self.failed_logins[ip]) >= self.MAX_FAILED_LOGINS:
            self._create_alert('BRUTE_FORCE_LOGIN', ip, {
                'attempts': len(self.failed_logins[ip]),
                'time_window': self.TIME_WINDOW
            })
    
    def _track_payment_activity(self, ip: str, timestamp: datetime, log_entry: Dict):
        """Rastreia atividade de pagamento suspeita"""
        self.payment_attempts[ip].append(timestamp)
        
        # Limpar entradas antigas
        cutoff = timestamp - timedelta(seconds=self.TIME_WINDOW)
        self.payment_attempts[ip] = [t for t in self.payment_attempts[ip] if t > cutoff]
        
        # Verificar tentativas excessivas de pagamento
        if len(self.payment_attempts[ip]) >= self.MAX_PAYMENT_ATTEMPTS:
            self._create_alert('EXCESSIVE_PAYMENT_ATTEMPTS', ip, {
                'attempts': len(self.payment_attempts[ip]),
                'time_window': self.TIME_WINDOW
            })
    
    def _track_api_usage(self, ip: str, timestamp: datetime):
        """Rastreia uso excessivo da API"""
        # Implementar lógica específica de rate limiting
        pass
    
    def _detect_suspicious_patterns(self, ip: str, timestamp: datetime):
        """Detecta padrões comportamentais suspeitos"""
        # Verificar se IP já foi marcado como suspeito
        if ip in self.suspicious_ips:
            self._create_alert('SUSPICIOUS_IP_ACTIVITY', ip, {
                'status': 'IP já marcado como suspeito'
            })
    
    def _create_alert(self, alert_type: str, ip: str, details: Dict):
        """Cria um alerta de segurança"""
        alert = {
            'timestamp': datetime.now().isoformat(),
            'type': alert_type,
            'ip': ip,
            'details': details,
            'severity': self._get_severity(alert_type)
        }
        
        self.alerts.append(alert)
        self.suspicious_ips.add(ip)
        
        # Log do alerta
        print(f"🚨 ALERTA DE SEGURANÇA: {alert_type}")
        print(f"   IP: {ip}")
        print(f"   Detalhes: {json.dumps(details, indent=2)}")
        print(f"   Severidade: {alert['severity']}")
        print("-" * 50)
    
    def _get_severity(self, alert_type: str) -> str:
        """Determina a severidade do alerta"""
        severity_map = {
            'BRUTE_FORCE_LOGIN': 'HIGH',
            'EXCESSIVE_PAYMENT_ATTEMPTS': 'HIGH',
            'SUSPICIOUS_IP_ACTIVITY': 'MEDIUM',
            'RATE_LIMIT_VIOLATION': 'LOW'
        }
        return severity_map.get(alert_type, 'MEDIUM')
    
    def get_security_summary(self) -> Dict:
        """Retorna resumo do status de segurança"""
        return {
            'suspicious_ips_count': len(self.suspicious_ips),
            'recent_alerts': len(self.alerts),
            'high_severity_alerts': len([a for a in self.alerts if a['severity'] == 'HIGH']),
            'failed_login_ips': len(self.failed_logins),
            'payment_monitoring_ips': len(self.payment_attempts)
        }

def monitor_security_logs():
    """Função principal para monitorar logs de segurança"""
    monitor = SecurityMonitor()
    
    print("🛡️  MONITOR DE SEGURANÇA ATIVO")
    print("Monitorando atividades suspeitas...")
    print("=" * 50)
    
    # Simular análise de logs (em produção, ler logs reais)
    sample_logs = [
        {
            'timestamp': datetime.now().isoformat(),
            'event': 'login_error',
            'clientIP': '192.168.1.100',
            'details': {'reason': 'invalid_password'}
        },
        {
            'timestamp': datetime.now().isoformat(),
            'event': 'payment_attempt',
            'clientIP': '192.168.1.100',
            'details': {'amount': 29.90}
        }
    ]
    
    for log_entry in sample_logs:
        monitor.analyze_log_entry(log_entry)
    
    # Exibir resumo
    summary = monitor.get_security_summary()
    print("\n📊 RESUMO DE SEGURANÇA:")
    for key, value in summary.items():
        print(f"   {key}: {value}")
    
    print("\n✅ Monitoramento concluído")
    return monitor

if __name__ == "__main__":
    monitor_security_logs()