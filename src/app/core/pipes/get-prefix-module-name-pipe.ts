import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getPrefixModuleName'
})
export class GetPrefixModuleNamePipe implements PipeTransform {

  transform(value: any, list: any[]): string {
    if (!value || !list || list.length === 0) return '';

    const module = list.find(x => x.name === value)
    return module ? module.moduleName : '';
  }

}
