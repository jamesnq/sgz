'use client'
import { Shell } from '@/components/shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { STOCK_SEPARATOR } from '@/utilities/constants'
import payloadClient from '@/utilities/payloadClient'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Package2 } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import * as z from 'zod'

import { importStocksAction } from '@/app/_actions/importStocksAction'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ProductVariant } from '@/payload-types'
import { useActionWarper } from '@/utilities/useActionWarper'

function ProductVariantSelect({
  value,
  onChange,
  className,
}: {
  value?: string
  onChange?: (value: string) => void
  className?: string
}) {
  const { data } = useQuery({
    queryKey: ['product-variants'],
    queryFn: async () => {
      return await payloadClient.find({
        collection: 'product-variants',
        depth: 0,
        select: {
          // @ts-expect-error payload types
          id: true,
          name: true,
        },
      })
    },
    select: (data) => data.docs as ProductVariant[],
  })

  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? data?.find((variant) => variant.id.toString() === value)?.name
            : 'Select product...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[200px] p-0', className)}>
        <Command>
          <CommandInput placeholder="Search product..." className="h-9" />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {data?.map((variant) => (
                <CommandItem
                  key={variant.id.toString()}
                  value={variant.id.toString()}
                  keywords={[variant.name]}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {variant.name}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === variant.id.toString() ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type ImportType = 'key' | 'json'

const importSchema = z.object({
  productVariantId: z.string().min(1, 'Please select a product'),
  input: z.string().min(1, 'Please enter some data to import'),
})

type ImportFormData = z.infer<typeof importSchema>

function StockImport() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      input: '',
    },
  })

  const input = watch('input')

  const detectInputType = (value: string): ImportType => {
    if (!value.trim()) return 'key'

    // Try to parse as JSON first
    try {
      JSON.parse(value)
      return 'json'
    } catch {
      // If it's not valid JSON, treat it as key format
      return 'key'
    }
  }

  const calculateCount = (value: string): number => {
    if (!value.trim()) return 0

    const type = detectInputType(value)

    if (type === 'key') {
      return value.split(STOCK_SEPARATOR).filter(Boolean).length
    }

    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.length
      }
      return 1
    } catch {
      return 0
    }
  }

  const count = calculateCount(input)
  const inputType = detectInputType(input)
  const { execute, isExecuting } = useActionWarper(importStocksAction)
  const onSubmit = async (data: ImportFormData) => {
    try {
      let stocksImport: { [key: string]: string }[] = []
      const detectedType = detectInputType(data.input)

      if (detectedType === 'key') {
        stocksImport = data.input
          .split(STOCK_SEPARATOR)
          .map((k) => ({
            key: k.trim(),
          }))
          .filter((k) => k.key)
      } else {
        const jsonData = JSON.parse(data.input)
        stocksImport = Array.isArray(jsonData) ? jsonData : [jsonData]
      }
      if (isExecuting) return
      execute({
        productVariantId: Number(data.productVariantId),
        input: stocksImport,
      })

      toast.success(`${stocksImport.length} items imported`)

      // Reset form
      setValue('input', '')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid format')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ProductVariantSelect
                value={watch('productVariantId')}
                onChange={(value) => setValue('productVariantId', value)}
                className="w-full"
              />
              {errors.productVariantId && (
                <p className="text-sm text-destructive mt-1">{errors.productVariantId.message}</p>
              )}
            </div>

            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Items to import: <span className="font-medium">{count}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Input format:{' '}
                <span className="font-medium">{inputType === 'key' ? 'Keys' : 'JSON'}</span>
              </span>
            </div>
            <Textarea
              {...register('input')}
              placeholder={`Enter keys separated by new line character or JSON data\nExample for keys: \nKEY1\nKEY2\nKEY3\nExample for JSON: ["key1", "key2"] or { "key": "value" }`}
              className="min-h-[200px] font-mono"
            />
            {errors.input && (
              <p className="text-sm text-destructive mt-1">{errors.input.message}</p>
            )}
          </div>

          <Button type="submit" disabled={count === 0 || isExecuting} className="w-full">
            Import {count} {count === 1 ? 'Item' : 'Items'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  return (
    <Shell>
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          {/* <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger> */}
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Import Stock
          </TabsTrigger>
        </TabsList>

        {/* <TabsContent value="dashboard" className="space-y-4">
          <DashboardStats
            expiringStock={mockExpiringStock}
            recentlySold={mockRecentlySold}
            stockQuantities={mockStockQuantities}
          />
        </TabsContent> */}

        <TabsContent value="import">
          <StockImport />
        </TabsContent>
      </Tabs>
    </Shell>
  )
}
