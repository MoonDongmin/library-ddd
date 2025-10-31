# Lending Context에 새 기능 추가하기: 초보자를 위한 완전 가이드

이 문서는 **DDD(Domain-Driven Design)를 처음 접하는 개발자**를 위한 실전 가이드입니다.
**"도서관에서 책을 예약하는 기능"**을 예시로, 처음부터 끝까지 단계별로 따라가며 DDD 헥사고날 아키텍처를 이해하고 구현할 수 있습니다.

## 🎯 이 문서를 읽기 전에

### DDD가 왜 어려운가?
일반적인 CRUD 개발과 달리, DDD는:
- **비즈니스 로직이 데이터베이스가 아닌 도메인 모델에 있습니다**
- **엔티티가 단순 데이터 컨테이너가 아닌 행동을 가진 객체입니다**
- **레이어가 명확히 분리되어 의존성 방향이 역전됩니다**

### 이 가이드의 특징
- ✅ **왜 이렇게 해야 하는지** 설명합니다
- ✅ **실제로 무엇을 고민하며 코드를 작성하는지** 보여줍니다
- ✅ **초보자가 자주 하는 실수**를 미리 알려줍니다
- ✅ **도메인 → 바깥쪽 순서**로 구현하여 비즈니스 로직부터 시작합니다

