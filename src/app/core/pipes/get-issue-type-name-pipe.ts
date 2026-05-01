import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getIssueTypeName'
})
export class GetIssueTypeNamePipe implements PipeTransform {

  transform(value: any, list: any[]): string {
    if (!value || !list || list.length === 0) return '';

    const issueType = list.find(x => x.id === Number(value));
    return issueType ? issueType.name : '';
  }

}
