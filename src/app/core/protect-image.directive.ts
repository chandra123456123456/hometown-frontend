import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appProtectImage]',
  standalone: true,
})
export class ProtectImageDirective {
  private el = inject(ElementRef<HTMLImageElement>);

  constructor() {
    const s = this.el.nativeElement.style as CSSStyleDeclaration & { webkitUserDrag: string };
    this.el.nativeElement.draggable = false;
    s.userSelect = 'none';
    s.webkitUserDrag = 'none';
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event): void {
    e.preventDefault();
  }
}
