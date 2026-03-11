# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"../../Stores/OpenStore\" from \"src/features/auth/components/ModalSetting.tsx\". Does the file exist?"
  - generic [ref=e5]: C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/src/features/auth/components/ModalSetting.tsx:2:29
  - generic [ref=e6]: "2 | var _s = $RefreshSig$(); 3 | import React, {} from \"react\"; 4 | import { useOpenStore } from \"../../Stores/OpenStore\"; | ^ 5 | import { LogOut, User, UserCheck } from \"lucide-react\"; 6 | import { useUserInfo } from \"../../Hooks/useUserInfo\";"
  - generic [ref=e7]: at TransformPluginContext._formatLog (file:///C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/node_modules/vite/dist/node/chunks/config.js:28999:43) at TransformPluginContext.error (file:///C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/node_modules/vite/dist/node/chunks/config.js:28996:14) at normalizeUrl (file:///C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/node_modules/vite/dist/node/chunks/config.js:27119:18) at process.processTicksAndRejections (node:internal/process/task_queues:105:5) at async file:///C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/node_modules/vite/dist/node/chunks/config.js:27177:32 at async Promise.all (index 2) at async TransformPluginContext.transform (file:///C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/node_modules/vite/dist/node/chunks/config.js:27145:4) at async EnvironmentPluginContainer.transform (file:///C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/node_modules/vite/dist/node/chunks/config.js:28797:14) at async loadAndTransform (file:///C:/laragon/www/laravel/DATN_hostech/Hostech/frontend/node_modules/vite/dist/node/chunks/config.js:22670:26)
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```