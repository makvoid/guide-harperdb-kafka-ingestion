import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import { environment } from 'src/environments/environment'
import { TrackingInfo } from './extras/tracking-info'
import { Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class TrackingService {
  constructor (private http: HttpClient) { }

  isValidUUID (uuid: string) {
    return uuid.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i) !== null
  }

  getOrder (orderId: string): Observable<TrackingInfo> {
    return this.http.get<TrackingInfo>(
      `${environment.apiUrl}order/${orderId}`
    )
  }
}