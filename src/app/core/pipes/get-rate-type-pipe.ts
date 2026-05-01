import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getRateType'
})
export class GetRateTypePipe implements PipeTransform {

  transform(value: any, list: any[]): string {
    if (!value || !list || list.length === 0) return '';

    const rateType = list.find(x => x.id === Number(value));
    return rateType ? rateType.title : '';
  }

}
