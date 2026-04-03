# Hostech API Standard

Tài liệu này quy định cấu trúc JSON phản hồi đồng nhất cho toàn bộ hệ thống Hostech. Tất cả các Frontend và AI Agent phải tuân thủ nghiêm ngặt các quy tắc này.

## 1. Cấu trúc Success (Thành công)

Mọi phản hồi thành công phải được bao bọc (wrap) trong key `data`.

### Single Resource (Bản ghi đơn)
```json
{
  "data": {
    "id": "uuid",
    "name": "Object Name",
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601"
  }
}
```

### Collection & Pagination (Danh sách & Phân trang)
Sử dụng chuẩn phân trang của Laravel Resource.

```json
{
  "data": [
    { "id": "uuid", "name": "..." },
    { "id": "uuid", "name": "..." }
  ],
  "links": {
    "first": ".../api/v1/rooms?page=1",
    "last": ".../api/v1/rooms?page=10",
    "prev": null,
    "next": ".../api/v1/rooms?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "path": ".../api/v1/rooms",
    "per_page": 15,
    "to": 15,
    "total": 150
  }
}
```

## 2. Cấu trúc Error (Lỗi)

Khi xảy ra lỗi, API sẽ trả về HTTP Status code phù hợp (4xx, 5xx) và JSON body như sau:

### Lỗi Validation (422 Unprocessable Entity)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": [
      "The name field is required."
    ],
    "phone": [
      "The phone format is invalid."
    ]
  }
}
```

### Lỗi Hệ thống/Logic (403, 404, 500)
```json
{
  "message": "Mô tả lỗi chi tiết cho frontend hiển thị.",
  "code": "ERROR_CODE_SLUG",
  "trace": [] // Chỉ xuất hiện trong môi trường local/debug
}
```

## 3. Quy chuẩn Naming
- **Key JSON**: Sử dụng `snake_case` (theo tiêu chuẩn mặc định của Eloquent Reources trong dự án này).
- **Date/Time**: Luôn sử dụng ISO-8601 (e.g., `2024-03-20T10:00:00Z`).
- **Boolean**: Luôn là `true`/`false` hoặc `1`/`0` đồng nhất.

## 4. Relation Handling
Sử dụng `$this->whenLoaded()` trong Laravel Resource để tránh trả về dữ liệu dư thừa. Frontend phải yêu cầu relation qua query params `include=relation_name`.
