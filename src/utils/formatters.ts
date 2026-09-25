export function formatCurrencyBRL(value: number): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateString?: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
}

export function getPriorityBadgeColor(priority: string): { text: string; bg: string } {
  switch (priority) {
    case 'Urgente':
      return { text: 'text-red-700', bg: 'bg-red-50' };
    case 'Alta':
      return { text: 'text-amber-700', bg: 'bg-amber-50' };
    case 'Média':
      return { text: 'text-blue-700', bg: 'bg-blue-50' };
    case 'Baixa':
    default:
      return { text: 'text-slate-600', bg: 'bg-slate-100' };
  }
}
