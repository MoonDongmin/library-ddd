import { TinyTypeOf } from "tiny-types";

export class DateVO extends TinyTypeOf<Date>() {
  static now(): DateVO {
    return new DateVO(new Date());
  }

  /**
   * 날짜에 일수를 더한 새로운 DateVo 객체를 반환하는 기능
   * @param days
   */
  public addDays(days: number): DateVO {
    // 현재 날짜의 복사본
    const next = new Date(this.value.getTime());

    // 복사본에 days를 더함
    next.setDate(next.getDate() + days);

    // 새로운 DateVo 객체 반환
    return new DateVO(next);
  }
}
