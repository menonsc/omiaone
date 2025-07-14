import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Settings, 
  Menu,
  Bot,
  LogOut,
  MessageCircle,
  Mail,
  Phone,
  BarChart3,
  Activity,
  Shield,
  Users
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import { useIsAdmin } from '../../hooks/usePermissionsQueries'
import { PermissionGuard, ConditionalRender } from '../PermissionGuard'
import { motion } from 'framer-motion'
import DashboardIcon from '../../svg/sidebar/dashboard.svg';
import ChatIAIcon from '../../svg/sidebar/chat_ia.svg';
import WhatsAppIcon from '../../svg/sidebar/whatsapp.svg';
import EmailMarketingIcon from '../../svg/sidebar/email_marketing.svg';
import ConfiguracoesIcon from '../../svg/sidebar/configuracoes.svg';
import PainelSuperAdminIcon from '../../svg/sidebar/painel_super_admin.svg';
import LogoutIcon from '../../svg/sidebar/logout.svg';
import SearchIcon from '../../svg/sidebar/dashboard.svg'; // Substitua pelo SVG correto de lupa se houver
import FinanceiroIcon from '../../svg/sidebar/financeiro.svg';

// Definir estrutura de navegação com permissões
interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  // Permissões específicas
  resource?: string
  action?: string
  // Roles específicos
  roles?: string[]
  requireAllRoles?: boolean
  // Condições legadas
  adminOnly?: boolean
  superAdminOnly?: boolean
}

interface MainNavigationItem {
  name: string;
  icon: any;
  href?: string;
  accordion?: boolean;
  subItems?: { name: string; href: string }[];
}

const mainNavigation: MainNavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: DashboardIcon,
  },
  {
    name: 'Chat IA',
    href: '/chat',
    icon: ChatIAIcon,
  },
  {
    name: 'Conversas',
    href: '/whatsapp-conversations',
    icon: WhatsAppIcon,
  },
  {
    name: 'Email Marketing',
    href: '/email-marketing',
    icon: EmailMarketingIcon,
  },
  {
    name: 'Fluxos',
    href: '/flows',
    icon: FinanceiroIcon, // Usar ícone temporário até criar um específico
  },
  {
    name: 'Configurações',
    icon: ConfiguracoesIcon,
    accordion: true,
    subItems: [
      { name: 'Perfil', href: '/settings/profile' },
      { name: 'Preferências', href: '/settings/preferences' },
      { name: 'Segurança', href: '/settings/security' },
      { name: 'Inteligência IA', href: '/settings/ai' },
      { name: 'Webhooks', href: '/settings/webhooks' },
      { name: 'Instâncias', href: '/settings/instances' },
      { name: 'Integrações', href: '/settings/integrations' },
    ],
  },
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: FinanceiroIcon,
  },
];

