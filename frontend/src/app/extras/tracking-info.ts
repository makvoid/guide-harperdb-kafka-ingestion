export interface TrackingInfo {
    error?: string
    id: string
    name: string
    email: string
    number: string
    total: string
    orderDate: string
    deliveryDate: string
    rewardPoints: number
    tracking: {
        carrier: string
        number: string
    }
    __createdtime__: number
    __updatedtime__: number
}