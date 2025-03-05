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

import { zodResolver } from '@hookform/resolvers/zod'
import { CirclePlus } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { z } from 'zod'

function RechargeBank() {
  const form = useForm<z.infer<typeof RechargePayosSchema>>({
    resolver: zodResolver(RechargePayosSchema),
    defaultValues: {
      amount: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof RechargePayosSchema>) {
    try {
      const res = await rechargePayosAction(values)
      if (!res?.data) {
        toast.error('Không thể tạo liên kết thanh toán')
        return
      }
      window.open(res.data?.checkoutUrl, '_blank')
      toast.success('Đã mở trang thanh toán')
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo liên kết thanh toán')
    }
  }

  return (
    <AccordionItem className="border rounded-lg p-2" value="item-1">
      <AccordionTrigger>Ngân hàng hoặc ví điện tử</AccordionTrigger>
      <AccordionContent className="p-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex space-x-1 items-center">
                      <Input
                        className="w-[250px]"
                        type="number"
                        {...field}
                        placeholder="Nhập số tiền muốn nạp"
                      />
                      <span className="ml-2">VND</span>
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-32" type="submit">
              Nạp tiền
            </Button>
          </form>
        </Form>
      </AccordionContent>
    </AccordionItem>
  )
}

function RechargeCard() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feeData, setFeeData] = useState<
    Array<{
      telco: string
      value: number
      fees: number
      penalty: number
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTelco, setSelectedTelco] = useState('')
  const [selectedDenomination, setSelectedDenomination] = useState<number>(0)
  const [availableDenominations, setAvailableDenominations] = useState<number[]>([])
  const [currentFeeInfo, setCurrentFeeInfo] = useState<{ fees: number; penalty: number } | null>(
    null,
  )

  const form = useForm<z.infer<typeof RechargeDoiTheSchema>>({
    resolver: zodResolver(RechargeDoiTheSchema),
    defaultValues: {
      telco: '',
      code: '',
      serial: '',
      amount: 0,
    },
  })

  useEffect(() => {
    async function fetchFeeData() {
      try {
        setIsLoading(true)

        const response = await fetch('/api/doithe/fees')
        const data = await response.json()

        if (data.success && data.data) {
          setFeeData(data.data)

          // Get unique telco providers and sort them
          const priorityTelcos = ['VIETTEL', 'MOBIFONE', 'VINAPHONE', 'VIETNAMOBILE', 'GMOBILE']
          const allTelcos = Array.from(new Set(data.data.map((item: any) => item.telco)))

          const sortedTelcos = allTelcos.sort((a: string, b: string) => {
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

          if (sortedTelcos.length > 0) {
            const firstTelco = sortedTelcos[0]
            form.setValue('telco', firstTelco)
            setSelectedTelco(firstTelco)

            // Get denominations for the first telco
            const denominations = data.data
              .filter((item: any) => item.telco === firstTelco)
              .map((item: any) => item.value)

            setAvailableDenominations(denominations)

            if (denominations.length > 0) {
              const firstDenom = denominations[0]
              form.setValue('amount', firstDenom)
              setSelectedDenomination(firstDenom)

              // Set current fee info
              const feeInfo = data.data.find(
                (item: any) => item.telco === firstTelco && item.value === firstDenom,
              )

              if (feeInfo) {
                setCurrentFeeInfo({
                  fees: feeInfo.fees,
                  penalty: feeInfo.penalty,
                })
              }
            }
          }
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

    if (denominations.length > 0) {
      const firstDenom = denominations[0]
      form.setValue('amount', firstDenom)
      setSelectedDenomination(firstDenom)

      // Update fee info
      updateFeeInfo(telco, firstDenom)
    } else {
      form.setValue('amount', 0)
      setSelectedDenomination(0)
      setCurrentFeeInfo(null)
    }
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

  async function onSubmit(values: z.infer<typeof RechargeDoiTheSchema>) {
    try {
      setIsSubmitting(true)
      const res = await rechargeDoiTheAction(values)

      // Handle the response based on the structure returned by doiThe.chargeCardPost
      // The response might have a 'success' property from StandardResponse
      // or it might be a ServerNotification with 'notify' and 'message' properties
      if (res && typeof res === 'object') {
        if ('success' in res && res.success) {
          // Success case from StandardResponse
          const message = 'message' in res ? res.message : 'Thẻ đã được gửi đi, vui lòng đợi xử lý'
          toast.success(message)
          form.reset()
          setSelectedTelco('')
          setSelectedDenomination(0)
          setAvailableDenominations([])
          setCurrentFeeInfo(null)
        } else if ('notify' in res) {
          // Error case from ServerNotification
          toast.error(res.message || 'Có lỗi xảy ra khi nạp thẻ vui lòng kiểm tra lại')
        } else {
          // Generic error case
          toast.error('Có lỗi xảy ra khi nạp thẻ vui lòng kiểm tra lại')
        }
      } else {
        // Fallback error case
        toast.error('Có lỗi xảy ra khi nạp thẻ vui lòng kiểm tra lại')
      }
    } catch {
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
    <AccordionItem className="border rounded-lg p-2" value="item-2">
      <AccordionTrigger>Thẻ cào điện thoại</AccordionTrigger>
      <AccordionContent className="p-2">
        <div className="text-yellow-500">
          Khuyến khích khách hàng nạp thông qua ngân hàng hoặc ví điện tử để tránh triết khấu từ nhà
          mạng
        </div>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="telco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại thẻ</FormLabel>
                    <Select
                      onValueChange={(value) => handleTelcoChange(value)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhà mạng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {uniqueTelcos.map((telco) => (
                          <SelectItem key={telco} value={telco}>
                            {telco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mệnh giá</FormLabel>
                    <Select
                      onValueChange={handleDenominationChange}
                      defaultValue={field.value.toString()}
                      disabled={availableDenominations.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn mệnh giá" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableDenominations.map((amount) => (
                          <SelectItem key={amount} value={amount.toString()}>
                            {amount.toLocaleString('vi-VN')} VND
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentFeeInfo && (
                <div className="text-sm space-y-2 p-3 bg-muted rounded-md">
                  <div className="flex justify-between">
                    <span>Triết khấu từ nhà mạng:</span>
                    <span className="font-medium text-amber-600">{currentFeeInfo.fees}%</span>
                  </div>

                  {selectedDenomination > 0 && (
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
                      <span>Thực nhận (ước tính):</span>
                      <span className="font-medium text-green-600">
                        {Math.round(
                          selectedDenomination * (1 - currentFeeInfo.fees / 100),
                        ).toLocaleString('vi-VN')}{' '}
                        VND
                      </span>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-200 text-red-500 text-xs">
                    <p className="font-medium mb-1">Lưu ý:</p>
                    <p>
                      Nếu nhập sai thông tin thẻ, bạn sẽ bị phạt {currentFeeInfo.penalty}% giá trị
                      thẻ.
                    </p>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số Serial</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nhập số serial thẻ" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã thẻ</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nhập mã thẻ" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-32" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : 'Nạp thẻ'}
              </Button>
            </form>
          </Form>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

function Recharges() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-2">
      <RechargeBank />
      <RechargeCard />
    </Accordion>
  )
}

export function RechargeDialog() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Dialog>
        <DialogTrigger asChild>
          <Button className="rounded-full" variant="ghost" size={'xs'}>
            <CirclePlus />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nạp tiền</DialogTitle>
            <DialogDescription>Chọn phương thức nạp tiền của bạn.</DialogDescription>
          </DialogHeader>
          <Recharges />
        </DialogContent>
      </Dialog>
    </>
  )
}
