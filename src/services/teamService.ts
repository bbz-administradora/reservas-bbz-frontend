/**
 * teamService.ts
 *
 * Serviços relacionados ao recurso "Team", utilizando customFetch
 * e garantindo o envio correto de CSRF Token e Cookies de sessão no ambiente servidor.
 */

import type {
  GetTeamMembers200,
  GetTeamMembers200MembersItem,
} from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { customFetch } from '@/api/mutator/custom-fetch'
import { webserver } from '@/infra/webserver'
import { getHeadersServer } from '@/lib/cookie'

// Re-exporta o tipo do membro para uso externo
export type TeamMember = GetTeamMembers200MembersItem

/**
 * fetchTeamMembersInServer
 *
 * Obtém a lista de membros do time que o usuário autenticado pode gerenciar.
 * Filtra supervisor e diretor, pois eles não precisam de exceção de reserva.
 *
 * Fluxo:
 * 1) Chama getHeadersServer() para montar cabeçalhos com CSRF e Cookie.
 * 2) Se getHeadersServer() retornar null, encerra retornando null.
 * 3) Executa fetch para /v1/private/team/members.
 * 4) Filtra membros que são 'manager', 'assistant_manager' ou 'assistant'.
 * 5) Se status === 200, retorna GetTeamMembers200.
 *    Caso contrário, retorna null.
 *
 * @returns {Promise<GetTeamMembers200 | null>} Dados dos membros ou null
 *
 * @example
 * ```ts
 * import { fetchTeamMembersInServer } from '@/services/teamService'
 *
 * async function handleTeam() {
 *   const teamData = await fetchTeamMembersInServer()
 *   if (teamData) {
 *     console.log('Total de membros:', teamData.total)
 *     console.table(teamData.members)
 *   } else {
 *     console.log('Falha ao buscar membros do time')
 *   }
 * }
 * ```
 */
export async function fetchTeamMembersInServer(): Promise<GetTeamMembers200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const response = await customFetch<GetTeamMembers200>(
    `${webserver.hostApi}/v1/private/team/members`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers,
      next: { tags: ['team-members'] },
    },
  )

  if (response.status === 200) {
    // Filtrar supervisor e diretor - eles não precisam de exceção de reserva
    const filteredMembers = response.data.members.filter(
      (member) =>
        member.position !== 'director' && member.position !== 'supervisor',
    )

    return {
      ...response.data,
      members: filteredMembers,
      total: filteredMembers.length,
    }
  }

  return null
}

/**
 * fetchTeamMembersForOutpostsInServer
 *
 * Obtém a lista completa de membros do time para postos avançados.
 * Inclui todos os membros (incluindo supervisores e diretores).
 *
 * @returns {Promise<GetTeamMembers200 | null>} Dados dos membros ou null
 */
export async function fetchTeamMembersForOutpostsInServer(): Promise<GetTeamMembers200 | null> {
  const headers = await getHeadersServer()
  if (!headers) {
    console.warn('CSRF token not found')
    return null
  }

  const response = await customFetch<GetTeamMembers200>(
    `${webserver.hostApi}/v1/private/team/members`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers,
      next: { tags: ['team-members'] },
    },
  )

  if (response.status === 200) {
    return response.data
  }

  return null
}
