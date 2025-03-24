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
import { Check, ChevronsUpDown, Package2, Upload } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import * as z from 'zod'
import * as ExcelJS from 'exceljs'

import { importStocksAction } from '@/app/_actions/importStocksAction'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ProductVariant } from '@/payload-types'
import { useActionWarper } from '@/utilities/useActionWarper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
        where: {
          autoProcess: {
            equals: 'key',
          },
        },
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

type ImportType = 'key' | 'json' | 'excel'

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

  const [isProcessing, setIsProcessing] = React.useState(false)

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

  const handleExcelFile = async (file: File) => {
    setIsProcessing(true)
    try {
      const workbook = new ExcelJS.Workbook()
      const arrayBuffer = await file.arrayBuffer()
      await workbook.xlsx.load(arrayBuffer)

      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        throw new Error('No worksheet found in the Excel file')
      }

      const jsonData: Record<string, string>[] = []
      const headers: string[] = []
      const headerCounts: Record<string, number> = {}

      // Process headers (first row)
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        const originalHeader = cell.value?.toString() || `Column ${colNumber}`

        // Track header counts for numbering
        if (headerCounts[originalHeader]) {
          headerCounts[originalHeader]++
        } else {
          headerCounts[originalHeader] = 1
        }

        // Generate header name with numbering starting from #1
        let header = originalHeader
        if (headerCounts[originalHeader] > 1) {
          header = `${originalHeader} #${headerCounts[originalHeader]}`
        }

        headers[colNumber - 1] = header
      })

      // Process data rows
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber)
        if (row.cellCount === 0) continue // Skip empty rows

        const rowData: Record<string, string> = {}

        // Initialize all headers with empty strings to ensure all columns are present
        headers.forEach((header) => {
          rowData[header] = ''
        })

        // Fill in values from the row
        row.eachCell((cell, colNumber) => {
          if (colNumber <= headers.length) {
            const cellValue = cell.value
            // Ensure all values are converted to strings
            if (cellValue !== null && cellValue !== undefined) {
              // @ts-expect-error ignore
              rowData[headers[colNumber - 1]] = cellValue.toString()
            }
          }
        })

        // Only add rows that have at least one non-empty value
        if (Object.values(rowData).some((value) => value.trim() !== '')) {
          jsonData.push(rowData)
        }
      }

      if (jsonData.length === 0) {
        throw new Error('No data found in the Excel file')
      }

      // Update the textarea with the JSON data
      setValue('input', JSON.stringify(jsonData, null, 2))
      toast.success(`Excel file processed: ${jsonData.length} rows found`)

      // Reset the file input to allow selecting the same file again
      const fileInput = document.getElementById('excel-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process Excel file')
      console.error('Excel processing error:', err)
    } finally {
      setIsProcessing(false)
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
        try {
          const jsonData = JSON.parse(data.input)
          stocksImport = Array.isArray(jsonData) ? jsonData : [jsonData]
        } catch (_) {
          throw new Error('Invalid JSON format')
        }
      }

      if (stocksImport.length === 0) {
        throw new Error('No valid items to import')
      }

      if (isExecuting) return

      try {
        await execute({
          productVariantId: Number(data.productVariantId),
          input: stocksImport,
        })
        toast.success(`${stocksImport.length} items imported`)
      } catch (err) {
        throw err
      } finally {
        // Reset form
        setValue('input', '')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid format')
      console.error('Import error:', err)
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

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Input format:{' '}
                <span className="font-medium">{inputType === 'key' ? 'Keys' : 'JSON'}</span>
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />
                    Import Excel
                  </div>
                  <Input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleExcelFile(file)
                      }
                    }}
                    disabled={isProcessing}
                    // Add key to force re-render of the input
                    key={`excel-upload-${isProcessing ? 'processing' : 'ready'}`}
                  />
                </Label>
              </div>
            </div>
            <Textarea
              {...register('input')}
              placeholder={`Enter keys separated by new line character or JSON data\nExample for keys: \nKEY1\nKEY2\nKEY3\nExample for JSON: ["key1", "key2"] or { "key": "value" }\nOr import an Excel file using the button above`}
              className="min-h-[200px] font-mono"
              disabled={isProcessing}
            />
            {errors.input && (
              <p className="text-sm text-destructive mt-1">{errors.input.message}</p>
            )}
            {isProcessing && (
              <p className="text-sm text-muted-foreground">Processing Excel file...</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={count === 0 || isExecuting || isProcessing}
            className="w-full"
          >
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
