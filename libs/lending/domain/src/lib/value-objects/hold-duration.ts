import { ensure, isGreaterThanOrEqualTo, TinyType } from "tiny-types";
import { DateVO } from "./dateVO";
import { NumberOfDays } from "./number-of-days";

export class HoldDuration extends TinyType {
  private constructor(
    public readonly from: DateVO,
    public readonly to: DateVO | null,
  ) {
    super();

    if (to) {
      ensure(
        'HoldDuration "to"',
        to.value.getTime(),
        isGreaterThanOrEqualTo(from.value.getTime()),
      );
    }
  }

  /**
   * 지정된 일수 동안 유효한 예약 기간 생성
   * @param days
   */
  public static closeEnded(days: NumberOfDays): HoldDuration {
    const to: DateVO = DateVO.now().addDays(days.value);

    return new HoldDuration(DateVO.now(), to);
  }

  /**
   * 종료일 없이 대출할 때까지 유효햔 예약 기간 생성
   */
  public static openEnded(): HoldDuration {
    return new HoldDuration(DateVO.now(), null);
  }

  /**
   * 이 예약이 무기한인지 확인
   */
  public isOpenEnded(): boolean {
    return !this.to;
  }
}
