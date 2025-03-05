'use client'

import { rechargePayosAction } from '@/app/_actions/rechargeAction'
import { RechargePayosSchema } from '@/app/_actions/schema'
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
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { CirclePlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

function RechargeBank() {
  const form = useForm<z.infer<typeof RechargePayosSchema>>({
    resolver: zodResolver(RechargePayosSchema),
    defaultValues: {
      amount: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof RechargePayosSchema>) {
    const res = await rechargePayosAction(values)
    if (!res?.data) return
    window.open(res.data?.checkoutUrl, '_blank')
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

function Recharges() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
      <RechargeBank></RechargeBank>
    </Accordion>
  )
}

export function RechargeDialog() {
  return (
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
        <Recharges></Recharges>
      </DialogContent>
    </Dialog>
  )
}
