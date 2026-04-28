import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getDurationType'
})
export class GetDurationTypePipe implements PipeTransform {

  transform(value: any, list: any[]): string {
    if (!value || !list || list.length === 0) return '';

    const duration = list.find(x => x.id === Number(value));
    return duration ? duration.title : '';
  }

}
