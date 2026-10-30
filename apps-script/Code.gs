/*
 * Backend của Tiệm Chuyện Nhỏ: nhận bài từ form và ghi vào Google Sheet.
 * Dán toàn bộ file này vào Apps Script gắn với Google Sheet của bạn (README, Bước 1).
 * Sau mỗi lần sửa, nhớ tạo version mới (README, Bước 5) thì thay đổi mới có hiệu lực.
 */

// Bật thông báo email khi có bài mới: đổi false thành true.
var SEND_EMAIL_NOTIFICATION = false;

// Để trống thì gửi về chính tài khoản Google đang chạy script.
// Nên để trống: file này nằm trong repo GitHub công khai, điền email là lộ email.
var NOTIFY_EMAIL = '';

var SHEET_NAME = 'Submissions';
var MIN_STORY_WORDS = 15;
var LOCK_WAIT_MS = 20000;
var TIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';
var TEXT_FORMAT = '@';

var DEFAULT_STATUS = 'Mới';
var STATUS_OPTIONS = ['Mới', 'Đã đọc', 'Chọn vẽ', 'Đã đăng', 'Bỏ qua'];

var HEADERS = [
  'Thời gian', 'Tên gọi', 'Chủ đề', 'Bối cảnh', 'Nhân vật', 'Câu chuyện', 'Khoảnh khắc',
  'Điều nhận ra', 'Cảm xúc', 'Không nên đưa vào', 'Cách ghi tên', 'Liên hệ', 'Trạng thái'
];
var COLUMN_WIDTHS = [140, 120, 120, 180, 180, 420, 240, 240, 120, 200, 140, 160, 100];

// Thứ tự trùng với các cột từ "Tên gọi" đến "Liên hệ". Giới hạn khớp maxlength trong index.html.
var TEXT_FIELDS = [
  { name: 'nickname', maxLength: 100 },
  { name: 'topic', maxLength: 50 },
  { name: 'setting', maxLength: 300 },
  { name: 'characters', maxLength: 300 },
  { name: 'story', maxLength: 20000 },
  { name: 'moment', maxLength: 5000 },
  { name: 'lesson', maxLength: 5000 },
  { name: 'feeling', maxLength: 50 },
  { name: 'avoid', maxLength: 3000 },
  { name: 'credit', maxLength: 50 },
  { name: 'contact', maxLength: 200 }
];

var CONSENT_FIELDS = ['consentOwn', 'consentAdapt', 'consentSelection'];

function doGet() {
  return jsonOutput_({ ok: true });
}

function doPost(e) {
  try {
    var data = parseBody_(e);
    if (!data) {
      return respond_(false, 'Dữ liệu gửi lên không hợp lệ. Bạn thử gửi lại nhé.');
    }

    // Bot điền vào ô bẫy: trả ok để nó không thử lại, nhưng không ghi gì cả
    if (data.website) {
      return respond_(true);
    }

    var submission = cleanSubmission_(data);
    var error = validateSubmission_(submission, data);
    if (error) {
      return respond_(false, error);
    }

    if (!appendSubmission_(submission)) {
      return respond_(false, 'Tiệm đang đông khách quá. Bạn đợi một lát rồi gửi lại nhé.');
    }

    notifyOwner_(submission);
    return respond_(true);
  } catch (err) {
    console.error(err);
    return respond_(false, 'Tiệm gặp trục trặc nhỏ. Bạn thử gửi lại sau ít phút nhé.');
  }
}

// Chạy tay một lần trong trình soạn thảo để cấp quyền và tạo sẵn sheet.
function setup() {
  getSheet_();
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return null;
  }
  try {
    var data = JSON.parse(e.postData.contents);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch (err) {
    return null;
  }
}

function cleanText_(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function cleanSubmission_(data) {
  var submission = {};
  TEXT_FIELDS.forEach(function (field) {
    submission[field.name] = cleanText_(data[field.name], field.maxLength);
  });
  return submission;
}

function validateSubmission_(submission, data) {
  if (!submission.topic) {
    return 'Bạn chọn giúp Tiệm một chủ đề nhé.';
  }
  if (countWords_(submission.story) < MIN_STORY_WORDS) {
    return 'Câu chuyện hơi ngắn, bạn kể thêm ít nhất ' + MIN_STORY_WORDS + ' chữ nhé.';
  }
  var allConsented = CONSENT_FIELDS.every(function (name) {
    return data[name] === true;
  });
  if (!allConsented) {
    return 'Bạn tick đủ cả 3 ô xác nhận giúp Tiệm nhé.';
  }
  return '';
}

function countWords_(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

// Sheet coi giá trị bắt đầu bằng = + - @ là công thức, nên thêm ' để giữ nguyên thành chữ
function escapeFormula_(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function appendSubmission_(submission) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    return false;
  }
  try {
    var sheet = getSheet_();
    var row = sheet.getLastRow() + 1;
    if (row > sheet.getMaxRows()) {
      sheet.insertRowAfter(sheet.getMaxRows());
    }

    var values = TEXT_FIELDS.map(function (field) {
      return escapeFormula_(submission[field.name]);
    });
    sheet.getRange(row, 1).setNumberFormat(TIME_FORMAT).setValue(new Date());
    // Định dạng chữ trước khi ghi, nếu không "0912345678" sẽ mất số 0 và "10/12" thành ngày tháng
    sheet.getRange(row, 2, 1, values.length).setNumberFormat(TEXT_FORMAT).setValues([values]);
    sheet.getRange(row, HEADERS.length).setDataValidation(statusRule_()).setValue(DEFAULT_STATUS);
    sheet.getRange(row, 1, 1, HEADERS.length).setVerticalAlignment('top').setWrap(true);

    // Phải ghi xong trước khi nhả khoá, nếu không người gửi kế tiếp có thể ghi đè cùng dòng
    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}

function getSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    setupHeader_(sheet);
  }
  return sheet;
}

function setupHeader_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  COLUMN_WIDTHS.forEach(function (width, index) {
    sheet.setColumnWidth(index + 1, width);
  });
}

function statusRule_() {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
}

// Email lỗi (VD hết hạn mức trong ngày) không được làm hỏng việc nhận bài
function notifyOwner_(submission) {
  if (!SEND_EMAIL_NOTIFICATION) {
    return;
  }
  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL || Session.getEffectiveUser().getEmail(),
      subject: '[Tiệm Chuyện Nhỏ] Có chuyện mới: ' + submission.topic.replace(/\s+/g, ' '),
      body: [
        'Tên gọi: ' + (submission.nickname || '(ẩn danh)'),
        'Chủ đề: ' + submission.topic,
        '',
        submission.story,
        '',
        'Xem đầy đủ: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      ].join('\n')
    });
  } catch (err) {
    console.error(err);
  }
}

function respond_(ok, error) {
  return jsonOutput_({ ok: ok, error: error || null });
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
