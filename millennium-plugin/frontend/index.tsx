import { definePlugin, Millennium } from 'millennium';
import type { CSSProperties, ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

/* ------------------------------------------------------------------ *
 * 配置
 * ------------------------------------------------------------------ */

interface Settings {
  count: number;
  intervalMs: number;
  text: string;
  to: string;
}

const DEFAULTS: Settings = { count: 5, intervalMs: 800, text: ':steamhappy:', to: '' };
const LS_KEY = 'steamhappy.settings.v1';

const loadSettings = (): Settings => {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<Settings>) };
  } catch {
    return { ...DEFAULTS };
  }
};

const saveSettings = (s: Settings): void => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* 忽略存储失败 */
  }
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ *
 * 与 Steam 客户端内部聊天 store 交互
 * ------------------------------------------------------------------ */

const toAccountId = (s: string): number => {
  try {
    return Number(BigInt(s) - 76561197960265728n);
  } catch {
    return Number(s);
  }
};

const getChatStore = (): any => (window as any).g_FriendsUIApp?.ChatStore ?? null;

/** 找到要发送的聊天：优先指定好友，否则用“当前打开的聊天”，最后兜底最近一条。 */
const resolveChat = (cs: any, to: string): { chat: any; via: string } => {
  if (to) {
    const acct = toAccountId(to);
    const tries: Array<() => any> = [
      () => cs.GetFriendChat(acct),
      () => cs.GetFriendChat(acct, true),
      () => cs.GetFriendChat(String(to)),
    ];
    for (const t of tries) {
      try {
        const c = t();
        if (c) return { chat: c, via: '指定好友' };
      } catch {
        /* 试下一种 */
      }
    }
  }

  const probes: Array<[string, () => any]> = [
    ['当前会话', () => cs.GetActiveChatRoom?.()],
    ['当前会话', () => cs.GetActiveChat?.()],
    ['当前会话', () => cs.m_pActiveChatRoom],
    ['当前会话', () => cs.FriendChatStore?.GetActiveChatRoom?.()],
  ];
  for (const [via, fn] of probes) {
    try {
      const c = fn();
      if (c) return { chat: c, via };
    } catch {
      /* 试下一种 */
    }
  }

  try {
    const rec: any[] = cs.GetRecentChats?.() ?? [];
    if (rec.length) return { chat: rec[0], via: '最近聊天（兜底）' };
  } catch {
    /* 忽略 */
  }
  return { chat: null, via: '' };
};

const spam = async (
  opts: Settings,
  log: (m: string) => void,
  isStopped: () => boolean,
): Promise<void> => {
  const cs = getChatStore();
  if (!cs) throw new Error('拿不到聊天数据：请确认 Steam 已登录，并打开过一次好友/聊天窗口');

  const { chat, via } = resolveChat(cs, opts.to);
  if (!chat) throw new Error('找不到聊天对象：请先在 Steam 里打开某个好友的聊天窗口');

  const send = chat.SendChatMessage ?? chat.SendMessage;
  if (typeof send !== 'function') throw new Error('该聊天不支持发送消息');

  log(`目标：${via}`);
  for (let i = 1; i <= opts.count; i++) {
    if (isStopped()) {
      log('已停止');
      return;
    }
    try {
      await send.call(chat, opts.text);
      log(`#${i} 已发送`);
    } catch (e) {
      log(`#${i} 失败：${(e as Error).message}`);
      return;
    }
    if (i < opts.count && opts.intervalMs > 0) await sleep(opts.intervalMs);
  }
  log('完成 ✅');
};

/* ------------------------------------------------------------------ *
 * 界面
 * ------------------------------------------------------------------ */

const inputStyle: CSSProperties = {
  width: 72,
  background: '#1b2838',
  color: '#fff',
  border: '1px solid #2a475e',
  borderRadius: 3,
  padding: '2px 5px',
  fontSize: 12,
};

const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const labelStyle: CSSProperties = { width: 62, fontSize: 12, opacity: 0.85 };

