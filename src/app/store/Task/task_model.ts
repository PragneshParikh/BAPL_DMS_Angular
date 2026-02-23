export interface TaskListModel {
    creater?: any;
    dueDate?: any;
    priority?: any;
    project?: any;
    status?: any;
    task?: any;
    taskId?: any;
    _id?: any;
    subItem?: Array<{
      id?: any;
      img?: any;
      _id?: any;
  }>;
  }
    
  export interface AssignedModel {
    id: any;
    imgId: any;
    img: any;
    name: any;
}
  
export interface KanbanModel {
    id: string;
    title: string;
    date: string;
    content: string;
    progress: any;
    roles: Array<{}>;
    users: Array<{
        name?: string;
        profile?: string;
    }>;
    view: string;
    comment: string;
    pin: string;
    status: string;
    variant?: string;
  }