const superAdminPanel = {
  title: 'Painel Super Admin',
  icon: PainelSuperAdminIcon,
  items: [
    { name: 'Gerenciar Papéis', href: '/roles' },
    { name: 'Status do Sistema', href: '/status' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Gestão de Usuários', href: '/users' },
  ],
};

// Componente para item de navegação com proteção
const NavigationItem: React.FC<{
  item: MainNavigationItem
  isActive: boolean
  sidebarOpen: boolean
  onAccordionToggle?: () => void
  isAccordionOpen?: boolean
}> = ({ item, isActive, sidebarOpen, onAccordionToggle, isAccordionOpen }) => {
  // Renderizar ícone SVG como <img src={Icon} ... />
  const iconSize = 20;
  const icon = (
    <img src={item.icon} alt={item.name + ' icon'} width={iconSize} height={iconSize} className="flex-shrink-0 text-neutral-700 dark:text-neutral-200" style={{ filter: 'invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)', color: 'inherit' }} />
  );

  if (item.accordion && item.subItems) {
    return (
      <div>
        <button
          type="button"
          className={`flex items-center w-full space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-[#353A45] dark:text-neutral-200 ${isAccordionOpen ? 'font-semibold bg-[#E9E9E9] dark:bg-[#353A45]' : ''}`}
          onClick={onAccordionToggle}
        >
          {icon}
          {sidebarOpen && <span className="font-medium flex-1 text-left dark:text-neutral-200">{item.name}</span>}
          {sidebarOpen && (
            <span className={`ml-auto transition-transform ${isAccordionOpen ? 'rotate-180' : ''}`}>▼</span>
          )}
        </button>
        {isAccordionOpen && (
          <div className="pl-7 border-l-2 border-[#E0E0E0] dark:border-[#353A45] ml-2 mt-1">
            {item.subItems.map((sub) => (
              <Link
                key={sub.href}
                to={sub.href}
                className={`block py-1.5 px-2 rounded-md text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#353A45] ${location.pathname === sub.href ? 'bg-[#E9E9E9] dark:bg-[#353A45] font-semibold' : ''}`}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.href) {
    return (
      <Link
        to={item.href}
        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors dark:text-neutral-200 ${
          isActive ? 'bg-[#E9E9E9] dark:bg-[#353A45] font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-[#353A45]'
        }`}
      >
        {icon}
        {sidebarOpen && <span className="font-medium dark:text-neutral-200">{item.name}</span>}
      </Link>
    );
  }
  return null;
};

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen } = useUIStore()
  const { signOut, profile } = useAuthStore()
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: sidebarOpen ? 256 : 64 }}
      className="fixed left-0 top-0 h-full bg-[#F7F7F7] dark:bg-[#23272F] border-r border-[#E0E0E0] dark:border-[#353A45] z-40 flex flex-col justify-between"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            {/* Ícone de robô genérico */}
            <img src={DashboardIcon} alt="Omia Logo" className="w-7 h-7" />
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Omia</span>
          </div>
          {/* Campo de busca */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#B0B0B0" strokeWidth="2"/><path d="M20 20L17 17" stroke="#B0B0B0" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white dark:bg-[#23272F] border border-[#E0E0E0] dark:border-[#353A45] text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 text-neutral-900 dark:text-neutral-100"
              placeholder="Procurar"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Sessão 1 - MainNavigation em card igual sessão 2 */}
          <div className="bg-white dark:bg-[#23272F] border border-[#E0E0E0] dark:border-[#353A45] rounded-xl p-3 shadow-sm mb-6">
            <div className="flex flex-col gap-1">
              {mainNavigation.map((item) => {
                const isActive = item.href ? location.pathname === item.href : false;
                if (item.accordion) {
                  return (
                    <NavigationItem
                      key={item.name}
                      item={item}
                      isActive={false}
                      sidebarOpen={sidebarOpen}
                      onAccordionToggle={() => setSettingsOpen((v) => !v)}
                      isAccordionOpen={settingsOpen}
                    />
                  );
                }
                return (
                  <NavigationItem
                    key={item.name}
                    item={item}
                    isActive={isActive}
                    sidebarOpen={sidebarOpen}
                  />
                );
              })}
            </div>
          </div>
          {/* Sessão 2 - Painel Super Admin */}
          <div>
            <div className="bg-white dark:bg-[#23272F] border border-[#E0E0E0] dark:border-[#353A45] rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <img src={superAdminPanel.icon} alt="Painel Super Admin" className="w-5 h-5" />
                <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">{superAdminPanel.title}</span>
              </div>
              <div className="pl-5 border-l-2 border-[#E0E0E0] dark:border-[#353A45] ml-1 flex flex-col gap-1">
                {superAdminPanel.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`block py-1 px-2 rounded-md text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#353A45] ${location.pathname === item.href ? 'bg-[#E9E9E9] dark:bg-[#353A45] font-semibold' : ''}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* User Section (Footer) */}
        <div className="p-4">
          <div className="bg-white dark:bg-[#23272F] border border-[#E0E0E0] dark:border-[#353A45] rounded-xl p-3 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E9E9E9] dark:bg-[#353A45] rounded-full flex items-center justify-center text-lg font-bold text-primary-700 dark:text-primary-300">
              {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{profile?.full_name || 'Usuário'}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{/* Ajuste aqui se profile.email for adicionado no futuro */}email@exemplo.com</div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-[#353A45] transition-colors"
              title="Sair"
            >
              <img src={LogoutIcon} alt="Logout" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 