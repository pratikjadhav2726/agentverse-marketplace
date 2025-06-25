"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Trash2 } from "lucide-react"
import type { PaymentMethod } from "@/lib/payment-types"

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function PaymentMethodCard({ paymentMethod, onDelete, onSetDefault }: PaymentMethodCardProps) {
  const getCardBrandIcon = (brand: string) => {
    // You could add specific brand icons here
    return <CreditCard className="h-5 w-5" />
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getCardBrandIcon(paymentMethod.card?.brand || "")}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">•••• •••• •••• {paymentMethod.card?.last4}</span>
                {paymentMethod.isDefault && <Badge variant="default">Default</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {paymentMethod.card?.brand?.toUpperCase()} • Expires {paymentMethod.card?.expMonth}/
                {paymentMethod.card?.expYear}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!paymentMethod.isDefault && (
              <Button variant="outline" size="sm" onClick={() => onSetDefault(paymentMethod.id)}>
                Set Default
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onDelete(paymentMethod.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
