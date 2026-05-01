import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getTechnicianName'
})
export class GetTechnicianNamePipe implements PipeTransform {

  transform(value: any, list: any[]): string {
    if (!value || !list || list.length === 0) return '';

    const tech = list.find(x => x.id === value);
    return tech ? tech.name : '';
  }

}
