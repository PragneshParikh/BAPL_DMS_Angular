import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getUserNameById'
})
export class GetUserNameByIdPipe implements PipeTransform {

  transform(userId: any, users: any[]): string {
    if (!userId || !users || users.length === 0) {
      return '';
    }

    const user = users.find(u => u.id === userId);

    return user ? user.userName : '';
  }

}
