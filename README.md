# Tiệm Chuyện Nhỏ: trang nhận chuyện từ người xem

Trang web nhỏ để người xem TikTok gửi câu chuyện thật. Bài gửi được ghi vào Google Sheet, sau đó người xem có thể donate tuỳ tâm qua QR.

- **Giao diện:** HTML, CSS, JavaScript thuần, chạy trên GitHub Pages (miễn phí).
- **Lưu dữ liệu:** Google Apps Script ghi vào Google Sheet của bạn (miễn phí).

Toàn bộ quá trình mất khoảng 20 phút. Bạn cần một tài khoản Google và một tài khoản GitHub, không cần biết lập trình.

```
tiem-chuyen-nho/
├── index.html            Trang web
├── css/style.css         Giao diện
├── js/config.js          Cấu hình của bạn (file cần sửa)
├── js/app.js             Logic của form
├── apps-script/Code.gs   Code dán vào Apps Script
├── assets/               Favicon, ảnh preview khi chia sẻ link
└── README.md             File này
```

Các khung **🖼️ Màn hình** bên dưới mô tả bằng lời những gì bạn sẽ thấy, để bạn biết mình đang đi đúng hướng.

---

## Bước 1: Tạo Google Sheet và dán Code.gs

1. Vào [sheets.new](https://sheets.new) để tạo một bảng tính mới. Đặt tên, ví dụ `Tiệm Chuyện Nhỏ - Bài gửi`.
2. Trên thanh menu, chọn **Tiện ích mở rộng (Extensions) → Apps Script**. Một tab mới sẽ mở ra.

   > 🖼️ **Màn hình:** trình soạn thảo code nền trắng. Cột bên trái có file `Code.gs`, phần giữa có sẵn vài dòng `function myFunction() { }`.

3. Xoá hết code có sẵn trong `Code.gs`.
4. Mở file [apps-script/Code.gs](apps-script/Code.gs) trong project này, copy toàn bộ rồi dán vào.
5. Bấm biểu tượng 💾 **Save** (hoặc `Ctrl + S`).
6. Tạo sheet và cấp quyền: ở thanh công cụ phía trên, tại ô chọn hàm, chọn **`setup`** rồi bấm **▶ Run**.

   > 🖼️ **Màn hình:** hiện hộp thoại **Authorization required**. Bấm **Review permissions** rồi chọn tài khoản Google của bạn.
   >
   > Tiếp theo có thể hiện cảnh báo lớn **"Google hasn't verified this app"**. Đây là chuyện bình thường, vì script do chính bạn tạo chứ chưa qua kiểm duyệt của Google. Bấm **Advanced** ở góc dưới bên trái, chọn **Go to … (unsafe)**, rồi bấm **Allow**.

7. Quay lại tab Google Sheet. Bạn sẽ thấy một sheet mới tên **Submissions** với dòng tiêu đề in đậm: `Thời gian | Tên gọi | Chủ đề | ...`.

### Bật email báo có bài mới (tuỳ chọn)

Ở đầu `Code.gs`, đổi:

```js
var SEND_EMAIL_NOTIFICATION = true;
```

Email sẽ gửi về chính tài khoản Google của bạn. Nên để trống `NOTIFY_EMAIL`, vì nếu điền thì email của bạn sẽ lộ trong repo GitHub công khai. Nếu đổi sau khi đã deploy, nhớ làm theo [Bước 5](#bước-5-cập-nhật-apps-script-mà-không-đổi-url).

---

## Bước 2: Deploy Web App và lấy URL /exec

1. Trong trang Apps Script, bấm nút xanh **Deploy** ở góc trên bên phải, chọn **New deployment**.
2. Bấm biểu tượng ⚙️ cạnh chữ *Select type*, chọn **Web app**.
3. Điền như sau:

   | Mục | Chọn |
   |---|---|
   | Description | `Ban dau` (ghi gì cũng được) |
   | Execute as | **Me** |
   | Who has access | **Anyone** |

   > ⚠️ Phải chọn đúng **Anyone**, không phải *Anyone with Google account*. Nếu chọn sai, người xem sẽ không gửi được bài.

4. Bấm **Deploy**. Nếu được hỏi cấp quyền, làm như mục 6 ở Bước 1.

   > 🖼️ **Màn hình:** hộp thoại **Deployment successfully created**, có một dòng **Web app URL** kèm nút Copy.

5. Copy URL đó. URL có dạng:

   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

6. **Kiểm tra:** mở URL trong tab ẩn danh. Nếu thấy dòng dưới đây thì backend đã chạy:

   ```json
   {"ok":true}
   ```

---

## Bước 3: Điền config.js

Mở [js/config.js](js/config.js) và điền vào các dấu nháy:

| Tên | Điền gì | Ví dụ |
|---|---|---|
| `SCRIPT_URL` | URL `/exec` ở Bước 2 | `https://script.google.com/macros/s/AKfycb.../exec` |
| `BANK_ID` | Mã ngân hàng | `vietcombank`, `mbbank`, `970436` |
| `BANK_NAME` | Tên ngân hàng để hiển thị (tuỳ chọn) | `Vietcombank` |
| `ACCOUNT_NO` | Số tài khoản, chỉ gồm chữ số | `0123456789` |
| `ACCOUNT_NAME` | Tên chủ tài khoản, VIẾT HOA KHÔNG DẤU | `NGUYEN VAN A` |
| `TRANSFER_NOTE` | Nội dung chuyển khoản, không dấu, ngắn | `Ung ho Tiem Chuyen Nho` |
| `MOMO_QR_IMAGE` | Đường dẫn ảnh QR MoMo (tuỳ chọn) | `assets/momo-qr.png` |
| `TIKTOK_URL` | Link kênh TikTok | `https://www.tiktok.com/@tiemchuyennho` |

Danh sách mã ngân hàng: [api.vietqr.io/v2/banks](https://api.vietqr.io/v2/banks) (dùng `shortName`, `code` hoặc `bin`).

Mục nào để trống thì phần đó tự ẩn: không có ngân hàng thì ẩn QR, không có MoMo thì ẩn MoMo, không có TikTok thì ẩn nút TikTok. Riêng `SCRIPT_URL` bắt buộc phải có.

**Xem thử:** mở `index.html` bằng trình duyệt để xem giao diện. Muốn thử gửi bài thật thì nên đợi lên GitHub Pages ở Bước 4.

---

## Bước 4: Đẩy lên GitHub và bật GitHub Pages

### 4.1. Tạo repo

1. Đăng nhập [github.com](https://github.com), bấm dấu **+** ở góc trên bên phải, chọn **New repository**.
2. **Repository name:** `tiem-chuyen-nho`. Chọn **Public**, rồi bấm **Create repository**.

### 4.2. Tải code lên

**Cách dễ (không cần cài gì):**

1. Trong trang repo vừa tạo, bấm liên kết **uploading an existing file**.
2. Mở thư mục `tiem-chuyen-nho` trên máy, chọn **tất cả bên trong** rồi kéo thả vào trang web.

   > ⚠️ Kéo các file và thư mục **bên trong**, đừng kéo cả thư mục `tiem-chuyen-nho`. `index.html` phải nằm ngay ở ngoài cùng của repo.

3. Bấm **Commit changes**.

**Cách dùng Git:**

```bash
cd tiem-chuyen-nho
git init
git add .
git commit -m "Mở Tiệm"
git branch -M main
git remote add origin https://github.com/USERNAME/tiem-chuyen-nho.git
git push -u origin main
```

### 4.3. Bật GitHub Pages

1. Trong repo, vào **Settings → Pages** (mục Pages ở cột bên trái).
2. Tại **Build and deployment → Source**, chọn **Deploy from a branch**.
3. Tại **Branch**, chọn **main** và thư mục **/ (root)**, rồi bấm **Save**.
4. Đợi 1 đến 2 phút rồi tải lại trang.

   > 🖼️ **Màn hình:** phía trên hiện dòng **Your site is live at** `https://USERNAME.github.io/tiem-chuyen-nho/`.

### 4.4. Sửa link preview

Mở `index.html`, tìm 2 dòng có chữ `USERNAME` ở phần `og:url` và `og:image`, thay bằng tên GitHub của bạn:

```html
<meta property="og:url" content="https://tenban.github.io/tiem-chuyen-nho/">
<meta property="og:image" content="https://tenban.github.io/tiem-chuyen-nho/assets/og-image.png">
```

Lưu rồi đưa lên GitHub. Nếu không sửa, link chia sẻ sẽ không hiện ảnh preview. Dùng [opengraph.xyz](https://www.opengraph.xyz) để kiểm tra.

---

## Bước 5: Cập nhật Apps Script mà không đổi URL

Khi sửa `Code.gs`, bấm Save thôi **chưa có tác dụng**. Web App vẫn chạy phiên bản cũ cho đến khi bạn tạo version mới:

1. Bấm **Deploy → Manage deployments**.
2. Chọn deployment đang dùng, bấm biểu tượng ✏️ **Edit**.
3. Tại ô **Version**, chọn **New version**.
4. Bấm **Deploy**.

URL giữ nguyên nên không phải sửa `config.js`.

> ⚠️ Đừng dùng **New deployment** để cập nhật, vì cách đó tạo ra URL khác và web vẫn gửi về URL cũ.

---

## Bước 6: Xử lý lỗi thường gặp

### Bấm gửi nhưng báo "Tiệm chưa nhận được chuyện"

Mở trang trên máy tính, nhấn `F12` và xem tab **Console**.

| Thấy gì | Nguyên nhân | Cách sửa |
|---|---|---|
| `blocked by CORS policy` | Hầu hết trường hợp là deploy sai quyền, hoặc script đang lỗi. Hiếm khi là lỗi CORS thật | Kiểm tra **Who has access** là **Anyone**, và mở URL `/exec` trong tab ẩn danh phải thấy `{"ok":true}` |
| `404` | `SCRIPT_URL` sai, hoặc deployment đã bị xoá | Copy lại URL trong **Deploy → Manage deployments** |
| `Chưa điền SCRIPT_URL` | Chưa điền `config.js`, hoặc chưa đưa bản mới lên GitHub | Điền rồi đưa lên lại |

> Đừng thêm header `Content-Type` vào `fetch`. Trình duyệt sẽ gửi request OPTIONS trước, mà Apps Script không trả lời được, và bạn sẽ gặp lỗi CORS thật.

### Mở URL /exec thấy trang đăng nhập Google hoặc "You need access"

Đang chọn sai **Who has access**. Vào **Manage deployments → Edit**, đổi thành **Anyone**, chọn **New version** rồi **Deploy**.

### Báo lỗi quyền, hoặc "Authorization is required"

Bạn chưa cấp quyền, hoặc code vừa thêm tính năng cần quyền mới. Làm lại mục 6 của Bước 1, sau đó tạo version mới theo Bước 5.

### Đã sửa Code.gs mà không thấy thay đổi

Quên tạo version mới. Làm theo [Bước 5](#bước-5-cập-nhật-apps-script-mà-không-đổi-url).

### Đã sửa config.js mà web vẫn như cũ

GitHub Pages và trình duyệt lưu đệm vài phút. Đợi một lúc, rồi mở lại trong tab ẩn danh để kiểm tra.

### Trang web báo 404

Kiểm tra `index.html` có nằm ngay ngoài cùng repo không, chứ không nằm trong một thư mục con.

### Mở Sheet không thấy bài mới

- Kiểm tra sheet có đúng tên `Submissions` không. Đổi tên thì script sẽ tạo một sheet mới cùng tên cũ.
- Script phải được tạo từ menu **Tiện ích mở rộng** của chính bảng tính đó (Bước 1), không phải tạo riêng ở script.google.com.

### Giờ trong cột Thời gian bị lệch

Trong Google Sheet, vào **Tệp → Cài đặt**, đặt **Múi giờ** thành `(GMT+07:00) Bangkok/Hanoi`.

### QR không hiện

Kiểm tra `BANK_ID` và `ACCOUNT_NO` trong `config.js`. Nếu dịch vụ VietQR gặp sự cố, trang sẽ tự báo và người xem vẫn chuyển khoản được bằng thông tin dạng chữ bên dưới.

---

## Quản lý bài gửi

Mỗi bài là một dòng trong sheet `Submissions`. Cột **Trạng thái** có dropdown: `Mới`, `Đã đọc`, `Chọn vẽ`, `Đã đăng`, `Bỏ qua`.

Một vài lưu ý:

- **Đừng chia sẻ Sheet công khai.** Trong đó có liên hệ của người gửi và những câu chuyện riêng tư.
- **Thỉnh thoảng bạn sẽ thấy dấu `'` ở đầu nội dung.** Tiệm thêm dấu này khi nội dung bắt đầu bằng `= + - @` để Sheet không hiểu nhầm là công thức. Lời thoại bắt đầu bằng gạch đầu dòng cũng sẽ như vậy.
- **Link `/exec` là công khai.** Honeypot chặn được bot đơn giản, nhưng không chặn được ai cố tình gửi rác. Nếu bị spam, vào **Manage deployments → Archive** để tạm đóng.
