/*
 * CẤU HÌNH CỦA TIỆM
 * Đây là file duy nhất bạn cần sửa để web chạy (xem README.md).
 * Chỉ sửa phần nằm trong dấu nháy "...", giữ nguyên tên bên trái.
 *
 * Lưu ý: file này công khai trên mạng, ai cũng đọc được.
 * Số tài khoản nhận donate thì không sao, nhưng đừng để mật khẩu hay thông tin riêng tư ở đây.
 */
window.TIEM_CONFIG = {
  // URL Web App của Google Apps Script, kết thúc bằng /exec (README, Bước 2).
  // Để trống thì form không gửi được và sẽ báo lỗi.
  SCRIPT_URL: "",

  // Mã ngân hàng theo VietQR, không phân biệt hoa thường.
  // VD: "vietcombank", "mbbank", "techcombank", "acb", "tpbank", hoặc số BIN như "970436".
  // Danh sách đầy đủ: https://api.vietqr.io/v2/banks (dùng "shortName", "code" hoặc "bin").
  // Để trống BANK_ID hoặc ACCOUNT_NO thì phần QR ngân hàng sẽ tự ẩn.
  BANK_ID: "",

  // Tên ngân hàng hiện cho người xem đọc, VD: "Vietcombank".
  // Tuỳ chọn: để trống thì Tiệm hiện BANK_ID thay thế.
  BANK_NAME: "",

  // Số tài khoản nhận donate, chỉ gồm chữ số.
  ACCOUNT_NO: "",

  // Tên chủ tài khoản: VIẾT HOA, KHÔNG DẤU, đúng như trên thẻ. VD: "NGUYEN VAN A".
  ACCOUNT_NAME: "",

  // Nội dung chuyển khoản điền sẵn: không dấu, tối đa khoảng 25 ký tự.
  TRANSFER_NOTE: "Ung ho Tiem Chuyen Nho",

  // Tuỳ chọn: đường dẫn ảnh QR MoMo tĩnh. Để trống thì không hiện.
  // VD: "assets/momo-qr.png" (nhớ bỏ ảnh vào thư mục assets).
  MOMO_QR_IMAGE: "",

  // Link kênh TikTok, VD: "https://www.tiktok.com/@tiemchuyennho".
  // Để trống thì nút "Ghé kênh TikTok" sẽ tự ẩn.
  TIKTOK_URL: "",
};
