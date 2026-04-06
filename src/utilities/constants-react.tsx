import { config } from '@/config'
import { Zap, Clock, Heart } from 'lucide-react'

export const instantDelivery = (
  <div className="bg-green-500/10 text-green-500 border border-green-500/20 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
    <Zap className="h-4 w-4 shrink-0 fill-current" />
    Nhận sản phẩm ngay lập tức sau khi thanh toán (Instant delivery)
  </div>
)

export const workingTime = (
  <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
    <Clock className="h-4 w-4 shrink-0" />
    <span>
      Xử lý đơn hàng từ <span className="font-bold">8h sáng</span> đến <span className="font-bold">11h đêm</span> hằng ngày
    </span>
  </div>
)

export const thankYouMessage = (
  <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-medium px-4 py-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
    <div className="flex items-center gap-2">
      <Heart className="h-5 w-5 shrink-0 fill-current text-rose-500" />
      <span>
        Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của <span className="font-bold">{config.NEXT_PUBLIC_SITE_NAME}</span>
      </span>
    </div>
    <span className="text-xs text-rose-400/80">Chúng tôi luôn nỗ lực để mang đến trải nghiệm tốt nhất cho bạn.</span>
  </div>
)
