import { config } from '@/config'
import { Metadata } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

const siteName = config.NEXT_PUBLIC_SITE_NAME
const serverUrlStr = getServerSideURL()
const domain = serverUrlStr.replace(/^https?:\/\//, '')

const metaText = 'Chính sách bảo mật'
export const metadata: Metadata = {
  title: metaText,
  description: metaText,
  openGraph: {
    title: metaText,
    description: metaText,
  },
}

export default function PrivacyPage() {
  return (
    <>
      <h1 className="mb-6">Chính sách bảo mật</h1>

      <div className="space-y-6">
        <section>
          <h2>1. Mục đích và phạm vi thu thập</h2>
          <p>
            Việc thu thập dữ liệu chủ yếu trên {domain} bao gồm: email, điện thoại, tên đăng nhập,
            mật khẩu đăng nhập. Đây là các thông tin mà {siteName} cần Khách hàng cung cấp bắt buộc
            khi đăng ký sử dụng dịch vụ và {siteName} sử dụng nhằm liên hệ xác nhận khi Khách hàng
            đăng ký sử dụng dịch vụ trên {domain}, đảm bảo quyền lợi cho Khách hàng.
          </p>
          <p>
            Các Khách hàng sẽ tự chịu trách nhiệm về bảo mật và lưu giữ mọi hoạt động sử dụng dịch
            vụ dưới tên đăng ký, mật khẩu và hộp thư điện tử của mình. Ngoài ra, Khách hàng có trách
            nhiệm thông báo kịp thời cho {siteName} về những hành vi sử dụng trái phép, lạm dụng, vi
            phạm bảo mật, lưu giữ tên đăng ký và mật khẩu của bên thứ ba để có biện pháp giải quyết
            phù hợp.
          </p>
        </section>

        <section>
          <h2>2. Phạm vi sử dụng thông tin</h2>
          <p>{siteName} sử dụng thông tin Khách hàng cung cấp để:</p>
          <ul>
            <li>Cung cấp các dịch vụ đến Khách hàng.</li>
            <li>
              Gửi các thông báo về các hoạt động trao đổi thông tin giữa Khách hàng và {siteName}.
            </li>
            <li>
              Ngăn ngừa các hoạt động phá hủy tài khoản người dùng của Khách hàng hoặc các hoạt động
              giả mạo Khách hàng.
            </li>
            <li>Liên lạc và giải quyết với khách hàng trong những trường hợp đặc biệt.</li>
            <li>
              Không sử dụng thông tin cá nhân của Khách hàng ngoài mục đích xác nhận và liên hệ có
              liên quan đến giao dịch tại {siteName}.
            </li>
          </ul>
          <p>
            {siteName} có trách nhiệm hợp tác cung cấp thông tin cá nhân Khách hàng khi có yêu cầu
            từ cơ quan nhà nước có thẩm quyền.
          </p>
        </section>

        <section>
          <h2>3. Thời gian lưu trữ thông tin</h2>
          <p>
            Dữ liệu cá nhân của Khách hàng sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ hoặc tự
            Khách hàng đăng nhập và thực hiện hủy bỏ. Còn lại trong mọi trường hợp thông tin cá nhân
            Khách hàng sẽ được bảo mật trên máy chủ của {siteName}.
          </p>
        </section>

        <section>
          <h2>
            4. Phương tiện và công cụ để Khách hàng tiếp cận, chỉnh sửa và xoá dữ liệu của mình
          </h2>
          <p>
            Khách hàng có quyền tự kiểm tra, cập nhật, điều chỉnh thông tin cá nhân của mình bằng
            cách đăng nhập vào tài khoản chỉnh sửa và xoá thông tin cá nhân hoặc yêu cầu {siteName}{' '}
            thực hiện việc này.
          </p>
          <p>
            Khách hàng có quyền gửi khiếu nại về việc lộ thông tin các nhân cho bên thứ ba đến Ban
            quản trị của {siteName}. Khi tiếp nhận những phản hồi này, {siteName} sẽ xác nhận lại
            thông tin, phải có trách nhiệm trả lời lý do và hướng dẫn Khách hàng khôi phục và bảo
            mật lại thông tin.
          </p>
        </section>

        <section>
          <h2>
            5. Địa chỉ của đơn vị thu thập, quản lý thông tin và hỗ trợ Khách hàng
          </h2>
          <p>{siteName}</p>
          <p>
            Email liên hệ hỗ trợ: hotro@{domain}
          </p>
        </section>

        <section>
          <h2>
            6. Cam kết bảo mật thông tin cá nhân Khách hàng
          </h2>
          <p>
            Thông tin cá nhân của Khách hàng trên {domain} được {siteName} cam kết bảo mật tuyệt đối
            theo chính sách bảo vệ thông tin cá nhân của {siteName}. Việc thu thập và sử dụng thông
            tin của mỗi Khách hàng chỉ được thực hiện khi có sự đồng ý của Khách hàng đó, trừ những
            trường hợp pháp luật có quy định khác. {siteName} cam kết:
          </p>
          <ul>
            <li>
              Không sử dụng, không chuyển giao, cung cấp hay tiết lộ cho bên thứ ba nào về thông tin
              cá nhân của Khách hàng khi không có sự cho phép hoặc đồng ý từ Khách hàng, trừ những
              trường hợp pháp luật có quy định khác.
            </li>
            <li>
              Trong trường hợp máy chủ lưu trữ thông tin bị hacker tấn công dẫn đến mất mát dữ liệu
              cá nhân Khách hàng, {siteName} sẽ có trách nhiệm thông báo vụ việc cho cơ quan chức
              năng điều tra xử lý kịp thời và thông báo cho Khách hàng được biết.
            </li>
            <li>
              Bảo mật tuyệt đối mọi thông tin giao dịch trực tuyến của Khách hàng bao gồm thông tin
              hóa đơn, chứng từ kế toán số hóa tại khu vực dữ liệu trung tâm an toàn của {siteName}.
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
