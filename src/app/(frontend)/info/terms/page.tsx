import { env } from '@/config'

const siteName = env.NEXT_PUBLIC_SITE_NAME
const domain = typeof window !== 'undefined' ? window.location.hostname : siteName
export default async function TermsPage() {
  return (
    <div className="text-xs">
      <h1 className="text-2xl font-bold mb-6">Điều khoản dịch vụ {siteName}</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold ">1. Giới thiệu</h2>
          <p>Chào mừng quý khách hàng đến với {domain}.</p>
          <p>
            Khi quý khách hàng truy cập và sử dụng dịch vụ trên trang website của chúng tôi nghĩa là
            quý khách đồng ý với các điều khoản này. Trang web có quyền thay đổi, chỉnh sửa, thêm
            hoặc lược bỏ bất kỳ phần nào trong Điều khoản mua bán này, vào bất cứ lúc nào. Các thay
            đổi có hiệu lực ngay khi được đăng trên trang web mà không cần thông báo trước. Và khi
            quý khách tiếp tục sử dụng trang web, sau khi các thay đổi về Điều khoản này được đăng
            tải, có nghĩa là quý khách chấp nhận với những thay đổi đó.
          </p>
          <p>
            Quý khách hàng vui lòng kiểm tra thường xuyên để cập nhật những thay đổi của chúng tôi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold ">2. Hướng dẫn sử dụng website</h2>
          <p>
            Khi vào web của chúng tôi, khách hàng phải đảm bảo đủ 18 tuổi, hoặc truy cập dưới sự
            giám sát của cha mẹ hay người giám hộ hợp pháp. Khách hàng đảm bảo có đầy đủ hành vi dân
            sự để thực hiện các giao dịch mua bán hàng hóa theo quy định hiện hành của pháp luật
            Việt Nam.
          </p>
          <p>
            Chúng tôi sẽ cấp một tài khoản (Account) sử dụng để khách hàng có thể mua sắm trên
            website {siteName} trong khuôn khổ Điều khoản và Điều kiện sử dụng đã đề ra.
          </p>
          <p>
            Quý khách hàng sẽ phải đăng ký tài khoản với thông tin xác thực về bản thân và phải cập
            nhật nếu có bất kỳ thay đổi nào. Mỗi người truy cập phải có trách nhiệm với mật khẩu,
            tài khoản và hoạt động của mình trên web. Hơn nữa, quý khách hàng phải thông báo cho
            chúng tôi biết khi tài khoản bị truy cập trái phép. Chúng tôi không chịu bất kỳ trách
            nhiệm nào, dù trực tiếp hay gián tiếp, đối với những thiệt hại hoặc mất mát gây ra do
            quý khách không tuân thủ quy định hoặc bất cứ lý do cá nhân nào.
          </p>
          <p>
            Nghiêm cấm sử dụng bất kỳ phần nào của trang web này với mục đích thương mại hoặc nhân
            danh bất kỳ đối tác thứ ba nào nếu không được chúng tôi cho phép bằng văn bản. Nếu vi
            phạm bất cứ điều nào trong đây, chúng tôi sẽ hủy tài khoản của khách mà không cần báo
            trước, số dư trong tài khoản cũng sẽ được niêm phong vĩnh viễn.
          </p>
          <p>
            Trong suốt quá trình đăng ký, quý khách đồng ý nhận email quảng cáo và thông báo thông
            tin đơn hàng từ website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold ">4. Chấp nhận đơn hàng và giá cả</h2>
          <p>
            Chúng tôi có quyền từ chối hoặc hủy đơn hàng của quý khách vì bất kỳ lý do gì liên quan
            đến lỗi kỹ thuật, hệ thống một cách khách quan vào bất kỳ lúc nào.
          </p>
          <p>
            Ngoài ra, để đảm bảo tính công bằng cho khách hàng là người tiêu dùng cuối cùng của{' '}
            {siteName}, chúng tôi cũng sẽ từ chối các đơn hàng không nhằm mục đích sử dụng cho cá
            nhân, mua hàng số lượng nhiều hoặc với mục đích mua đi bán lại mà không nằm trong phạm
            vi được Sub Game Zone Shop cho phép hoặc cấp phép.
          </p>
          <p>
            Chúng tôi cam kết sẽ cung cấp thông tin giá cả chính xác nhất cho người tiêu dùng. Tuy
            nhiên, đôi lúc vẫn có sai sót xảy ra, ví dụ như trường hợp giá sản phẩm không hiển thị
            chính xác trên trang web hoặc sai giá, tùy theo từng trường hợp chúng tôi sẽ liên hệ
            hướng dẫn hoặc thông báo hủy đơn hàng đó cho quý khách. Chúng tôi cũng có quyền từ chối
            hoặc hủy bỏ bất kỳ đơn hàng nào dù đơn hàng đó đã hay chưa được xác nhận hoặc đã thanh
            toán.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold ">
            5. Giải quyết hậu quả do lỗi nhập sai thông tin tại {siteName}
          </h2>
          <p>
            Khách hàng có trách nhiệm cung cấp thông tin đầy đủ và chính xác khi tham gia giao dịch
            tại {siteName}. Trong trường hợp khách hàng nhập sai thông tin và gửi vào trang{' '}
            {siteName}, {siteName} có quyền từ chối thực hiện giao dịch.
          </p>
          <p>
            Trong trường hợp sai thông tin phát sinh từ phía {siteName} mà {siteName} có thể chứng
            minh đó là lỗi của hệ thống hoặc từ bên thứ ba (sai giá sản phẩm, sai xuất xứ, …),{' '}
            {siteName} sẽ đền bù cho khách hàng một mã giảm giá cho các lần mua sắm tiếp theo với
            mệnh giá tùy từng trường hợp cụ thể và có quyền không thực hiện giao dịch bị lỗi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold ">6. Quyền pháp lý</h2>
          <p>
            Các điều kiện, điều khoản và nội dung của trang web này được điều chỉnh từ luật pháp
            Việt Nam và Tòa án có thẩm quyền tại Việt Nam sẽ giải quyết bất kỳ tranh chấp nào phát
            sinh từ việc sử dụng trái phép trang web này.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold ">7. Quy định về bảo mật</h2>
          <p>
            Trang web của chúng tôi coi trọng việc bảo mật thông tin và sử dụng các biện pháp tốt
            nhất bảo vệ thông tin và việc thanh toán của quý khách. Thông tin của quý khách trong
            quá trình thanh toán sẽ được mã hóa để đảm bảo an toàn. Sau khi quý khách hoàn thành quá
            trình đặt hàng, quý khách sẽ thoát khỏi chế độ an toàn.
          </p>
          <p>
            Quý khách không được sử dụng bất kỳ chương trình, công cụ hay hình thức nào khác để can
            thiệp vào hệ thống hay làm thay đổi cấu trúc dữ liệu. Trang web cũng nghiêm cấm việc
            phát tán, truyền bá hay cổ vũ cho bất kỳ hoạt động nào nhằm can thiệp, phá hoại hay xâm
            nhập vào dữ liệu của hệ thống. Cá nhân hay tổ chức vi phạm sẽ bị tước bỏ mọi quyền lợi
            cũng như sẽ bị truy tố trước pháp luật nếu cần thiết.
          </p>
          <p>
            Mọi thông tin giao dịch sẽ được bảo mật ngoại trừ trong trường hợp cơ quan pháp luật yêu
            cầu.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold ">8. Đảm bảo an toàn giao dịch tại {siteName}</h2>
          <p>
            Chúng tôi sử dụng các dịch vụ để bảo vệ thông tin về nội dung mà người bán đăng sản phẩm
            trên {siteName}. Để đảm bảo các giao dịch được tiến hành thành công, hạn chế tối đa rủi
            ro có thể phát sinh.
          </p>
        </section>
      </div>
    </div>
  )
}
