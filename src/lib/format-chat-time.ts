/** 聊天消息 / 会话列表时间展示（接近 QQ、微信） */

function toDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}

function calendarKey(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${m}-${day}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return calendarKey(a) === calendarKey(b);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function formatTime24(d: Date): string {
  return d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** 聊天气泡内：今天仅时分，昨天/今年/跨年逐级加日期 */
export function formatChatMessageTime(input: Date | string): string {
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const time = formatTime24(d);

  if (isSameCalendarDay(d, now)) return time;
  if (isSameCalendarDay(d, addDays(now, -1))) return `昨天 ${time}`;

  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (d.getFullYear() === now.getFullYear()) {
    return `${month}月${day}日 ${time}`;
  }
  return `${d.getFullYear()}年${month}月${day}日 ${time}`;
}

/** 会话列表右侧：今天时分，昨天/日期，跨年带年 */
export function formatChatListTime(input: Date | string): string {
  const d = toDate(input);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();

  if (isSameCalendarDay(d, now)) return formatTime24(d);
  if (isSameCalendarDay(d, addDays(now, -1))) return "昨天";

  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (d.getFullYear() === now.getFullYear()) {
    return `${month}月${day}日`;
  }
  return `${d.getFullYear()}年${month}月${day}日`;
}