## 목차
- [🧠 DDD 마인드셋 이해하기](#-ddd-마인드셋-이해하기)
- [📐 아키텍처 구조 이해하기](#-아키텍처-구조-이해하기)
- [0단계: 기능 설계 - 코드 전에 생각하기](#0단계-기능-설계---코드-전에-생각하기)
- [1단계: Domain 레이어 구현](#1단계-domain-레이어-구현)
- [2단계: Application 레이어 구현](#2단계-application-레이어-구현)
- [3단계: Infrastructure 레이어 구현](#3단계-infrastructure-레이어-구현)
- [4단계: UI 레이어 구현](#4단계-ui-레이어-구현)
- [5단계: 통합 테스트 및 실행](#5단계-통합-테스트-및-실행)
- [6단계: 검증 및 마무리](#6단계-검증-및-마무리)

---

## 🧠 DDD 마인드셋 이해하기

### 일반 개발 vs DDD 개발

| 일반적인 CRUD 개발 | DDD 개발 |
|------------------|---------|
| 데이터베이스 테이블부터 설계 | 비즈니스 문제부터 이해 |
| 엔티티 = 테이블의 매핑 | 엔티티 = 비즈니스 규칙을 가진 객체 |
| Service에 모든 로직 | Domain에 비즈니스 로직, Service는 조율만 |
| DTO → Entity → DB 직행 | DTO → Command → Domain → Event → Repository |

### 핵심 원칙 3가지

1. **비즈니스 로직은 도메인에**
    - ❌ 나쁜 예: `PatronService`에서 "일반 회원은 5권까지만" 체크
    - ✅ 좋은 예: `Patron` 도메인 객체 자체가 규칙을 검증

2. **의존성은 안쪽으로**
    - ❌ Domain이 Infrastructure를 import
    - ✅ Infrastructure가 Domain의 인터페이스(Port)를 구현

3. **도메인은 프레임워크와 독립적**
    - ❌ Domain에 `@Entity`, `@Injectable` 같은 데코레이터
    - ✅ 순수 TypeScript 클래스만 사용

---

## 📐 아키텍처 구조 이해하기

### 레이어 구조 (동심원으로 이해하기)

```
┌─────────────────────────────────────┐
│  UI Layer (ui-rest/)                │  ← HTTP 요청 받음
│  - Controller, DTO                  │
└─────────────────────────────────────┘
           ↓ (Facade 호출)
┌─────────────────────────────────────┐
│  Application Layer (application/)   │  ← 유스케이스 조율
│  - Command, Handler, Port           │
└─────────────────────────────────────┘
           ↓ (Domain 호출)
┌─────────────────────────────────────┐
│  Domain Layer (domain/)             │  ← 🎯 핵심! 비즈니스 로직
│  - Entity, Value Object, Policy     │
└─────────────────────────────────────┘
           ↑ (의존성 역전!)
┌─────────────────────────────────────┐
│  Infrastructure Layer (infra/)      │  ← 기술 구현
│  - Repository, Database Entity      │
└─────────────────────────────────────┘
```

### 의존성 방향 (중요!)

```
UI ──→ Application ──→ Domain
                ↑
                │ (인터페이스만 의존)
                │
         Infrastructure
```

**왜 이렇게?**
- Domain이 가장 중요하므로 **아무것도 의존하지 않음**
- Infrastructure는 "기술 세부사항"이므로 Domain이 몰라도 됨
- 나중에 PostgreSQL → MongoDB 변경해도 Domain은 변경 없음!

---

## 0단계: 기능 설계 - 코드 전에 생각하기

### 왜 설계부터 하는가?

❌ **초보자의 실수**: "일단 코드부터 짜고 보자"
✅ **DDD 접근법**: "비즈니스를 이해하고, 도메인 모델을 설계한 후 코드를 짠다"

**코드를 짜기 전 반드시 답해야 할 질문들:**

### 📋 Step 1: 요구사항을 문장으로 정리하기

**예시: "책 예약 기능"**

> "도서관 이용자(Patron)가 특정 도서관 지점(LibraryBranch)에 있는 책(Book)을 일정 기간 동안 예약(Hold)할 수 있다.
> 단, 일반 이용자는 5권까지만 예약 가능하며, 제한된 책(Restricted Book)은 연구자만 예약할 수 있다."

**작성 팁:**
- **주어(누가)**: Patron
- **동사(무엇을)**: 예약한다
- **목적어(대상)**: Book
- **조건(규칙)**: 최대 5권, 연구자만 제한된 책 가능

### 🎨 Step 2: Event Storming (간단 버전)

복잡한 워크샵이 아니라, **종이에 포스트잇 붙이듯** 생각하세요.

```
[Command]          [Event]              [Event (실패)]
PlaceOnHold   →   BookPlacedOnHold
                  BookHoldFailed
```

**질문 체크리스트:**
1. **이벤트(Event)**: 성공하면 무슨 일이 발생하나? → `BookPlacedOnHold`
2. **실패 이벤트**: 실패하면? → `BookHoldFailed` (이유: 5권 초과, 권한 없음 등)
3. **누가 결정하나?**: Patron aggregate가 "내가 예약할 수 있는지" 판단
4. **규칙(Policy)은?**: "일반 이용자 5권 제한", "제한 도서는 연구자만"

### 🧩 Step 3: 도메인 개념 식별하기

| 개념 | 종류 | 설명 |
|-----|------|-----|
| `Patron` | Aggregate Root | 예약을 관리하고 규칙을 강제하는 주체 |
| `PatronId` | Value Object | 이용자 식별자 |
| `BookId` | Value Object | 책 식별자 |
| `LibraryBranchId` | Value Object | 도서관 지점 식별자 |
| `HoldDuration` | Value Object | 예약 기간 (시작일~종료일) |
| `AvailableBook` | Entity | 예약 가능한 책 |
| `BookPlacedOnHold` | Domain Event | 예약 성공 이벤트 |
| `BookHoldFailed` | Domain Event | 예약 실패 이벤트 |
| `PlacingOnHoldPolicy` | Policy | 예약 가능 여부를 판단하는 규칙 |

**어떻게 구분하나?**
- **Value Object**: 식별자가 없고 값으로만 구분 (예: `HoldDuration`)
- **Entity**: 식별자가 있음 (예: `AvailableBook`에는 `BookId`가 있음)
- **Aggregate Root**: 비즈니스 규칙을 강제하는 중심 객체 (예: `Patron`)
- **Domain Event**: 과거형 명사, 중요한 사실 (예: `BookPlacedOnHold`)
- **Policy**: "~할 수 있는가?" 판단 로직 (예: `onlyResearcherCanHoldRestrictedBooks`)

### 🗂️ Step 4: 데이터 영속성 생각하기

**질문**: 무엇을 저장해야 하나?

```sql
-- patrons 테이블
CREATE TABLE patrons (
                         id VARCHAR(255) PRIMARY KEY,
                         patron_type VARCHAR(50),  -- 'REGULAR' | 'RESEARCHER'
                         holds JSONB               -- 현재 예약 목록
);
```

**초보자 팁:**
- 이 단계에서는 **대략적인 구조만** 생각
- 정확한 스키마는 Infrastructure 레이어에서 정의
- 도메인 모델과 데이터베이스 스키마는 다를 수 있음!

### 📡 Step 5: API 엔드포인트 설계

```http
POST /lending/holds
Content-Type: application/json

{
  "patronId": "patron-123",
  "bookId": "book-456",
  "libraryBranchId": "branch-789",
  "numberOfDays": 5
}
```

**응답:**
- 성공: `201 Created`
- 실패: `400 Bad Request` (5권 초과, 권한 없음 등)

### ✅ Step 6: 구현 순서 확정

```
1단계: Domain 레이어
  → Value Objects (PatronId, BookId, HoldDuration)
  → Domain Events (BookPlacedOnHold, BookHoldFailed)
  → Entities (AvailableBook)
  → Policy (PlacingOnHoldPolicy)
  → Aggregate (Patron.placeOnHold 메서드)

2단계: Application 레이어
  → Command (PlaceOnHoldCommand)
  → Command Handler (PlaceOnHoldHandler)
  → Port (PatronRepository, BookRepository)

3단계: Infrastructure 레이어
  → Database Entity (PatronEntity)
  → Repository 구현 (PatronRepositoryImpl)
  → Migration

4단계: UI 레이어
  → DTO (PlaceOnHoldDto)
  → Controller (LendingController)
```

### 🔧 개발 환경 확인

코드를 작성하기 전에 환경을 확인하세요:

```bash
# 1. 의존성 설치
npm install

# 2. 데이터베이스 실행 확인
docker-compose ps

# 3. 기존 테스트가 통과하는지 확인
nx test lending-domain

# 4. 애플리케이션이 실행되는지 확인
nx serve library
```

**모든 것이 정상이면 이제 1단계(Domain)로 넘어가세요!**

---

## 1단계: Domain 레이어 구현

**위치**: `libs/lending/domain/src/lib/`

### 🎯 이 단계의 목표

**Domain 레이어는 DDD의 핵심입니다!** 여기서는 비즈니스 로직을 순수하게 표현합니다.

**원칙 (반드시 지켜야 함):**
- ✅ **프레임워크 독립적**: NestJS, Express 등 어떤 프레임워크도 import 금지
- ✅ **외부 의존성 없음**: 데이터베이스, HTTP 클라이언트 등 사용 불가
- ✅ **순수 TypeScript/fp-ts**: 오직 비즈니스 로직만 작성
- ✅ **테스트 가능**: 외부 의존성이 없으므로 빠른 단위 테스트 가능

### ⚠️ 초보자가 자주 하는 실수

| ❌ 하지 말아야 할 것 | ✅ 해야 할 것 |
|-------------------|------------|
| Domain에서 `@Injectable()` 사용 | 순수 TypeScript 클래스만 |
| Domain에서 Repository 호출 | Application 레이어에서 조율 |
| Domain에서 데이터베이스 Entity 사용 | Value Object와 Entity 분리 |
| 비즈니스 로직을 Service에 작성 | 비즈니스 로직을 Domain에 작성 |

### 📝 구현 순서 (이 순서대로!)

```
1. Value Objects   → 가장 기본이 되는 개념
2. Domain Events   → 무슨 일이 발생했는지 표현
3. Entities        → 식별자를 가진 객체
4. Policy          → 비즈니스 규칙
5. Aggregate Root  → 모든 것을 조율하는 중심
6. Factory         → 복잡한 객체 생성
```

---

### 1.1 Value Objects 정의

#### 💡 Value Object란?

**Value Object(값 객체)**는 **식별자 없이 값으로만 구분되는 개념**입니다.

**예시:**
- `PatronId("patron-123")` vs `PatronId("patron-456")` → 값이 다르므로 다른 객체
- `HoldDuration(2024-01-01 ~ 2024-01-05)` → 날짜가 같으면 같은 객체

**왜 Value Object를 사용하나?**
- ❌ 나쁜 예: `patronId: string` → 실수로 `bookId`를 넣어도 컴파일 에러 없음
- ✅ 좋은 예: `patronId: PatronId` → 타입 안전성 보장!

**위치**: `libs/lending/domain/src/lib/value-objects/`

#### 예시 1: 단순 식별자 (TinyType 사용)

```typescript
// libs/lending/domain/src/lib/value-objects/patron-id.ts
import { TinyTypeOf } from 'tiny-types';

export class PatronId extends TinyTypeOf<string>() {
  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('PatronId cannot be empty');
    }
    super(value);
  }
}
```

#### 예시 2: 복잡한 값 객체 (일반 클래스)

```typescript
// libs/lending/domain/src/lib/value-objects/hold-duration.ts
import { DateVO } from './date.vo';

export class HoldDuration {
  // private 생성자로 직접 생성 방지
  private constructor(
    public readonly from: DateVO,
    public readonly to?: DateVO
  ) {}

  // 팩토리 메서드로 생성
  static closeEnded(from: DateVO, to: DateVO): HoldDuration {
    if (to.isBefore(from)) {
      throw new Error('Hold end date must be after start date');
    }
    return new HoldDuration(from, to);
  }

  static openEnded(from: DateVO): HoldDuration {
    return new HoldDuration(from, undefined);
  }

  // 비즈니스 로직 메서드
  isOpenEnded(): boolean {
    return this.to === undefined;
  }

  isExpired(currentDate: DateVO): boolean {
    if (this.isOpenEnded()) {
      return false;
    }
    return this.to!.isBefore(currentDate);
  }
}
```

**설계 원칙:**
- [ ] **불변성**: 모든 필드가 `readonly`
- [ ] **자기 검증**: 생성자/팩토리에서 유효성 검사
- [ ] **값 기반 동등성**: 값이 같으면 동일한 객체
- [ ] **부수 효과 없음**: 메서드가 상태를 변경하지 않음
- [ ] **도메인 의미 표현**: 기술적이 아닌 비즈니스 개념

**테스트 작성:**

```typescript
// libs/lending/domain/src/lib/value-objects/hold-duration.spec.ts
import { HoldDuration } from './hold-duration';
import { DateVO } from './date.vo';

describe('HoldDuration', () => {
  it('should create close-ended duration', () => {
    const from = DateVO.of('2024-01-01');
    const to = DateVO.of('2024-01-05');

    const duration = HoldDuration.closeEnded(from, to);

    expect(duration.isOpenEnded()).toBe(false);
  });

  it('should throw error when end date is before start date', () => {
    const from = DateVO.of('2024-01-05');
    const to = DateVO.of('2024-01-01');

    expect(() => HoldDuration.closeEnded(from, to)).toThrow();
  });
});
```

### 1.2 Domain Events 정의

**목적**: 도메인에서 발생한 중요한 사실을 나타냄

**위치**: `libs/lending/domain/src/lib/events/`

#### 성공 이벤트 예시

```typescript
// libs/lending/domain/src/lib/events/book-placed-on-hold.ts
import { PatronEvent } from './patron-event';
import { PatronId } from '../value-objects/patron-id';
import { BookId } from '../value-objects/book-id';
import { LibraryBranchId } from '../value-objects/library-branch-id';
import { DateVO } from '../value-objects/date.vo';

export class BookPlacedOnHold extends PatronEvent {
  constructor(
    patronId: PatronId,
    public readonly bookId: BookId,
    public readonly libraryBranchId: LibraryBranchId,
    public readonly holdTo?: DateVO
  ) {
    super(patronId, DateVO.now());
  }
}
```

#### 실패 이벤트 예시

```typescript
// libs/lending/domain/src/lib/events/book-hold-failed.ts
import { PatronEvent } from './patron-event';
import { PatronId } from '../value-objects/patron-id';
import { DateVO } from '../value-objects/date.vo';

export class BookHoldFailed extends PatronEvent {
  constructor(
    public readonly reason: string,
    patronId: PatronId,
    when: DateVO
  ) {
    super(patronId, when);
  }

  static bookHoldFailedNow(reason: string, patronId: PatronId): BookHoldFailed {
    return new BookHoldFailed(reason, patronId, DateVO.now());
  }
}
```

**설계 원칙:**
- [ ] **과거형 명명**: `BookPlacedOnHold` (O), `PlaceBookOnHold` (X)
- [ ] **불변 데이터**: 모든 필드 `readonly`
- [ ] **시간 정보 포함**: 이벤트 발생 시각
- [ ] **컨텍스트 정보**: 누가(PatronId), 무엇을(BookId), 어디서(LibraryBranchId)

### 1.3 Entities 정의

**목적**: 식별자를 가지며 생명주기가 있는 도메인 객체

**위치**: `libs/lending/domain/src/lib/`

```typescript
// libs/lending/domain/src/lib/book/available-book.ts
import { BookId } from '../value-objects/book-id';
import { LibraryBranchId } from '../value-objects/library-branch-id';
import { BookType } from '../value-objects/book-type';

export class AvailableBook {
  constructor(
    public readonly bookId: BookId,
    public readonly bookType: BookType,
    public readonly libraryBranchId: LibraryBranchId
  ) {}

  isRestricted(): boolean {
    return this.bookType.isRestricted();
  }
}
```

### 1.4 Policy 정의

**목적**: 비즈니스 규칙을 캡슐화하고 조합 가능하게 만듦

**위치**: `libs/lending/domain/src/lib/policies/`

#### Policy 타입 정의

```typescript
// libs/lending/domain/src/lib/policies/placing-on-hold-policy.ts
import { Either, left, right } from 'fp-ts/lib/Either';
import { AvailableBook } from '../book/available-book';
import { Patron } from '../patron';
import { HoldDuration } from '../value-objects/hold-duration';

export class Rejection {
  constructor(public readonly reason: string) {}

  static withReason(reason: string): Rejection {
    return new Rejection(reason);
  }
}

export type PlacingOnHoldPolicy = (
  book: AvailableBook,
  patron: Patron,
  duration: HoldDuration
) => Either<Rejection, true>;
```

#### Policy 구현 예시

```typescript
// 정책 1: 제한된 책은 연구자만 예약 가능
export const onlyResearcherCanHoldRestrictedBooks: PlacingOnHoldPolicy = (
  book,
  patron,
  duration
) => {
  if (book.isRestricted() && patron.isRegular()) {
    return left(Rejection.withReason('Regular patron cannot hold restricted books'));
  }
  return right(true);
};

// 정책 2: 일반 이용자는 최대 5권까지 예약 가능
export const regularPatronMaximumNumberOfHolds: PlacingOnHoldPolicy = (
  book,
  patron,
  duration
) => {
  if (patron.isRegular() && patron.numberOfHolds() >= 5) {
    return left(Rejection.withReason('Regular patron cannot hold more than 5 books'));
  }
  return right(true);
};
```

### 1.5 Aggregate Root 확장

**목적**: 관련 객체의 그룹을 관리하고 불변식(invariant)을 강제

**위치**: `libs/lending/domain/src/lib/patron.ts`

```typescript
import { Either, left, right, isLeft } from 'fp-ts/lib/Either';
import { Option, none, isNone } from 'fp-ts/lib/Option';

export class Patron {
  constructor(
    private readonly patronHolds: PatronHolds,
    private readonly placingOnHoldPolicies: Set<PlacingOnHoldPolicy>,
    private readonly patronInformation: PatronInformation
  ) {}

  placeOnHold(
    book: AvailableBook,
    duration: HoldDuration
  ): Either<BookHoldFailed, BookPlacedOnHold> {
    // 1. 정책 검증
    const rejection = this.patronCanHold(book, duration);

    if (isNone(rejection)) {
      // 2. 성공 이벤트 생성
      return right(
        new BookPlacedOnHold(
          this.patronInformation.patronId,
          book.bookId,
          book.libraryBranchId,
          duration.to
        )
      );
    }

    // 3. 실패 이벤트 생성
    return left(
      BookHoldFailed.bookHoldFailedNow(
        rejection.value.reason,
        this.patronInformation.patronId
      )
    );
  }

  private patronCanHold(
    book: AvailableBook,
    duration: HoldDuration
  ): Option<Rejection> {
    const rejection = [...this.placingOnHoldPolicies]
      .map((policy) => policy(book, this, duration))
      .find(isLeft);

    return rejection ? some(rejection.left) : none;
  }

  isRegular(): boolean {
    return this.patronInformation.isRegular();
  }

  numberOfHolds(): number {
    return this.patronHolds.numberOfHolds;
  }
}
```

### 1.6 Factory 확장

**목적**: 복잡한 aggregate 생성 로직 캡슐화

```typescript
// libs/lending/domain/src/lib/factories/patron.factory.ts
import { Patron } from '../patron';
import { PatronInformation } from '../value-objects/patron-information';
import { PatronHolds } from '../value-objects/patron-holds';
import {
  onlyResearcherCanHoldRestrictedBooks,
  regularPatronMaximumNumberOfHolds,
} from '../policies/placing-on-hold-policy';

export class PatronFactory {
  static create(patronInformation: PatronInformation): Patron {
    const policies = new Set([
      onlyResearcherCanHoldRestrictedBooks,
      regularPatronMaximumNumberOfHolds,
    ]);

    return new Patron(
      PatronHolds.empty(),
      policies,
      patronInformation
    );
  }

  static reconstitute(
    patronInformation: PatronInformation,
    patronHolds: PatronHolds
  ): Patron {
    const policies = new Set([
      onlyResearcherCanHoldRestrictedBooks,
      regularPatronMaximumNumberOfHolds,
    ]);

    return new Patron(patronHolds, policies, patronInformation);
  }
}
```

### 1.7 도메인 레이어 테스트 작성

**목적**: 비즈니스 로직의 정확성을 검증

```typescript
// libs/lending/domain/src/lib/patron.spec.ts
import { Patron } from './patron';
import { PatronFactory } from './factories/patron.factory';
import { isRight, isLeft } from 'fp-ts/lib/Either';

describe('Patron', () => {
  describe('placing book on hold', () => {
    it('should allow regular patron to hold circulating book', () => {
      // Given
      const patron = createRegularPatron();
      const book = createCirculatingBook();
      const duration = HoldDuration.closeEnded(
        DateVO.now(),
        DateVO.now().addDays(5)
      );

      // When
      const result = patron.placeOnHold(book, duration);

      // Then
      expect(isRight(result)).toBe(true);
    });

    it('should reject regular patron holding restricted book', () => {
      // Given
      const patron = createRegularPatron();
      const book = createRestrictedBook();
      const duration = HoldDuration.closeEnded(
        DateVO.now(),
        DateVO.now().addDays(5)
      );

      // When
      const result = patron.placeOnHold(book, duration);

      // Then
      expect(isLeft(result)).toBe(true);
    });
  });
});
```

**테스트 실행:**

```bash
nx test lending-domain
```

### 1.8 Domain 레이어 index.ts 업데이트

```typescript
// libs/lending/domain/src/index.ts

// Aggregates
export * from './lib/patron';

// Entities
export * from './lib/book/available-book';

// Value Objects
export * from './lib/value-objects/patron-id';
export * from './lib/value-objects/book-id';
export * from './lib/value-objects/hold-duration';

// Events
export * from './lib/events/book-placed-on-hold';
export * from './lib/events/book-hold-failed';

// Policies
export * from './lib/policies/placing-on-hold-policy';

// Factories
export * from './lib/factories/patron.factory';
```

---

## 2단계: Application 레이어 구현

**위치**: `libs/lending/application/src/lib/`

**원칙**:
- Domain 로직 조율
- Port(인터페이스) 정의
- CQRS 패턴 적용
- 트랜잭션 경계 관리

### 2.1 Command 정의

**목적**: 시스템에 대한 의도를 나타냄

```typescript
// libs/lending/application/src/lib/place-on-hold/place-on-hold.command.ts
import { Command } from '@nestjs-architects/typed-cqrs';

export class PlaceOnHoldCommand extends Command<void> {
  constructor(
    public readonly patronId: string,
    public readonly bookId: string,
    public readonly libraryBranchId: string,
    public readonly numberOfDays?: number
  ) {
    super();
  }
}
```

### 2.2 Port (인터페이스) 정의

**목적**: 외부 의존성에 대한 추상화

```typescript
// libs/lending/application/src/lib/ports/patron.repository.ts
import { Patron } from '@library/lending/domain';
import { PatronId } from '@library/lending/domain';

export abstract class PatronRepository {
  abstract findById(patronId: PatronId): Promise<Patron | null>;
  abstract save(patron: Patron): Promise<void>;
}
```

```typescript
// libs/lending/application/src/lib/ports/book.repository.ts
import { AvailableBook } from '@library/lending/domain';
import { BookId, LibraryBranchId } from '@library/lending/domain';

export abstract class BookRepository {
  abstract findAvailableBook(
    bookId: BookId,
    libraryBranchId: LibraryBranchId
  ): Promise<AvailableBook | null>;
}
```

### 2.3 Command Handler 구현

**목적**: Command를 받아 도메인 로직 실행 및 조율

```typescript
// libs/lending/application/src/lib/place-on-hold/place-on-hold.handler.ts
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { isLeft } from 'fp-ts/lib/Either';
import { PlaceOnHoldCommand } from './place-on-hold.command';
import { PatronRepository } from '../ports/patron.repository';
import { BookRepository } from '../ports/book.repository';
import {
  PatronId,
  BookId,
  LibraryBranchId,
  HoldDuration,
  DateVO,
} from '@library/lending/domain';

@Injectable()
@CommandHandler(PlaceOnHoldCommand)
export class PlaceOnHoldHandler implements ICommandHandler<PlaceOnHoldCommand> {
  constructor(
    private readonly patronRepository: PatronRepository,
    private readonly bookRepository: BookRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(command: PlaceOnHoldCommand): Promise<void> {
    // 1. Value Objects 생성
    const patronId = new PatronId(command.patronId);
    const bookId = new BookId(command.bookId);
    const libraryBranchId = new LibraryBranchId(command.libraryBranchId);

    // 2. Aggregate와 Entity 조회
    const patron = await this.patronRepository.findById(patronId);
    if (!patron) {
      throw new Error(`Patron not found: ${command.patronId}`);
    }

    const book = await this.bookRepository.findAvailableBook(
      bookId,
      libraryBranchId
    );
    if (!book) {
      throw new Error(`Available book not found: ${command.bookId}`);
    }

    // 3. 도메인 로직 실행
    const duration = command.numberOfDays
      ? HoldDuration.closeEnded(
        DateVO.now(),
        DateVO.now().addDays(command.numberOfDays)
      )
      : HoldDuration.openEnded(DateVO.now());

    const result = patron.placeOnHold(book, duration);

    // 4. 결과 처리
    if (isLeft(result)) {
      throw new Error(result.left.reason);
    }

    // 5. 이벤트 발행
    const patronWithEvents = this.eventPublisher.mergeObjectContext(patron);
    patronWithEvents.commit();

    // 6. Aggregate 저장
    await this.patronRepository.save(patron);
  }
}
```

### 2.4 Command Handler 테스트

```typescript
// libs/lending/application/src/lib/place-on-hold/place-on-hold.handler.spec.ts
import { Test } from '@nestjs/testing';
import { PlaceOnHoldHandler } from './place-on-hold.handler';

describe('PlaceOnHoldHandler', () => {
  let handler: PlaceOnHoldHandler;
  let patronRepository: jest.Mocked<PatronRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PlaceOnHoldHandler,
        {
          provide: PatronRepository,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get(PlaceOnHoldHandler);
    patronRepository = module.get(PatronRepository);
  });

  it('should place book on hold successfully', async () => {
    // Given
    const command = new PlaceOnHoldCommand('patron-1', 'book-1', 'branch-1', 5);
    patronRepository.findById.mockResolvedValue(createMockPatron());

    // When
    await handler.execute(command);

    // Then
    expect(patronRepository.save).toHaveBeenCalled();
  });
});
```

### 2.5 Event Handler 구현

**목적**: 도메인 이벤트에 반응하여 부수 효과 처리

```typescript
// libs/lending/application/src/lib/event-handlers/book-placed-on-hold.event-handler.ts
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { BookPlacedOnHold } from '@library/lending/domain';

@Injectable()
@EventsHandler(BookPlacedOnHold)
export class BookPlacedOnHoldEventHandler
  implements IEventHandler<BookPlacedOnHold>
{
  private readonly logger = new Logger(BookPlacedOnHoldEventHandler.name);

  async handle(event: BookPlacedOnHold): Promise<void> {
    this.logger.log(
      `Book ${event.bookId.value} placed on hold by patron ${event.patronId.value}`
    );

    // 여기서 부수 효과 처리:
    // - 읽기 모델 업데이트
    // - 알림 발송
    // - 다른 aggregate와의 통신
  }
}
```

### 2.6 Facade 업데이트

```typescript
// libs/lending/application/src/lib/lending.facade.ts
import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PlaceOnHoldCommand } from './place-on-hold/place-on-hold.command';

@Injectable()
export class LendingFacade {
  constructor(private readonly commandBus: CommandBus) {}

  async placeOnHold(command: PlaceOnHoldCommand): Promise<void> {
    return this.commandBus.execute(command);
  }
}
```

### 2.7 Application Module 업데이트

```typescript
// libs/lending/application/src/lib/lending-application.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LendingFacade } from './lending.facade';
import { PlaceOnHoldHandler } from './place-on-hold/place-on-hold.handler';
import { BookPlacedOnHoldEventHandler } from './event-handlers/book-placed-on-hold.event-handler';

const CommandHandlers = [PlaceOnHoldHandler];
const EventHandlers = [BookPlacedOnHoldEventHandler];

@Module({
  imports: [CqrsModule],
  providers: [LendingFacade, ...CommandHandlers, ...EventHandlers],
  exports: [LendingFacade],
})
export class LendingApplicationModule {}
```

### 2.8 Application 레이어 index.ts 업데이트

```typescript
// libs/lending/application/src/index.ts

// Facade
export * from './lib/lending.facade';

// Commands
export * from './lib/place-on-hold/place-on-hold.command';

// Ports
export * from './lib/ports/patron.repository';
export * from './lib/ports/book.repository';

// Module
export * from './lib/lending-application.module';
```

---

## 3단계: Infrastructure 레이어 구현

**위치**: `libs/lending/infrastructure/src/lib/`

**원칙**:
- Application 레이어의 Port 구현
- 기술적 세부사항 (ORM, HTTP 등)
- Domain과 Database 간 매핑

### 3.1 Database Entity 정의

```typescript
// libs/lending/infrastructure/src/lib/database/patron.entity.ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'patrons' })
export class PatronEntity {
  @PrimaryKey()
  id!: string;

  @Property()
  patronType!: string;

  @Property({ type: 'json' })
  holds!: Array<{
    bookId: string;
    libraryBranchId: string;
    holdTo?: string;
  }>;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

### 3.2 Repository 구현

```typescript
// libs/lending/infrastructure/src/lib/database/patron.repository.impl.ts
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { PatronRepository } from '@library/lending/application';
import { Patron, PatronId } from '@library/lending/domain';
import { PatronEntity } from './patron.entity';
import { PatronFactory } from '@library/lending/domain';

@Injectable()
export class PatronRepositoryImpl extends PatronRepository {
  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(patronId: PatronId): Promise<Patron | null> {
    const entity = await this.em.findOne(PatronEntity, { id: patronId.value });
    if (!entity) {
      return null;
    }
    return this.toDomain(entity);
  }

  async save(patron: Patron): Promise<void> {
    const entity = this.toEntity(patron);
    await this.em.persistAndFlush(entity);
  }

  private toDomain(entity: PatronEntity): Patron {
    // Entity → Domain 변환 로직
    // ...
  }

  private toEntity(patron: Patron): PatronEntity {
    // Domain → Entity 변환 로직
    // ...
  }
}
```

### 3.3 Migration 생성

```bash
# Migration 파일 생성
npx mikro-orm migration:create
```

```typescript
// apps/library/src/migrations/Migration20250129000000.ts
import { Migration } from '@mikro-orm/migrations';

export class Migration20250129000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS patrons (
        id VARCHAR(255) PRIMARY KEY,
        patron_type VARCHAR(50) NOT NULL,
        holds JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS patrons;');
  }
}
```

### 3.4 Infrastructure Module 업데이트

```typescript
// libs/lending/infrastructure/src/lib/lending-infrastructure.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PatronRepository } from '@library/lending/application';
import { PatronRepositoryImpl } from './database/patron.repository.impl';
import { PatronEntity } from './database/patron.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([PatronEntity]),
  ],
  providers: [
    {
      provide: PatronRepository,
      useClass: PatronRepositoryImpl,
    },
  ],
  exports: [PatronRepository],
})
export class LendingInfrastructureModule {}
```

---

## 4단계: UI 레이어 구현

**위치**: `libs/lending/ui-rest/src/lib/`

**원칙**:
- HTTP 요청을 Application 레이어로 전달
- DTO 검증
- 응답 포맷팅

### 4.1 DTO 정의

```typescript
// libs/lending/ui-rest/src/lib/dto/place-on-hold.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceOnHoldDto {
  @ApiProperty()
  @IsString()
  patronId!: string;

  @ApiProperty()
  @IsString()
  bookId!: string;

  @ApiProperty()
  @IsString()
  libraryBranchId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  numberOfDays?: number;
}
```

### 4.2 Controller 엔드포인트 추가

```typescript
// libs/lending/ui-rest/src/lib/lending.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LendingFacade } from '@library/lending/application';
import { PlaceOnHoldCommand } from '@library/lending/application';
import { PlaceOnHoldDto } from './dto/place-on-hold.dto';

@ApiTags('lending')
@Controller('lending')
export class LendingController {
  constructor(private readonly lendingFacade: LendingFacade) {}

  @Post('holds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place a book on hold' })
  async placeOnHold(@Body() dto: PlaceOnHoldDto): Promise<void> {
    const command = new PlaceOnHoldCommand(
      dto.patronId,
      dto.bookId,
      dto.libraryBranchId,
      dto.numberOfDays
    );
    return this.lendingFacade.placeOnHold(command);
  }
}
```

### 4.3 UI Module 업데이트

```typescript
// libs/lending/ui-rest/src/lib/lending-ui-rest.module.ts
import { Module } from '@nestjs/common';
import { LendingApplicationModule } from '@library/lending/application';
import { LendingInfrastructureModule } from '@library/lending/infrastructure';
import { LendingController } from './lending.controller';

@Module({
  imports: [
    LendingApplicationModule,
    LendingInfrastructureModule,
  ],
  controllers: [LendingController],
})
export class LendingUiRestModule {}
```

---

## 5단계: 통합 테스트 및 실행

### 5.1 데이터베이스 마이그레이션 실행

```bash
# PostgreSQL 시작
docker-compose up -d

# Migration 실행
npx mikro-orm migration:up
```

### 5.2 애플리케이션 실행

```bash
# 개발 모드로 실행
nx serve library

# 또는
npm start
```

### 5.3 E2E 테스트 작성

```typescript
// apps/library/src/app/lending.e2e.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';

describe('Lending E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should place book on hold', () => {
    return request(app.getHttpServer())
      .post('/lending/holds')
      .send({
        patronId: 'patron-1',
        bookId: 'book-1',
        libraryBranchId: 'branch-1',
        numberOfDays: 5,
      })
      .expect(201);
  });
});
```

### 5.4 API 수동 테스트

```bash
# cURL로 테스트
curl -X POST http://localhost:3000/lending/holds \
  -H "Content-Type: application/json" \
  -d '{
    "patronId": "patron-1",
    "bookId": "book-1",
    "libraryBranchId": "branch-1",
    "numberOfDays": 5
  }'
