'use client'

import type { GetOrganogram200TreeItem } from '@/api/endpoints/bBZAppBackendAPI.schemas'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

const POSITION_LABELS: Record<string, string> = {
  director: 'Diretor',
  supervisor: 'Supervisor',
  manager: 'Gerente',
  assistant_manager: 'Subgerente',
  assistant: 'Assistente',
}

interface ExportOrganogramButtonsProps {
  tree: GetOrganogram200TreeItem[]
}

interface FlatMember {
  nome: string
  email: string
  cargo: string
  nivel: number
  superior: string
}

function flattenTree(
  tree: GetOrganogram200TreeItem[],
  superiorName: string = '',
): FlatMember[] {
  const result: FlatMember[] = []

  for (const member of tree) {
    result.push({
      nome: member.userName || 'Sem nome',
      email: member.userEmail,
      cargo: POSITION_LABELS[member.position] || member.position,
      nivel: member.level,
      superior: superiorName,
    })

    if (
      member.subordinates &&
      (member.subordinates as GetOrganogram200TreeItem[]).length > 0
    ) {
      result.push(
        ...flattenTree(
          member.subordinates as GetOrganogram200TreeItem[],
          member.userName || member.userEmail,
        ),
      )
    }
  }

  return result
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportToCSV(tree: GetOrganogram200TreeItem[]) {
  const members = flattenTree(tree)
  const headers = ['Nome', 'E-mail', 'Cargo', 'Nível', 'Superior Direto']
  const rows = members.map((m) => [
    `"${m.nome}"`,
    `"${m.email}"`,
    `"${m.cargo}"`,
    m.nivel.toString(),
    `"${m.superior}"`,
  ])

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join(
    '\n',
  )

  // Adiciona BOM para Excel reconhecer UTF-8
  const bom = '\uFEFF'
  downloadFile(
    bom + csvContent,
    'organograma-equipe.csv',
    'text/csv;charset=utf-8',
  )
}

function exportToTXT(tree: GetOrganogram200TreeItem[]) {
  const lines: string[] = ['ORGANOGRAMA DA EQUIPE', '='.repeat(50), '']

  function printTree(members: GetOrganogram200TreeItem[], indent: string = '') {
    for (const member of members) {
      const name = member.userName || 'Sem nome'
      const position = POSITION_LABELS[member.position] || member.position
      lines.push(`${indent}├─ ${name}`)
      lines.push(`${indent}│  └ ${position} | ${member.userEmail}`)

      if (
        member.subordinates &&
        (member.subordinates as GetOrganogram200TreeItem[]).length > 0
      ) {
        printTree(
          member.subordinates as GetOrganogram200TreeItem[],
          indent + '│  ',
        )
      }
    }
  }

  printTree(tree)

  downloadFile(
    lines.join('\n'),
    'organograma-equipe.txt',
    'text/plain;charset=utf-8',
  )
}

export function ExportOrganogramButtons({
  tree,
}: ExportOrganogramButtonsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="size-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => exportToCSV(tree)}
          className="cursor-pointer gap-2"
        >
          <FileSpreadsheet className="size-4" />
          Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToTXT(tree)}
          className="cursor-pointer gap-2"
        >
          <FileText className="size-4" />
          Texto (TXT)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
