import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr'
import { firstValueFrom } from 'rxjs';

import { TrackingInfo } from 'src/app/extras/tracking-info';
import { TrackingService } from 'src/app/tracking.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html'
})
export class DetailsComponent implements OnInit {
  public order: TrackingInfo | null = null
  public loading = true;

  constructor(
    private title: Title,
    private route: ActivatedRoute,
    private router: Router,
    private trackingService: TrackingService,
    private toastr: ToastrService
  ) { }

  async loadOrder (orderId: string) {
    this.loading = true
    try {
      this.order = await firstValueFrom(this.trackingService.getOrder(orderId))
    } catch (e) {
      console.error(e)
      this.toastr.error('Unable to load the Order ID provided, please double-check your invoice.', 'Error')
      this.router.navigate(['/'])
    }
    this.loading = false

    if (this.order?.error) {
      this.toastr.error(`Unable to load Order: ${this.order?.error}`, 'Error')
      this.router.navigate(['/'])
    }
  }

  ngOnInit(): void {
    this.title.setTitle('Order Status - Details')
    this.route.params.subscribe((params) => {
      const { orderId } = params
      if (!this.trackingService.isValidUUID(orderId)) {
        this.toastr.error('Invalid Order ID provided, please double-check your invoice.', 'Error')
        this.router.navigate(['/'])
      }
      this.loadOrder(orderId)
    })
  }
}
