# Thao tác đơn hàng từ Discord

Thông báo mới và thông báo khách cập nhật sẽ có ba nút: yêu cầu thông tin, hoàn thành (có xác nhận), gửi lời nhắn. Lời nhắn thay thế trường `message` giống thao tác Save trong workspace; không gửi Discord DM. Các thông báo cũ không tự được thêm nút.

## Cấu hình

Tạo ứng dụng và bot trong Discord Developer Portal, mời bot vào server với quyền View Channel, Send Messages, Embed Links tại kênh nhân viên. Không cần Message Content Intent.

Thêm các biến môi trường sau (không commit token):

```dotenv
DISCORD_BOT_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_GUILD_ID=
DISCORD_STAFF_CHANNEL_ID=
# JSON: Discord user ID -> ID tài khoản website, giá trị là số
DISCORD_STAFF_USER_MAP={"123456789012345678":42}
```

Giữ cấu hình `DISCORD_STAFF_ROLE_ID`, `DISCORD_ADMIN_ROLE_ID` và các webhook hiện có. Tài khoản được ánh xạ phải có role `staff` hoặc `admin` trên website. Người thao tác còn phải có role nhân viên/admin Discord, đúng server và đúng kênh đã cấu hình. Các thay đổi được ghi nhận bằng tài khoản website tương ứng trong handlers.

Triển khai rồi đặt **Interactions Endpoint URL** trong Developer Portal thành `https://<domain>/api/discord/interactions`. Endpoint kiểm tra chữ ký Ed25519 và trả lời PING. Khi đủ cấu hình, thông báo đơn được gửi bằng bot để hỗ trợ nút tương tác; khi chưa cấu hình, webhook cũ vẫn hoạt động.

## Kiểm tra sau triển khai

1. Tạo đơn thử: kiểm tra embed và ba nút.
2. Yêu cầu một trường: website phải hiện trường đang chờ khách bổ sung và trạng thái USER_UPDATE.
3. Khách bổ sung: chỉ có một thông báo chứa các trường thay đổi. Lưu lại không thay đổi không gửi thông báo.
4. Gửi lời nhắn: kiểm tra trường Message và trang chi tiết đơn của khách.
5. Hoàn thành: xác nhận rồi kiểm tra trạng thái, handlers và các xử lý hoàn thành hiện có.
6. Tài khoản không ánh xạ/không có role phải bị từ chối; đơn hoàn thành/hoàn tiền không được thay đổi.

Tài liệu giao thức: https://docs.discord.com/developers/interactions/receiving-and-responding
