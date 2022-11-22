import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<div class="mt-10 lds-ellipsis mx-auto">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    </div>`,
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent { }
