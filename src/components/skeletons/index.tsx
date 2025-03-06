import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Shell } from '@/components/shell'

export function PageHeaderSkeleton({
  title = true,
  subtitle = true,
  search = true,
  filters = false,
}: {
  title?: boolean
  subtitle?: boolean
  search?: boolean
  filters?: boolean
}) {
  return (
    <CardHeader className="max-md:p-1">
      {title && <Skeleton className="h-6 w-48 mb-2" />}
      {subtitle && <Skeleton className="h-4 w-64 mb-4" />}
      <div className="flex flex-col gap-2">
        {filters && (
          <div className="flex gap-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
          </div>
        )}
        {search && <Skeleton className="h-10 w-72" />}
      </div>
    </CardHeader>
  )
}

export function PaginationSkeleton({ itemCount = 3 }: { itemCount?: number }) {
  return (
    <CardFooter>
      <div className="flex justify-end w-full">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          {Array(itemCount)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-md" />
            ))}
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </CardFooter>
  )
}

export function OrderCardSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-start gap-4">
          <Skeleton className="w-[64px] h-[85px] rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex-1 flex justify-end">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex py-3 border-b last:border-0">
      <div className="flex-1">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-5 w-full" />
      </div>
    </div>
  )
}

export function TransactionTableHeaderSkeleton() {
  return (
    <div className="flex border-b pb-2 mb-4">
      <div className="flex-1">
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-5 w-full" />
      </div>
    </div>
  )
}

export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return <Card className="max-md:border-0">{children}</Card>
}
