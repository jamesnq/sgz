'use client'

import { rechargeDoiTheAction, rechargePayosAction } from '@/app/_actions/rechargeAction'
import { RechargeDoiTheSchema, RechargePayosSchema } from '@/app/_actions/schema'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { formatPrice } from '@/utilities/formatPrice'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { z } from 'zod'

function RechargeBank() {
  const form = useForm<z.infer<typeof RechargePayosSchema>>({
    resolver: zodResolver(RechargePayosSchema as any),
    defaultValues: {
      amount: undefined,
    },
  })

  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  async function onSubmit(values: z.infer<typeof RechargePayosSchema>) {
    try {
      setIsLoading(true)
      console.log('[RechargeBank] Submitting:', values)
      const res = await rechargePayosAction(values)
      console.log('[RechargeBank] Response:', res)

      if (!res?.data) {
        const errorMsg =
          typeof res?.serverError === 'string'
            ? res.serverError
            : 'Không thể tạo liên kết thanh toán'
        console.error('[RechargeBank] No data in response:', res)
        toast.error(errorMsg)
        return
      }
      window.open(res.data?.checkoutUrl, '_blank')
      setPaymentUrl(res.data?.checkoutUrl)
      toast.success('Đã mở trang thanh toán')
      setShowPaymentDialog(true)
    } catch (error) {
      console.error('[RechargeBank] Error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo liên kết thanh toán'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRedirect = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank')
      setShowPaymentDialog(false)
    }
  }

  const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

  return (
    <>
      <AccordionItem className="border border-[#2e2e38] bg-[#16161e] rounded-lg px-4 py-2" value="item-1">
        <AccordionTrigger className="text-white hover:text-white/80 hover:no-underline">Ngân hàng hoặc ví điện tử</AccordionTrigger>
        <AccordionContent className="p-2 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="flex flex-col gap-5">
              <FormField
                control={form.control as any}
                name="amount"
                render={({ field }: any) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col space-y-3">
                        <div className="flex space-x-2 items-center">
                          <Input
                            className="flex-1 bg-[#0f0f13] border-[#2e2e38] text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-[#8b5cf6]"
                            type="text"
                            {...field}
                            value={field.value ? Number(field.value).toLocaleString('en-US') : ''}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/,/g, '');
                              const parsedValue = parseInt(rawValue, 10);
                              field.onChange(isNaN(parsedValue) ? undefined : parsedValue);
                            }}
                            placeholder="Nhập số tiền muốn nạp"
                          />
                          <span className="font-medium text-white/80">VND</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_AMOUNTS.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="bg-[#0f0f13] border-[#2e2e38] text-white/80 hover:bg-[#2e2e38] hover:text-white font-normal"
                              onClick={() => {
                                form.setValue('amount', amount, { shouldValidate: true })
                              }}
                            >
                              {formatPrice(amount)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button 
                className="w-full sm:w-auto bg-[#8b5cf6] text-white hover:bg-[#7c3aed] border-0" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Nạp tiền'}
              </Button>
            </form>
          </Form>
        </AccordionContent>
      </AccordionItem>
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md border-[#2e2e38] bg-[#16161e] text-white">
          <DialogHeader>
            <DialogTitle className="text-white mt-1">Thanh toán</DialogTitle>
            <DialogDescription className="text-white/60">
              Nhấn nút bên dưới để chuyển đến trang thanh toán nếu không được tự động chuyển hướng
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4 border-t border-[#2e2e38] pt-4">
            <Button
              type="button"
              className="w-full bg-[#8b5cf6] text-white hover:bg-[#7c3aed] border-0"
              onClick={handleManualRedirect}
            >
              Mở trang thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Define FeeData interface
interface FeeData {
  telco: string
  value: number
  fees: number
  penalty: number
}

function RechargeCard() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feeData, setFeeData] = useState<FeeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTelco, setSelectedTelco] = useState('')
  const [selectedDenomination, setSelectedDenomination] = useState<number>(0)
  const [availableDenominations, setAvailableDenominations] = useState<number[]>([])
  const [currentFeeInfo, setCurrentFeeInfo] = useState<{ fees: number; penalty: number } | null>(
    null,
  )
  // Add state for telco fee ranges
  const [telcoFeeRanges, setTelcoFeeRanges] = useState<
    Record<string, { min: number; max: number }>
  >({})

  const form = useForm<z.infer<typeof RechargeDoiTheSchema>>({
    resolver: zodResolver(RechargeDoiTheSchema as any),
    defaultValues: {
      telco: '',
      code: '',
      serial: '',
      amount: 0,
    },
  })

  const code = form.watch('code')
  const serial = form.watch('serial')

  useEffect(() => {
    async function fetchFeeData() {
      try {
        setIsLoading(true)

        const response = await fetch('/api/doithe/fees')
        const data = await response.json()

        if (data.success && data.data) {
          setFeeData(data.data.filter((item: FeeData) => item.fees <= 20))

          // Calculate min and max fees for each telco - completely restructured to avoid TypeScript errors
          const feeRanges: Record<string, { min: number; max: number }> = {}

          // First pass: collect all telcos with proper typing
          const telcos: string[] = Array.from(
            new Set(data.data.map((item: FeeData) => item.telco as string)),
          )

          // Initialize all telcos with default values
          telcos.forEach((telco: string) => {
            feeRanges[telco] = {
              min: Number.MAX_VALUE,
              max: 0,
            }
          })

          // Second pass: calculate min and max for each telco
          data.data.forEach((item: FeeData) => {
            const telco = item.telco
            if (feeRanges[telco]) {
              feeRanges[telco].min = Math.min(feeRanges[telco].min, item.fees)
              feeRanges[telco].max = Math.max(feeRanges[telco].max, item.fees)
            }
          })

          setTelcoFeeRanges(feeRanges)
        } else {
          toast.error('Không thể tải thông tin nhà mạng và mệnh giá')
        }
      } catch (error) {
        toast.error('Không thể tải thông tin nhà mạng và mệnh giá')
        console.error('Error fetching fee data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeeData()
  }, [form])

  const handleTelcoChange = (telco: string) => {
    setSelectedTelco(telco)
    form.setValue('telco', telco)

    // Get denominations for the selected telco
    const denominations = feeData.filter((item) => item.telco === telco).map((item) => item.value)

    setAvailableDenominations(denominations)

    // No longer automatically setting the first denomination
    // Clear the current amount selection
    form.setValue('amount', 0)
    setSelectedDenomination(0)
    setCurrentFeeInfo(null)
  }

  const handleDenominationChange = (value: string) => {
    const amount = parseInt(value, 10)
    if (!isNaN(amount)) {
      form.setValue('amount', amount)
      setSelectedDenomination(amount)

      // Update fee info
      updateFeeInfo(selectedTelco, amount)
    }
  }

  const updateFeeInfo = (telco: string, amount: number) => {
    const feeInfo = feeData.find((item) => item.telco === telco && item.value === amount)

    if (feeInfo) {
      setCurrentFeeInfo({
        fees: feeInfo.fees,
        penalty: feeInfo.penalty,
      })
    } else {
      setCurrentFeeInfo(null)
    }
  }

  // Function to get fee for a specific telco and denomination
  const getFeeForDenomination = (telco: string, amount: number): number => {
    const feeInfo = feeData.find((item) => item.telco === telco && item.value === amount)
    return feeInfo ? feeInfo.fees : 0
  }

  const isFormValid = () => {
    return selectedTelco !== '' && selectedDenomination > 0 && code !== '' && serial !== ''
  }

  async function onSubmit(values: z.infer<typeof RechargeDoiTheSchema>) {
    try {
      setIsSubmitting(true)
      const response = await rechargeDoiTheAction(values)

      if (response && response.data) {
        const res = response.data

        if (res.success) {
          const message =
            res.message ||
            'Thẻ đã được gửi đi, vui lòng đợi xử lý, sẽ có thông báo sau khi xử lý xong'
          toast.success(message)

          // Only reset the card code and serial, keep telco and amount selections
          form.setValue('code', '', { shouldValidate: true, shouldDirty: true })
          form.setValue('serial', '', { shouldValidate: true, shouldDirty: true })
          router.refresh()
        } else if (res.message) {
          toast.error(res.message || 'Có lỗi xảy ra khi nạp thẻ vui lòng kiểm tra lại')
        }
      } else {
        toast.error('Có lỗi xảy ra khi nạp thẻ vui lòng kiểm tra lại')
      }
    } catch (error) {
      console.error('Error in rechargeDoiTheAction:', error)
      toast.error('Có lỗi xảy ra khi nạp thẻ vui lòng kiểm tra lại')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get unique telco providers for the dropdown
  const uniqueTelcos = useMemo(() => {
    // List of Vietnamese telecom providers to prioritize
    const priorityTelcos = ['VIETTEL', 'MOBIFONE', 'VINAPHONE', 'VIETNAMOBILE', 'GMOBILE']

    // Get all unique telcos from the fee data
    const allTelcos = Array.from(new Set(feeData.map((item) => item.telco)))

    // Sort telcos: Vietnamese telecom providers first, then others alphabetically
    return allTelcos.sort((a, b) => {
      const aIndex = priorityTelcos.indexOf(a)
      const bIndex = priorityTelcos.indexOf(b)

      // If both are priority telcos, sort by their order in the priority list
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }

      // If only a is a priority telco, it comes first
      if (aIndex !== -1) {
        return -1
      }

      // If only b is a priority telco, it comes first
      if (bIndex !== -1) {
        return 1
      }

      // If neither is a priority telco, sort alphabetically
      return a.localeCompare(b)
    })
  }, [feeData])

  return (
    <AccordionItem className="border border-[#2e2e38] bg-[#16161e] rounded-lg px-4 py-2" value="item-2">
      <AccordionTrigger className="text-white hover:text-white/80 hover:no-underline">Thẻ cào điện thoại</AccordionTrigger>
      <AccordionContent className="p-2 pt-4">
        <div className="text-amber-400 text-sm mb-4">
          Khuyến khích khách hàng nạp thông qua ngân hàng hoặc ví điện tử để tránh chiết khấu từ nhà
          mạng.
        </div>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
              <FormField
                control={form.control as any}
                name="telco"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Loại thẻ</FormLabel>
                    <Select onValueChange={(value) => handleTelcoChange(value)} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0f0f13] border-[#2e2e38] text-white focus:ring-1 focus:ring-[#8b5cf6]">
                          <SelectValue placeholder="Chọn nhà mạng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#16161e] border-[#2e2e38] text-white">
                        {uniqueTelcos.map((telco) => (
                          <SelectItem key={telco} value={telco}>
                            <div className="flex space-x-2 w-full items-center">
                              <span className="font-medium">{telco}</span>
                              {telcoFeeRanges[telco] && (
                                <div className="text-xs text-amber-500">
                                  Phí: {telcoFeeRanges[telco].min}
                                  {telcoFeeRanges[telco].min !== telcoFeeRanges[telco].max ? (
                                    <>
                                      {' '}
                                      <span className="mx-1 font-bold">→</span>{' '}
                                      {telcoFeeRanges[telco].max}
                                    </>
                                  ) : (
                                    ''
                                  )}
                                  %
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="amount"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Mệnh giá</FormLabel>
                    <Select
                      onValueChange={handleDenominationChange}
                      value={field.value.toString()}
                      disabled={availableDenominations.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#0f0f13] border-[#2e2e38] text-white focus:ring-1 focus:ring-[#8b5cf6] disabled:opacity-50">
                          <SelectValue placeholder="Chọn mệnh giá" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#16161e] border-[#2e2e38] text-white">
                        {availableDenominations.map((amount) => {
                          const fee = getFeeForDenomination(selectedTelco, amount)
                          return (
                            <SelectItem key={amount} value={amount.toString()}>
                              <div className="flex space-x-2 justify-between w-full items-center">
                                <span className="font-medium">{formatPrice(amount)}</span>
                                <span className="text-amber-500 text-xs"> Phí: {fee}%</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentFeeInfo && (
                <div className="text-sm space-y-2 p-3 bg-[#0f0f13] border border-[#2e2e38] rounded-md text-white/80">
                  <div className="flex justify-between">
                    <span>Chiết khấu từ nhà mạng:</span>
                    <span className="font-medium text-amber-500">{currentFeeInfo.fees}%</span>
                  </div>

                  {selectedDenomination > 0 && (
                    <div className="flex justify-between border-t border-[#2e2e38] pt-2 mt-1">
                      <span>Thực nhận (ước tính):</span>
                      <span className="font-medium text-[#8b5cf6]">
                        {Math.round(
                          selectedDenomination * (1 - currentFeeInfo.fees / 100),
                        ).toLocaleString('vi-VN')}{' '}
                        VND
                      </span>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-[#2e2e38] text-red-400 text-xs">
                    <p className="font-medium mb-1">Lưu ý:</p>
                    <p>
                      Nếu nhập sai thông tin thẻ, bạn sẽ bị phạt {currentFeeInfo.penalty}% giá trị
                      thẻ.
                    </p>
                  </div>
                </div>
              )}

              <FormField
                control={form.control as any}
                name="serial"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Số Serial</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-[#0f0f13] border-[#2e2e38] text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-[#8b5cf6]" placeholder="Nhập số serial thẻ" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="code"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Mã thẻ</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-[#0f0f13] border-[#2e2e38] text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-[#8b5cf6]" placeholder="Nhập mã thẻ" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button 
                className="w-full sm:w-auto bg-[#8b5cf6] text-white hover:bg-[#7c3aed] border-0" 
                type="submit" 
                disabled={isSubmitting || !isFormValid()}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Nạp thẻ'}
              </Button>
            </form>
          </Form>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export function Recharges() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-2">
      <RechargeBank />
      <RechargeCard />
    </Accordion>
  )
}

export function RechargeDialog({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[600px] border-[#2e2e38] bg-[#0f0f13] text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Nạp tiền</DialogTitle>
          <DialogDescription className="text-white/60">Chọn phương thức nạp tiền của bạn.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Recharges />
        </div>
      </DialogContent>
    </Dialog>
  )
}
