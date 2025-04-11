# Phần mềm SCADA CGP

## Mô tả
Hệ thống SCADA CGP (KHÔNG BAO GỒM DỮ LIỆU) là hệ thống phần mềm dạng dịch vụ (SaaS) giúp người dùng điều khiển giám sát tình trạng thiết bị giao thông (đèn chiếu sáng, đèn giao thông, tủ điều khiển,...) từ xa theo thời gian thực, thông qua ứng dụng website.

## Cấu trúc
- src/components/: Chứa phụ kiện (DeviceDetail.tsx, DeviceMap.tsx)
- src/pages/: Chứa trang (HomePage.tsx, AlertPage.tsx)
- src/hooks/: Chứa logic (use-toast.ts)
- src/lib/api.ts: Các hàm để gọi API từ server

## Hướng dẫn
- Cài đặt: bun run install
- Chạy: 
 1. Chạy lệnh: `bun run build`
 2. Chạy lệnh: `bun run preview`
 3. Mở trình duyệt và mở đường dẫn `localhost:8080`. 
 
 *Lưu ý: phần mềm yêu cầu kết nối với hệ thống máy chủ API để hoạt động. Vì lí do bảo mật, hệ thống máy chủ API sẽ không được cung cấp*