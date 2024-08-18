import { day, hour, min } from '~/ts/date';
import { cloneDeep } from 'lodash-es';

/**时间段 */
export type Period = {
  start: string | number | Date;
  end: string | number | Date;
};

/**判断日程间是否有冲突 */
export function hasConflict(A: Period, B: Period) {
  if (A === B) throw '2个参数指向同一对象';
  return (
    new Date(A.start) < new Date(B.end) && new Date(B.start) < new Date(A.end)
  );
}
/**判断单个日程是否和日程组有冲突 */
export function hasConflictWithGroup(A: Period, B: Period[]) {
  return B.some((b) => hasConflict(A, b));
}
/**判断2个日程组间是否有冲突 */
export function hasConflictBetweenGroups(A: Period[], B: Period[]) {
  return A.some((a) => hasConflictWithGroup(a, B));
}
/**判断日程组内是否有冲突 */
export function hasConflictWithinGroup(A: Period[]) {
  return A.some((a, i) => hasConflictWithGroup(a, A.toSpliced(i, 1)));
}
/**
 * 多日程冲突处理
 * @param events 日程数组
 * @param noConflict 判定为无冲突时的处理函数
 * @param conflict 判定为有冲突时的处理函数
 * @param maxConcurrency 日程最大并发数
 * @returns 处理后的日程数组
 */
export function conflictHandler<T extends Period, U>(
  events: T[],
  noConflict: (event: T) => U,
  conflict: (event: T) => U,
  maxConcurrency = 1,
) {
  const timeline = events
    .flatMap((e, i): [T, 1 | -1, number][] => [
      [e, 1, +new Date(e.start)],
      [e, -1, +new Date(e.end)],
    ])
    .sort((a, b) => a[2] - b[2]);
  /**实时并发数 */
  let ongoing = 0;
  return timeline.flatMap(([event, i]) => {
    ongoing += i;
    if (i === -1) {
      return [];
    }
    if (ongoing > maxConcurrency) {
      return conflict(event);
    }
    return noConflict(event);
  });
}
/**
 * 创建多日程冲突处理函数
 * @param existing 已存在的日程数组
 * @param staying 待添加的日程数组
 * @returns 具有名称的冲突处理函数
 */
export function createConflictHandler<T extends Period>(
  existing: T[],
  staying: T[],
) {
  const events = new Set(staying);
  return function <U>(
    noConflict: (event: T) => U,
    conflict: (event: T) => U,
    maxConcurrency?: number,
  ) {
    return conflictHandler(
      existing.concat(staying),
      (e) => events.has(e) && noConflict(e),
      (e) => events.has(e) && conflict(e),
      maxConcurrency,
    ).filter((e): e is U => !!e);
  };
}
/**日程模板 */
const event_template: Period = {
  start: 0,
  end: 1,
};
/**
 * 批量创建日程
 * @param dayRange 日期区间
 * @param timeRange 时间范围: h
 * @param duration 单日程持续时间: min
 * @param times 日程重复次数
 * @param filter 筛选日程
 */
export function createEvents(
  dayRange: [number, number],
  timeRange: [number, number],
  duration: number,
  times = 1,
  filter = (e: typeof event_template) => true,
) {
  duration = min(duration);
  const daytime = dayRange.map(day);
  const time = timeRange.map(hour);
  const events: Period[] = [];
  while (daytime[0] < daytime[1]) {
    let _time = time[0];
    while (_time < time[1]) {
      const start = daytime[0] + _time;
      const event = Object.assign({}, event_template, {
        title: '',
        start: start.toString(),
        end: start + duration,
      });
      if (filter(event)) {
        events.concat(Array(times).fill(cloneDeep(event)));
      }
      _time += duration;
    }
    daytime[0] = daytime[0] + day(1);
  }
  return events;
}