```

---

## 6단계: 검증 및 마무리

### 6.1 전체 테스트 실행

```bash
# 모든 단위 테스트
nx test

# 커버리지 포함
nx test lending-domain --coverage

# E2E 테스트
nx e2e library-e2e

# 린트 검사
nx lint library
```

### 6.2 코드 리뷰 체크리스트

**Domain 레이어:**
- [ ] Value Object가 불변인가?
- [ ] Aggregate가 불변식을 강제하는가?
- [ ] 비즈니스 로직이 Domain에 있는가?
- [ ] fp-ts Either 패턴을 올바르게 사용했는가?

**Application 레이어:**
- [ ] Command Handler가 조율만 하는가?
- [ ] Port가 Application 레이어에 정의되었는가?
- [ ] 트랜잭션 경계가 명확한가?

**Infrastructure 레이어:**
- [ ] Repository가 완전한 Aggregate를 로드하는가?
- [ ] Migration이 작성되었는가?

**UI 레이어:**
- [ ] DTO 검증이 적절한가?
- [ ] Swagger 문서가 작성되었는가?

### 6.3 문서화

- API 문서 (Swagger) 확인
- 복잡한 비즈니스 로직에 주석 추가
- README 업데이트

---

## 부록

### A. 체크리스트 요약

**Domain:**
- [ ] Value Objects
- [ ] Domain Events
- [ ] Entities
- [ ] Policy
- [ ] Aggregate 메서드
- [ ] Factory
- [ ] 단위 테스트
- [ ] index.ts

**Application:**
- [ ] Command
- [ ] Port
- [ ] Command Handler
- [ ] Handler 테스트
- [ ] Event Handler
- [ ] Facade
- [ ] Module
- [ ] index.ts

**Infrastructure:**
- [ ] Database Entity
- [ ] Repository
- [ ] Migration
- [ ] Module

**UI:**
- [ ] DTO
- [ ] Controller
- [ ] Module

**통합:**
- [ ] Migration 실행
- [ ] 애플리케이션 실행
- [ ] E2E 테스트
- [ ] 수동 테스트
- [ ] 전체 테스트
- [ ] 린트

---

이 가이드를 따라 단계별로 진행하면, DDD 원칙을 준수하며 Lending Context에 새로운 기능을 안전하게 추가할 수 있습니다.
