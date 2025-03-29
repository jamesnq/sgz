import { env } from '@/config'

export const workingTime = (
  <div className="text-highlight w-full">
    Xử lý đơn hàng: <span className="text-green-400">8h sáng</span> -{' '}
    <span className="text-red-500">11h đêm</span> hằng ngày.
    <p className="text-xs">
      Cần hỗ trợ? Liên hệ qua chat góc phải dưới màn hình hoặc các kênh cộng đồng của{' '}
      {env.NEXT_PUBLIC_SITE_NAME}.
    </p>
  </div>
)

export const thankYouMessage = (
  <div className="text-center">
    <p className="font-semibold">
      Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của{' '}
      <span className="font-bold text-highlight">{env.NEXT_PUBLIC_SITE_NAME}</span>{' '}
      <span className="text-red-500">❤</span>
    </p>
    <p className="text-sm mt-2">Chúng tôi luôn nỗ lực để mang đến trải nghiệm tốt nhất cho bạn.</p>
  </div>
)
