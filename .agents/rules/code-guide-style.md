---
trigger: always_on
glob: "**/*"
description: Quy tắc viết lệnh PowerShell nghiêm ngặt cho Windows.
---

# Strict PowerShell Execution Rules

When writing or executing commands in the terminal for Windows environments, you MUST follow these rules:

1. **NO Command Chaining with `&&`**: PowerShell (especially 5.1) does not natively support `&&`.
   - ❌ `command1 && command2`
   - ✅ `command1; if ($?) { command2 }` (chạy lệnh 2 nếu lệnh 1 thành công)
   - ✅ `command1; command2` (chạy tuần tự)

2. **NO `start /b`**: Trong PowerShell, `start` là alias của `Start-Service`.
   - ❌ `start /b command`
   - ✅ `Start-Process -FilePath "cmd" -ArgumentList "/c command" -NoNewWindow`
   - ✅ Chạy trực tiếp nếu không cần chạy ngầm thực sự.

3. **NO CMD Path/Flags Syntax**: Không dùng các switch kiểu CMD (ví dụ: `/s`, `/b`, `/y`) với lệnh PowerShell.
   - ❌ `dir /s /b`
   - ✅ `Get-ChildItem -Recurse`

4. **Sử dụng Dấu ngoặc và Tham số vị trí**:
   - Luôn dùng ngoặc kép `"` cho đường dẫn có khoảng trắng.
   - Hạn chế dùng tham số vị trí nhảy cóc, hãy khai báo rõ `-Path`, `-Filter`, v.v.

5. **CMD Wrapper**: Nếu lệnh quá phức tạp để viết bằng PowerShell, hãy bọc nó trong cmd:
   - ✅ `cmd /c "command1 && command2"`

6. **NO Hallucinations or Filler Words (e.g., 'fba')**:
   - Tuyệt đối KHÔNG tự ý thêm các từ khóa vô nghĩa, từ lặp lại hoặc filler words như `fba`, `fba'`, `xyz` vào cuối hoặc giữa các câu lệnh terminal.
   - Mọi câu lệnh phải SẠCH, CHÍNH XÁC và chỉ bao gồm các tham số hợp lệ của công cụ đó.
   - ❌ `git status fba' fba' ...`
   - ✅ `git status`
