export interface TicketListModel {
  id: string;
  title: string;
  client: string;
  assigned: string;
  create: string;
  dueDate: string;
  status: string;
  statusClass: string;
  priority: string;
  priorityClass: string;
  isSelected?: any;
}
