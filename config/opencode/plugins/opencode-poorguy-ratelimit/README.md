# @thd3178/opencode-poorguy-ratelimit

[English](README_EN.md)

OpenCode 插件：给 AI 请求做**滑动窗口限流**——按每分钟请求数精确控速，避免触发 RPM 上限导致的 429；多 key 场景自动轮询分流，抬升整体吞吐，缩短首 token 时间。

## 功能

- **滑动窗口限流**：按 `rpm` 精确限制每把 key 每分钟请求数，超出等着
- **多 key 分流**：round-robin / least-used / random 三种策略，多把 key 并发吞吐叠加
- **主动限流 + 429 兜底**：先本地控速，真撞 429 时单 key 指数冷却 + 自动切换
- **透明接入**：不改模型行为，只给 `Authorization` 做轮换和流量整形
- **零外部依赖**：纯 TypeScript，Bun 直跑

## 安装

npm 包名写进 `~/.config/opencode/opencode.jsonc`（或 `.json`）的 `plugin` 数组：

```json
{
  "plugin": [
    "@thd3178/opencode-poorguy-ratelimit"
  ]
}
```

`opencode` 重启后自动从 npm 装 `@latest` 并加载。

## 配置文件

配置文件路径（Bun 自动创建文件的父目录，不存在会自动建）：

```
~/.config/opencode/opencode-poorguy-ratelimit.jsonc
```

最小可用（key 从 `opencode.json` 的 `provider.<name>.options.apiKey` 自动读取，插件里不写 key）：

```jsonc
{
  "providers": {
    "nim": {
      "rpm": 40
    }
  }
}
```

**多 key 轮换**（写你自己的其他 key，覆盖自动读取的）：

```jsonc
{
  "providers": {
    "nim": {
      "rpm": 40,
      "keys": [
        "nvapi-xxx...",
        "nvapi-yyy...",
        "nvapi-zzz..."
      ]
    }
  }
}
```

**进一步调优**：

```jsonc
{
  "enabled": true,                    // 插件总开关
  "strategy": "round-robin",          // round-robin | least-used | random
  
  // 只对这里配置的 provider 生效
  "providers": {
    "nim": {
      "rpm": 40,                       // 单 key 每分钟上限
      "keys": ["..."],                 // 可选：多 key，不写则用 opencode.json 里的 apiKey
    },
    "google": { "rpm": 60 }
  },
  
  // 429 后该 key 进入冷却（冷却期间跳过）；无 Retry-After 头时从 baseDelayMs 指数翻倍
  "backoff": {
    "baseDelayMs": 5000,
    "maxDelayMs": 120000
  },
  
  // 日志文件开关（~/.config/opencode/opencode-poorguy-ratelimit.log）
  "logging": {
    "enabled": true
  }
}
```

### 字段速查

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `enabled` | boolean | `true` | 插件总开关；`false` 则插件完全不加载 |
| `strategy` | string | `round-robin` | 轮询策略：`round-robin` 严格轮换 / `least-used` 优先用本分钟用得最少的 / `random` 随机 |
| `providers` | object | `{}` | **只有列在这里的 provider 才会被限流/轮换**；未配置的 provider 完全插件不管 |
| `providers.<name>.rpm` | number | `40` | 每把 key 每分钟允许请求数；总吞吐 = `rpm × key 数量` |
| `providers.<name>.keys` | string[] | 无 | 可选。配置了就在这几把之间轮换；未配置则自动读取 `opencode.json` 中该 provider 的 `options.apiKey`（**不需要在插件配置里重复写 key**） |
| `providers.<name>.maxConcurrent` | number | `2` | 同一时刻允许最多几个**并发请求**。超出的请求排队等前面的请求（包括流式接收完成）再发，防止 NIM 因并发触发 429 |
| `backoff.baseDelayMs` | number | `5000` | 429 后首次冷却毫秒数（无 `Retry-After` 头时）；连续 429 指数翻倍 |
| `backoff.maxDelayMs` | number | `120000` | 本地指数退避的冷却上限；服务器返回的 `Retry-After` 不受此值截断，原样生效 |
| `logging.enabled` | boolean | `true` | 是否写插件日志文件 |

> provider 名字必须是 `opencode.json` 里 `provider` 对象的**键名**（key），不是显示名。

## 工作原理

```
每来一条请求
  ↓
插件拦截该 provider 的 fetch（所有真实请求都经过这里：主对话 / 工具链子请求 / 副标题 / subagent）
  ↓
查该 provider 的可用 keys（跳过 429 冷却中的）
  ↓
按 round-robin / least-used / random 选一把 key
  ↓
该 key 的滑动窗口还有余量？→ 放行并计一次
  ↓
窗口已满（rpm 满了）？→ 等待最早的那条过期后重试，期间其他 key 的窗口照常可用
```

- 每把 key 独立计时，互不挤占——**多 key 就是多管道**
- 窗口是**滑动 60 秒**，不是自然分钟的整桶重置
- 429 响应由插件直接捕获（`response.status == 429`），触发指数冷却
- subagent / 工具子请求 / 标题生成，只要用该 provider 就计入，不分是不是当前 session 主流程

## 运行时可观测

- **Toast**：每次请求右上角弹 `🔑 [provider] key…xxxx · 窗口 N/40 · key x/y`；限流时弹等待提示；429 时弹冷却通知
- **日志文件**：`~/.config/opencode/opencode-poorguy-ratelimit.log`（UTF-8，GBK 控制台读会乱码属正常现象），每行记录 key 尾号和本次等待时间

## 常见问题

**Q: 为什么配置了多把 key，体感没变化？**
首次使用或修改配置后，需要**重启 opencode**。如果刚加完 key 没多久，`least-used`/`round-robin` 策略仍在给某一把 key 的窗口做初始化。如果 `rpm` 值远低于你真实单 key 的 NIM 限制，等于自己把自己限死了——确认你的 key 对应的 NIM 实际 RPM 额度。

**Q: 为什么只在发消息的时候看到限流提示，工具调用没有？**
那是旧版本的 bug（`chat.params` hook 只拦截每个 stream 的第一个请求）。1.6.0+ 已改成在 fetch 层拦截，所有请求一视同仁。

**Q: 需要把 apiKey 写进插件配置吗？**
不需要。插件会自动读取 `opencode.json` 里 `provider.<name>.options.apiKey`。只有当你想加一把**额外的** key 做轮换时才需要把新 key 写进 `keys` 数组。

## 安全提醒

- `npm publish` 时 npm 可能要求 2FA / granular token；token 建议用完即 revoke
- 任何在 `opencode.json` 里以明文形式存在的 apiKey，写到配置文件或贴给 AI 时注意脱敏

## 许可证

MIT
