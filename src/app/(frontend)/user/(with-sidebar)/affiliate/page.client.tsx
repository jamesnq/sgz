'use client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  TableBody,
  TableCell,
  TableCustom,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { formatPrice } from '@/utilities/formatPrice'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  HandCoins,
  Loader2,
  TrendingUp,
  Search,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface AffiliateStats {
  totalCommission: number
  paidCommission: number
  unpaidCommission: number
  totalOrders: number
}

interface AffiliateOrder {
  id: number
  totalPrice: number
  subTotal: number
  affiliateCommission: number
  affiliatePaid: boolean
  createdAt: string
  status: string
}

interface AffiliateData {
  stats: AffiliateStats
  orders: AffiliateOrder[]
  pagination: {
    page: number
    limit: number
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatusLabel(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    IN_QUEUE: { label: 'Chờ xử lý', variant: 'secondary' },
    IN_PROCESS: { label: 'Đang xử lý', variant: 'default' },
    USER_UPDATE: { label: 'Cần cập nhật', variant: 'outline' },
    COMPLETED: { label: 'Hoàn thành', variant: 'default' },
    REFUND: { label: 'Hoàn trả', variant: 'destructive' },
  }
  return map[status] || { label: status, variant: 'secondary' as const }
}

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof DollarSign
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 flex items-center gap-4 ${className || ''}`}>
      <div className="rounded-full p-2.5 bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function AffiliatePageClient() {
  const { setHeaderTheme } = useHeaderTheme()
  const [data, setData] = useState<AffiliateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])

  const fetchData = useCallback(async (from?: string, to?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`/api/affiliate/stats?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.error('Failed to fetch affiliate stats', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilter = () => {
    fetchData(fromDate || undefined, toDate || undefined)
  }

  const handleClearFilter = () => {
    setFromDate('')
    setToDate('')
    fetchData()
  }

  if (loading && !data) {
    return (
      <Card className="max-md:border-0">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const stats = data?.stats || {
    totalCommission: 0,
    paidCommission: 0,
    unpaidCommission: 0,
    totalOrders: 0,
  }
  const orders = data?.orders || []

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Tổng hoa hồng"
          value={formatPrice(stats.totalCommission)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Đã thanh toán"
          value={formatPrice(stats.paidCommission)}
          className="border-green-500/20"
        />
        <StatCard
          icon={Clock}
          label="Chưa thanh toán"
          value={formatPrice(stats.unpaidCommission)}
          className="border-yellow-500/20"
        />
        <StatCard
          icon={HandCoins}
          label="Tổng đơn hàng"
          value={stats.totalOrders.toString()}
        />
      </div>

      {/* Filter & Table */}
      <Card className="max-md:border-0">
        <CardHeader className="max-md:p-2">
          <h4 className="font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Sao kê hoa hồng
          </h4>
          <div className="flex flex-wrap gap-2 items-end mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Từ ngày</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Đến ngày</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleFilter} size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1">Lọc</span>
            </Button>
            {(fromDate || toDate) && (
              <Button onClick={handleClearFilter} size="sm" variant="outline" disabled={loading}>
                Xoá lọc
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="max-md:p-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length > 0 ? (
            <TableCustom>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Giá gốc</TableHead>
                  <TableHead>Hoa hồng</TableHead>
                  <TableHead>Trạng thái ĐH</TableHead>
                  <TableHead>Thanh toán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const statusInfo = getStatusLabel(order.status)
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell className="text-nowrap text-sm">
                        {formatDate(new Date(order.createdAt))}
                      </TableCell>
                      <TableCell className="text-nowrap">
                        {formatPrice(order.subTotal)}
                      </TableCell>
                      <TableCell className="text-nowrap font-semibold text-green-600">
                        +{formatPrice(order.affiliateCommission)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {order.affiliatePaid ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Đã nhận
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Chờ
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </TableCustom>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <HandCoins className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">Chưa có đơn hàng nào</p>
              <p className="text-sm">Khi khách hàng sử dụng mã voucher của bạn, dữ liệu sẽ hiển thị tại đây</p>
            </div>
          )}
        </CardContent>
        {orders.length > 0 && (
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Hiển thị {orders.length} đơn hàng
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
