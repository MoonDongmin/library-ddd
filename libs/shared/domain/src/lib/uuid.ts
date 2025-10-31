import { TinyTypeOf } from "tiny-types";
import { randomUUID } from "node:crypto";

/**
 * TinyTypeOf는 타입 안전한 Value Object를 만들기 위한 유틸리티
 *
 * 사용 예
 * const patron = new PatronId('patron-123');
 * const book = new BookId('book-456');
 * const branch = new LibraryBranchId('branch-789');
 *
 * placeOnHold(patron, book, branch); // ✅
 * placeOnHold(book, patron, branch); // ❌ 컴파일 에러!
 */
export class Uuid extends TinyTypeOf<string>() {
  static generate(): Uuid {
    return new Uuid(randomUUID());
  }
}
