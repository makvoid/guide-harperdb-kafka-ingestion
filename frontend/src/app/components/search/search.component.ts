import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { TrackingService } from 'src/app/tracking.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  public orderId = ''
  public error: string | null = null

  constructor(
    private router: Router,
    private title: Title,
    private trackingService: TrackingService
  ) { }

  ngOnInit(): void {
    this.title.setTitle('Order Status - Search')
  }

  onSubmit(event: any){
    event.preventDefault()

    if (!this.trackingService.isValidUUID(this.orderId)) {
      this.error = 'Invalid Order ID provided - please double check your invoice!'
      return
    }

    this.router.navigate(['/order/', this.orderId])
  }

  onChange(event: any){
    this.orderId = event.target.value

    // Detect when an order id is provided
    if (this.trackingService.isValidUUID(this.orderId)) {
      this.router.navigate(['/order/', this.orderId])
    }
  }

}
