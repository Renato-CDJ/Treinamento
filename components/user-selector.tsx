'use client'

import { useAuth } from '@/contexts/auth-context'
import { mockUsers } from '@/data/mock-data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ShieldIcon, PencilIcon, EyeIcon, ChevronDownIcon, CheckIcon } from 'lucide-react'

const roleConfig = {
  admin: { 
    label: 'Administrador', 
    icon: ShieldIcon, 
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-500/30',
    permissions: 'Visualizar, Editar, Adicionar, Excluir'
  },
  editor: { 
    label: 'Editor', 
    icon: PencilIcon, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-500/30',
    permissions: 'Visualizar, Editar, Adicionar'
  },
  viewer: { 
    label: 'Visitante', 
    icon: EyeIcon, 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
    borderColor: 'border-gray-200 dark:border-gray-500/30',
    permissions: 'Apenas Visualizar e Filtrar'
  },
}

export function UserSelector() {
  const { currentUser, switchUser } = useAuth()

  if (!currentUser) {
    return null
  }

  const config = roleConfig[currentUser.role]
  const RoleIcon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 px-3 border-border">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-medium leading-tight">{currentUser.name.split(' ')[0]}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{config.label}</span>
          </div>
          <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {currentUser.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              <Badge variant="outline" className={`w-fit text-[10px] ${config.color} ${config.borderColor}`}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-3 py-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-2">
            Trocar Usuário (Simulação)
          </p>
          <div className="space-y-1">
            {mockUsers.map((user) => {
              const userConfig = roleConfig[user.role]
              const UserRoleIcon = userConfig.icon
              const isActive = currentUser.id === user.id
              
              return (
                <button
                  key={user.id}
                  onClick={() => switchUser(user.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-secondary border border-transparent'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-xs font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <UserRoleIcon className="h-3 w-3" />
                      {userConfig.label}
                    </span>
                  </div>
                  {isActive && (
                    <CheckIcon className="h-4 w-4 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="px-3 py-2">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">Permissões:</span> {config.permissions}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
