#!/bin/bash

# Script de deploy para Agentes de IA
# Uso: ./deploy.sh [start|stop|restart|logs|status]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Agentes de IA - Deploy Script${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    fi
}

# Verificar se arquivo .env existe
check_env() {
    if [ ! -f .env ]; then
        print_warning "Arquivo .env não encontrado. Criando a partir do exemplo..."
        if [ -f env.example ]; then
            cp env.example .env
            print_message "Arquivo .env criado. Por favor, configure as variáveis de ambiente."
        else
            print_error "Arquivo env.example não encontrado."
            exit 1
        fi
    fi
}

# Função para iniciar os serviços
start_services() {
    print_message "Iniciando serviços..."
    docker-compose up -d --build
    print_message "Serviços iniciados com sucesso!"
    
    echo ""
    print_message "Acesse a aplicação em: http://localhost"
    print_message "Grafana (monitoramento): http://localhost:3001 (admin/admin)"
    print_message "Prometheus (métricas): http://localhost:9090"
}

# Função para parar os serviços
stop_services() {
    print_message "Parando serviços..."
    docker-compose down
    print_message "Serviços parados com sucesso!"
}

# Função para reiniciar os serviços
restart_services() {
    print_message "Reiniciando serviços..."
    docker-compose down
    docker-compose up -d --build
    print_message "Serviços reiniciados com sucesso!"
}

# Função para mostrar logs
show_logs() {
    print_message "Mostrando logs dos serviços..."
    docker-compose logs -f
}

# Função para mostrar status
show_status() {
    print_message "Status dos serviços:"
    docker-compose ps
    
    echo ""
    print_message "Uso de recursos:"
    docker stats --no-stream
}

# Função para backup
backup_data() {
    print_message "Criando backup dos dados..."
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup do banco de dados
    docker-compose exec -T supabase pg_dump -U postgres postgres > "$BACKUP_DIR/database.sql"
    
    # Backup dos volumes
    docker run --rm -v agentes-ia-supabase_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/supabase_data.tar.gz -C /data .
    
    print_message "Backup criado em: $BACKUP_DIR"
}

# Função para restore
restore_data() {
    if [ -z "$1" ]; then
        print_error "Especifique o diretório do backup: ./deploy.sh restore <backup_dir>"
        exit 1
    fi
    
    BACKUP_DIR="$1"
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Diretório de backup não encontrado: $BACKUP_DIR"
        exit 1
    fi
    
    print_message "Restaurando dados do backup: $BACKUP_DIR"
    
    # Restaurar banco de dados
    if [ -f "$BACKUP_DIR/database.sql" ]; then
        docker-compose exec -T supabase psql -U postgres postgres < "$BACKUP_DIR/database.sql"
    fi
    
    print_message "Restauração concluída!"
}

# Função para limpeza
cleanup() {
    print_warning "Esta operação irá remover todos os dados. Tem certeza? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_message "Removendo containers, volumes e imagens..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_message "Limpeza concluída!"
    else
        print_message "Operação cancelada."
    fi
}

# Função para health check
health_check() {
    print_message "Verificando saúde dos serviços..."
    
    # Verificar frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_message "✓ Frontend está saudável"
    else
        print_error "✗ Frontend não está respondendo"
    fi
    
    # Verificar banco de dados
    if docker-compose exec -T supabase pg_isready -U postgres > /dev/null 2>&1; then
        print_message "✓ Banco de dados está saudável"
    else
        print_error "✗ Banco de dados não está respondendo"
    fi
    
    # Verificar Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_message "✓ Redis está saudável"
    else
        print_error "✗ Redis não está respondendo"
    fi
}

# Função principal
main() {
    print_header
    
    # Verificar dependências
    check_docker
    check_env
    
    case "${1:-start}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data "$2"
            ;;
        cleanup)
            cleanup
            ;;
        health)
            health_check
            ;;
        *)
            echo "Uso: $0 {start|stop|restart|logs|status|backup|restore|cleanup|health}"
            echo ""
            echo "Comandos:"
            echo "  start     - Iniciar todos os serviços"
            echo "  stop      - Parar todos os serviços"
            echo "  restart   - Reiniciar todos os serviços"
            echo "  logs      - Mostrar logs em tempo real"
            echo "  status    - Mostrar status dos serviços"
            echo "  backup    - Criar backup dos dados"
            echo "  restore   - Restaurar dados do backup"
            echo "  cleanup   - Remover todos os dados"
            echo "  health    - Verificar saúde dos serviços"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@" 