import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDate',
  standalone: true
})
export class CustomDatePipe implements PipeTransform {
  transform(value: Date | string, format: string = 'short'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;

    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return date.toLocaleTimeString();
      case 'full':
        return date.toLocaleString();
      default:
        return date.toLocaleDateString();
    }
  }
}