function Panel({ compact = false }: { compact?: boolean }): ReactElement {
  const [s, setS] = useState<Settings>(loadSettings);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const stopped = useRef(false);

  useEffect(() => saveSettings(s), [s]);

  const log = useCallback((m: string) => setLogs((p) => [...p.slice(-40), m]), []);

  const start = useCallback(async () => {
    if (running) return;
    stopped.current = false;
    setRunning(true);
    setLogs([]);
    try {
      await spam(s, log, () => stopped.current);
    } catch (e) {
      log('错误：' + (e as Error).message);
    } finally {
      setRunning(false);
    }
  }, [running, s, log]);

  const stop = useCallback(() => {
    stopped.current = true;
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: compact ? 10 : 0,
        width: compact ? 288 : undefined,
        background: compact ? 'rgba(23,34,49,0.97)' : undefined,
        border: compact ? '1px solid #2a475e' : undefined,
        borderRadius: compact ? 8 : 0,
        boxShadow: compact ? '0 6px 24px rgba(0,0,0,0.5)' : undefined,
        color: '#fff',
        fontFamily: 'Motiva Sans, Arial, sans-serif',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#66c0f4' }}>steamhappy 连发</div>

      <div style={rowStyle}>
        <span style={labelStyle}>次数</span>
        <input
          type="number"
          min={1}
          max={1000}
          value={s.count}
          onChange={(e) => setS({ ...s, count: Math.max(1, Number(e.target.value) || 1) })}
          style={inputStyle}
        />
        <span style={{ ...labelStyle, width: 'auto' }}>间隔ms</span>
        <input
          type="number"
          min={0}
          max={60000}
          step={100}
          value={s.intervalMs}
          onChange={(e) => setS({ ...s, intervalMs: Math.max(0, Number(e.target.value) || 0) })}
          style={inputStyle}
        />
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>内容</span>
        <input
          type="text"
          value={s.text}
          onChange={(e) => setS({ ...s, text: e.target.value })}
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>好友id</span>
        <input
          type="text"
          placeholder="留空 = 当前打开的聊天"
          value={s.to}
          onChange={(e) => setS({ ...s, to: e.target.value })}
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <div style={{ ...rowStyle, justifyContent: 'flex-end' }}>
        {running && (
          <button onClick={stop} style={btnStyle('#a34')}>
            停止
          </button>
        )}
        <button onClick={start} disabled={running} style={btnStyle('#2a6')}>
          {running ? '发送中…' : '连发'}
        </button>
      </div>

      {logs.length > 0 && (
        <div
          style={{
            maxHeight: 96,
            overflowY: 'auto',
            fontFamily: 'Consolas, monospace',
            fontSize: 11,
            lineHeight: 1.5,
            opacity: 0.9,
            borderTop: '1px solid #2a475e',
            paddingTop: 4,
          }}
        >
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}

      {compact && (
        <div style={{ fontSize: 10, opacity: 0.5 }}>
          目标为你在 Steam 里打开的聊天；也可填好友 steamid64 指定。
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg: string): CSSProperties => ({
  background: bg,
  border: 'none',
  borderRadius: 3,
  color: '#fff',
  padding: '4px 12px',
  cursor: 'pointer',
  fontSize: 12,
});

/* ------------------------------------------------------------------ *
 * 把悬浮面板注入到「好友与聊天」窗口
 * ------------------------------------------------------------------ */

const HOST_ID = 'steamhappy-host';

const injectToolbar = (win: Window): void => {
  try {
    const doc = win.document;
    if (!doc?.body || doc.getElementById(HOST_ID)) return;
    const host = doc.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'position:fixed;right:12px;bottom:60px;z-index:2147483000;';
    doc.body.appendChild(host);
    createRoot(host).render(<Panel compact />);
  } catch {
    /* 忽略注入失败 */
  }
};

const OnPopupCreation = (popup: any): void => {
  let tries = 0;
  const tick = (): void => {
    tries += 1;
    try {
      const win: Window | undefined = popup?.m_popup?.document?.defaultView ?? popup?.window;
      if (win && (win as any).g_FriendsUIApp && win.document?.body) {
        injectToolbar(win);
        return;
      }
    } catch {
      /* 继续重试 */
    }
    if (tries < 60) setTimeout(tick, 500);
  };
  setTimeout(tick, 600);
};

/* ------------------------------------------------------------------ *
 * 插件入口
 * ------------------------------------------------------------------ */

export default definePlugin(() => {
  try {
    Millennium.AddWindowCreateHook?.(OnPopupCreation);
  } catch {
    /* 忽略 */
  }

  return {
    icon: <span style={{ fontSize: 16 }}>😄</span>,
    content: <Panel />,
  };
});
