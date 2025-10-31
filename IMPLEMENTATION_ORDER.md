# Lending Context 구현 순서 가이드

**원칙: 의존성이 없는 것부터 → 의존성이 있는 것 순서로 구현**

> 이 가이드는 실제 프로젝트의 코드를 기반으로 작성되었습니다.
> 각 단계에서 실제 파일 경로와 구현해야 할 클래스/인터페이스만 명시합니다.

---

## 📋 구현 순서 요약

```
Phase 1: Domain Layer (순수 비즈니스 로직)
  1-1. Value Objects (의존성 없음)
  1-2. Domain Events (Value Objects 의존)
  1-3. Policy (Value Objects, Events 의존)
  1-4. Entities (Value Objects 의존)
  1-5. Aggregate Root (모든 Domain 요소 의존)
  1-6. Factory (Aggregate 의존)

Phase 2: Application Layer (유스케이스 조율)
  2-1. Ports (인터페이스 정의, Domain 의존)
  2-2. Commands (의존성 없음)
  2-3. Command Handlers (Domain, Ports, Commands 의존)
  2-4. Event Handlers (Domain Events 의존)
  2-5. Facade (Commands 의존)

Phase 3: Infrastructure Layer (기술 구현)
  3-1. Database Entities (의존성 없음)
  3-2. Repositories (Ports 구현, Domain, DB Entity 의존)
  3-3. Migrations (DB Entity 의존)

Phase 4: UI Layer (외부 인터페이스)
  4-1. DTOs (의존성 없음)
  4-2. Controllers (DTOs, Facade, Commands 의존)
```

---

## Phase 1: Domain Layer

> 위치: `libs/lending/domain/src/lib/`
>
> 원칙:
> - 프레임워크 독립적 (NestJS, TypeORM 등 사용 금지)
> - 순수 TypeScript + fp-ts만 사용
> - 외부 라이브러리: tiny-types, fp-ts만 허용

### 1-1. Value Objects (가장 먼저)

**의존성 순서:**

```
1. DateVO (의존성 없음)
   ↓
2. NumberOfDays (의존성 없음)
   ↓
3. PatronId, BookId, LibraryBranchId (Uuid 상속, 의존성 없음)
   ↓
4. HoldDuration (DateVO, NumberOfDays 의존)
   ↓
5. PatronType (의존성 없음)
   ↓
6. PatronInformation (PatronId, PatronType 의존)
   ↓
7. Hold (BookId, LibraryBranchId, DateVO 의존)
   ↓
8. PatronHolds (Hold 의존)
```

#### 📁 구현할 파일들

```
libs/lending/domain/src/lib/value-objects/
├── date.vo.ts                    # 1순위
├── number-of-days.ts             # 1순위
├── patron-id.ts                  # 2순위
├── book-id.ts                    # 2순위
├── library-branch-id.ts          # 2순위
├── hold-duration.ts              # 3순위 (DateVO, NumberOfDays 필요)
├── patron-type.ts                # 2순위
├── patron-information.ts         # 4순위 (PatronId, PatronType 필요)
├── hold.ts                       # 3순위 (BookId, LibraryBranchId, DateVO 필요)
└── patron-holds.ts               # 5순위 (Hold 필요)
```

#### 🎯 구현 체크리스트

**DateVO (`date.vo.ts`)**
- [ ] `DateVO` 클래스 (tiny-types 사용)
- [ ] `now()` static 메서드
- [ ] `of(string)` static 메서드
- [ ] `addDays(number)` 메서드
- [ ] `isBefore(DateVO)` 메서드

**NumberOfDays (`number-of-days.ts`)**
- [ ] `NumberOfDays` 클래스 (TinyTypeOf<number> 상속)
- [ ] 유효성 검증 (양수만 허용)

**PatronId, BookId, LibraryBranchId**
- [ ] `Uuid`를 상속 (`@library/shared/domain`에서 import)
- [ ] `generate()` static 메서드

**HoldDuration (`hold-duration.ts`)**
- [ ] private constructor(from: DateVO, to: DateVO | null)
- [ ] `closeEnded(days: NumberOfDays)` static 메서드
- [ ] `openEnded()` static 메서드
- [ ] `isOpenEnded()` 메서드
- [ ] 유효성 검증 (to >= from)

**PatronType (`patron-type.ts`)**
- [ ] `PatronType` 클래스 (TinyType 상속)
- [ ] `regular()` static 메서드
- [ ] `researcher()` static 메서드
- [ ] `isRegular()` 메서드

**PatronInformation (`patron-information.ts`)**
- [ ] constructor(patronId: PatronId, patronType: PatronType)
- [ ] `isRegular()` 메서드

**Hold (`hold.ts`)**
- [ ] constructor(bookId: BookId, libraryBranchId: LibraryBranchId, holdTo?: DateVO)
- [ ] `equals(other: Hold)` 메서드

**PatronHolds (`patron-holds.ts`)**
- [ ] private constructor(holds: Hold[])
- [ ] `MAX_NUMBER_OF_HOLDS` 상수 (= 5)
- [ ] `empty()` static 메서드
- [ ] `of(holds: Hold[])` static 메서드
- [ ] `numberOfHolds` getter
- [ ] `includes(book: BookOnHold)` 메서드
- [ ] `maximumHoldsAfterHoldingNextBook()` 메서드

---

### 1-2. Domain Events

**의존성 순서:**

```
1. PatronEvent (추상 클래스, PatronId, DateVO 의존)
   ↓
2. BookPlacedOnHold (PatronEvent, BookId, LibraryBranchId 의존)
3. BookHoldFailed (PatronEvent, Rejection 의존)
4. BookHoldCanceled
5. MaximumNumberOhHoldsReached
   ↓
6. BookPlacedOnHoldEvents (BookPlacedOnHold, MaximumNumberOhHoldsReached 의존)
```

#### 📁 구현할 파일들

```
libs/lending/domain/src/lib/events/
├── patron-event.ts                          # 1순위
├── book-placed-on-hold.ts                   # 2순위
├── book-hold-failed.ts                      # 2순위
├── book-hold-canceled.ts                    # 2순위
├── book-hold-canceling-failed.ts            # 2순위
├── maximum-number-on-holds-reached.ts       # 2순위
├── book-checked-out.ts                      # 2순위
├── book-check-out-failed.ts                 # 2순위
├── book-duplicate-hold-found.event.ts       # 2순위
└── book-placed-on-hold-events.ts            # 3순위
```

#### 🎯 구현 체크리스트

**PatronEvent (`patron-event.ts`)**
- [ ] abstract class (IEvent 구현)
- [ ] constructor(patronId: PatronId, when: DateVO)

**BookPlacedOnHold (`book-placed-on-hold.ts`)**
- [ ] PatronEvent 상속
- [ ] constructor(patronId, bookId, libraryBranchId, holdTo?: DateVO)

**BookHoldFailed (`book-hold-failed.ts`)**
- [ ] PatronEvent 상속
- [ ] constructor(reason: string, patronId, when)
- [ ] `bookHoldFailedNow(rejection: Rejection, patronId)` static 메서드

**BookPlacedOnHoldEvents (`book-placed-on-hold-events.ts`)**
- [ ] constructor(patronId, events: (BookPlacedOnHold | MaximumNumberOhHoldsReached)[])
- [ ] `event(patronId, bookPlacedOnHold)` static 메서드
- [ ] `events(patronId, bookPlacedOnHold, maxReached)` static 메서드

---

### 1-3. Policy

> 위치: `libs/lending/domain/src/lib/policies/`

#### 📁 구현할 파일

```
libs/lending/domain/src/lib/policies/
└── placing-on-hold-policy.ts
```

#### 🎯 구현 체크리스트

**PlacingOnHoldPolicy (`placing-on-hold-policy.ts`)**
- [ ] `PlacingOnHoldPolicy` 인터페이스 정의
  ```typescript
  (book: AvailableBook, patron: Patron, duration: HoldDuration)
    => Either<Rejection, Allowance>
  ```
- [ ] `Allowance` 클래스 (빈 클래스)
- [ ] `Rejection` 클래스
  - [ ] private constructor(reason: string)
  - [ ] `withReason(reason)` static 메서드
- [ ] `regularPatronMaximumNumberOfHoldsPolicy` 구현
  - [ ] patron.isRegular() && patron.numberOfHolds() >= MAX 체크
- [ ] `onlyResearcherPatronsCanPlaceOpenEndedHolds` 구현
  - [ ] patron.isRegular() && duration.isOpenEnded() 체크
- [ ] `allCurrentPolicies: Set<PlacingOnHoldPolicy>` 상수

---

### 1-4. Entities

> 위치: `libs/lending/domain/src/lib/book/`

**의존성 순서:**

```
1. Book 인터페이스 (BookId 의존)
   ↓
2. AvailableBook (Book 구현, LibraryBranchId, Version 의존)
   ↓
3. BookOnHold (Book 구현, PatronId 추가 의존)
```

#### 📁 구현할 파일들

```
libs/lending/domain/src/lib/book/
├── book.ts                       # 1순위
├── available-book.ts             # 2순위
└── book-on-hold.ts               # 3순위
```

#### 🎯 구현 체크리스트

**Book (`book.ts`)**
- [ ] interface 정의
- [ ] `bookId: BookId` 필드
- [ ] `version: Version` 필드

**AvailableBook (`available-book.ts`)**
- [ ] Book 인터페이스 구현
- [ ] constructor(bookId, libraryBranchId, version)
- [ ] `handleBookPlacedOnHold(event: BookPlacedOnHold): BookOnHold` 메서드

**BookOnHold (`book-on-hold.ts`)**
- [ ] Book 인터페이스 구현
- [ ] constructor(bookId, libraryBranchId, patronId, version)
- [ ] `by(patronId: PatronId): boolean` 메서드
- [ ] `handleHoldCanceled(event: BookHoldCanceled): AvailableBook` 메서드

---

### 1-5. Aggregate Root

> 위치: `libs/lending/domain/src/lib/patron.ts`

**의존성:** 모든 Domain 요소 (Value Objects, Events, Policy, Entities)

#### 🎯 구현 체크리스트

**Patron (`patron.ts`)**
- [ ] constructor(patronHolds, placingOnHoldPolicies, patronInformation)
- [ ] `placeOnHold(book: AvailableBook, duration: HoldDuration)` 메서드
  - [ ] `Either<BookHoldFailed, BookPlacedOnHoldEvents>` 반환
  - [ ] patronCanHold() 호출하여 policy 체크
  - [ ] maximumHoldsAfterHoldingNextBook() 체크
  - [ ] 성공 시 BookPlacedOnHoldEvents 반환 (단일 또는 복수 이벤트)
- [ ] `placeOnCloseEndedHold(book, duration)` 메서드
- [ ] `placeOnOpenEndedHold(book)` 메서드
- [ ] `cancelHold(book: BookOnHold)` 메서드
  - [ ] `Either<BookHoldCancelingFailed, BookHoldCanceled>` 반환
  - [ ] patronHolds.includes(book) 체크
- [ ] `checkoutBook(book: BookOnHold)` 메서드
  - [ ] `Either<BookCheckOutFailed, BookCheckedOut>` 반환
- [ ] private `patronCanHold(book, duration)` 메서드
  - [ ] `Option<Rejection>` 반환
  - [ ] 모든 policy를 순회하여 첫 번째 rejection 찾기
- [ ] `isRegular()` 메서드
- [ ] `numberOfHolds()` 메서드
- [ ] `hasOnHold(book: BookOnHold)` 메서드

**중요 패턴:**
```typescript
// maximumHoldsAfterHoldingNextBook()가 true인 경우
return right(
  BookPlacedOnHoldEvents.events(
    patronId,
    new BookPlacedOnHold(...),
    new MaximumNumberOhHoldsReached()
  )
);

// 일반적인 경우
return right(
  BookPlacedOnHoldEvents.event(
    patronId,
    new BookPlacedOnHold(...)
  )
);
```

---

### 1-6. Factory

> 위치: `libs/lending/domain/src/lib/factories/`

#### 📁 구현할 파일

```
libs/lending/domain/src/lib/factories/
└── patron.factory.ts
```

#### 🎯 구현 체크리스트

**PatronFactory (`patron.factory.ts`)**
- [ ] `create(patronInformation: PatronInformation): Patron` static 메서드
  - [ ] PatronHolds.empty() 생성
  - [ ] allCurrentPolicies 사용
  - [ ] new Patron() 반환
- [ ] `reconstitute(patronInformation, patronHolds): Patron` static 메서드
  - [ ] DB에서 로드한 데이터로 Patron 재구성

---

### 1-7. Domain Layer Export

> 위치: `libs/lending/domain/src/index.ts`

#### 🎯 체크리스트

- [ ] 모든 Value Objects export
- [ ] 모든 Events export
- [ ] Policy export
- [ ] Entities export
- [ ] Aggregate export
- [ ] Factory export

---

## Phase 2: Application Layer

> 위치: `libs/lending/application/src/lib/`
>
> 원칙:
> - NestJS 프레임워크 사용 가능 (@nestjs/cqrs, @nestjs/common)
> - Domain 레이어에 의존
> - Infrastructure를 직접 의존하지 않음 (Port로 추상화)

### 2-1. Ports (인터페이스 정의)

> 위치: `libs/lending/application/src/lib/ports/`

**순서:** Domain과 독립적으로 정의 가능

#### 📁 구현할 파일들

```
libs/lending/application/src/lib/ports/
├── patron.repository.ts
└── book.repository.ts
```

#### 🎯 구현 체크리스트

**PatronRepository (`patron.repository.ts`)**
- [ ] abstract class 정의
- [ ] `findById(patronId: PatronId): Promise<Option<Patron>>` abstract 메서드
- [ ] `publish(events: IEvent | IEvent[]): Promise<void>` abstract 메서드

**BookRepository (`book.repository.ts`)**
- [ ] abstract class 정의
- [ ] `save(book: Book): Promise<Result>` abstract 메서드

---

### 2-2. Commands

**순서:** Domain과 독립적

#### 📁 구현할 파일들

```
libs/lending/application/src/lib/
├── place-on-hold/
│   └── place-on-hold.command.ts
├── cancel-hold/
│   └── cancel-hold.command.ts
└── check-out/
    └── check-out-book.command.ts
```

#### 🎯 구현 체크리스트

**PlaceOnHoldCommand (`place-on-hold.command.ts`)**
- [ ] Command<Result> 상속 (@nestjs-architects/typed-cqrs)
- [ ] constructor(patron: PatronId, bookId: BookId, holdDuration: HoldDuration)

**CancelHoldCommand (`cancel-hold.command.ts`)**
- [ ] Command<Result> 상속
- [ ] constructor(patronId: PatronId, bookId: BookId)

**CheckOutBookCommand (`check-out-book.command.ts`)**
- [ ] Command<Result> 상속
- [ ] constructor(patronId: PatronId, bookId: BookId)

---

### 2-3. Helpers (선택적)

> 위치: 각 기능 폴더 내

#### 📁 구현할 파일들

```
libs/lending/application/src/lib/
├── place-on-hold/
│   └── find-available-book.ts
└── cancel-hold/
    └── find-book-on-hold.ts
```

#### 🎯 구현 체크리스트

**FindAvailableBook (`find-available-book.ts`)**
- [ ] @Injectable() 클래스
- [ ] constructor(bookRepository: BookRepository)
- [ ] `findAvailableBookById(bookId): Promise<Option<AvailableBook>>`

**FindBookOnHold (`find-book-on-hold.ts`)**
- [ ] @Injectable() 클래스
- [ ] constructor(bookRepository: BookRepository)
- [ ] `findBookOnHoldBy(bookId): Promise<Option<BookOnHold>>`

---

### 2-4. Command Handlers

**의존성:** Commands, Ports, Domain, Helpers

#### 📁 구현할 파일들

```
libs/lending/application/src/lib/
├── place-on-hold/
│   ├── place-on-hold.handler.ts
│   └── place-on-hold.handler.spec.ts
├── cancel-hold/
│   ├── cancel-hold.handler.ts
│   └── cancel-hold.handler.spec.ts
└── check-out/
    ├── check-out-book.handler.ts
    └── check-out-book.handler.spec.ts
```

#### 🎯 구현 체크리스트

**PlaceOnHoldHandler (`place-on-hold.handler.ts`)**
- [ ] @CommandHandler(PlaceOnHoldCommand) 데코레이터
- [ ] ICommandHandler<PlaceOnHoldCommand> 구현
- [ ] constructor(findAvailableBook, patronRepository)
- [ ] `execute(command): Promise<Result>` 메서드
  - [ ] findBook(command.bookId) - AvailableBook 조회
  - [ ] findPatron(command.patron) - Patron 조회
  - [ ] patron.placeOnHold(availableBook, command.holdDuration) - 도메인 로직 실행
  - [ ] fp-ts pipe, match 사용하여 결과 처리
  - [ ] publishOnSuccess() 또는 publishOnFail() 호출
- [ ] private `findBook(id)` 메서드
- [ ] private `findPatron(id)` 메서드
- [ ] private `publishOnSuccess(events)` 메서드
- [ ] private `publishOnFail(event)` 메서드

**CancelHoldHandler (`cancel-hold.handler.ts`)**
- [ ] @CommandHandler(CancelHoldCommand) 데코레이터
- [ ] 구조는 PlaceOnHoldHandler와 유사
- [ ] BookOnHold를 찾아서 patron.cancelHold() 호출
- [ ] 성공 시 bookOnHold.handleHoldCanceled()로 AvailableBook 생성
- [ ] bookRepository.save(availableBook) 호출

**CheckOutBookHandler (`check-out-book.handler.ts`)**
- [ ] @CommandHandler(CheckOutBookCommand) 데코레이터
- [ ] 구조는 CancelHoldHandler와 유사
- [ ] patron.checkoutBook() 호출

---

### 2-5. Event Handlers

**의존성:** Domain Events

#### 📁 구현할 파일들

```
libs/lending/application/src/lib/
├── book-placed-on-hold.event-handler.ts
├── book-hold-canceled.event-handler.ts
├── duplicate-hold.event.handler.ts
└── create-available-book-on-instance-added.event-handler.ts
```

#### 🎯 구현 체크리스트

**BookPlacedOnHoldEventHandler**
- [ ] @EventsHandler(BookPlacedOnHold) 데코레이터
- [ ] IEventHandler<BookPlacedOnHold> 구현
- [ ] `handle(event)` 메서드
  - [ ] 로깅
  - [ ] 읽기 모델 업데이트 (선택적)

**CreateAvailableBookOnInstanceAddedEventHandler**
- [ ] @EventsHandler(BookInstanceAddedToCatalogue) 데코레이터
- [ ] Catalogue Context의 이벤트 구독
- [ ] AvailableBook 생성 및 저장

---

### 2-6. Facade

> 위치: `libs/lending/application/src/lib/lending.facade.ts`

#### 🎯 구현 체크리스트

**LendingFacade (`lending.facade.ts`)**
- [ ] @Injectable() 데코레이터
- [ ] constructor(commandBus: CommandBus)
- [ ] `placeOnHold(command: PlaceOnHoldCommand): Promise<Result>` 메서드
- [ ] `cancelHold(command: CancelHoldCommand): Promise<Result>` 메서드
- [ ] `checkOut(command: CheckOutBookCommand): Promise<Result>` 메서드

---

### 2-7. Application Module

> 위치: `libs/lending/application/src/lib/lending-application.module.ts`

#### 🎯 구현 체크리스트

**LendingApplicationModule (`lending-application.module.ts`)**
- [ ] @Module() 데코레이터
- [ ] imports: [CqrsModule]
- [ ] providers: [LendingFacade, ...CommandHandlers, ...EventHandlers, ...Helpers]
- [ ] exports: [LendingFacade]

---

### 2-8. Application Layer Export

> 위치: `libs/lending/application/src/index.ts`

#### 🎯 체크리스트

- [ ] Facade export
- [ ] Commands export
- [ ] Ports export
- [ ] Module export

---

## Phase 3: Infrastructure Layer

> 위치: `libs/lending/infrastructure/src/lib/`
>
> 원칙:
> - TypeORM 사용 (Entity, Repository)
> - Application의 Port 구현
> - Domain ↔ Database Entity 변환

### 3-1. Database Entities

> 위치: `libs/lending/infrastructure/src/lib/typeorm/entities/`

**순서:** 독립적으로 정의 가능

#### 📁 구현할 파일들

```
libs/lending/infrastructure/src/lib/typeorm/entities/
├── patron.entity.ts              # 1순위
├── book.entity.ts                # 1순위
└── hold.entity.ts                # 1순위
```

#### 🎯 구현 체크리스트

**PatronEntity (`patron.entity.ts`)**
- [ ] @Entity('patrons') 데코레이터
- [ ] @PrimaryColumn() id: string
- [ ] @Column() patronType: string
- [ ] @CreateDateColumn() createdAt
- [ ] @UpdateDateColumn() updatedAt

**BookEntity (`book.entity.ts`)**
- [ ] @Entity('books') 데코레이터
- [ ] @PrimaryColumn() id: string
- [ ] @Column() libraryBranchId: string
- [ ] @Column() status: string (AVAILABLE | ON_HOLD | CHECKED_OUT)
- [ ] @Column({ nullable: true }) patronId?: string
- [ ] @Column() version: number
- [ ] @CreateDateColumn() createdAt
- [ ] @UpdateDateColumn() updatedAt

**HoldEntity (`hold.entity.ts`)**
- [ ] @Entity('holds') 데코레이터
- [ ] @PrimaryGeneratedColumn('uuid') id
- [ ] @Column() patronId: string
- [ ] @Column() bookId: string
- [ ] @Column() libraryBranchId: string
- [ ] @Column({ type: 'timestamp', nullable: true }) holdTo?: Date
- [ ] @CreateDateColumn() createdAt
- [ ] @Index(['patronId', 'bookId'], { unique: true })

---

### 3-2. Repositories

> 위치: `libs/lending/infrastructure/src/lib/typeorm/repositories/`

**의존성:** Database Entities, Domain, Application Ports

#### 📁 구현할 파일들

```
libs/lending/infrastructure/src/lib/typeorm/repositories/
├── patron.repository.ts
├── patron.repository.spec.ts
└── book.repository.ts
```

#### 🎯 구현 체크리스트

**PatronRepositoryImpl (`patron.repository.ts`)**
- [ ] @Injectable() 데코레이터
- [ ] PatronRepository (Application Port) 상속
- [ ] constructor(@InjectRepository(PatronEntity), @InjectRepository(HoldEntity), eventBus)
- [ ] `findById(patronId): Promise<Option<Patron>>` 구현
  - [ ] PatronEntity 조회
  - [ ] HoldEntity 조회 (patronId로)
  - [ ] toDomain() 변환
  - [ ] some(patron) 또는 none 반환
- [ ] `publish(events)` 구현
  - [ ] eventBus.publishAll(events) 호출
- [ ] private `toDomain(entity, holds): Patron` 메서드
  - [ ] PatronInformation 생성
  - [ ] PatronHolds 생성
  - [ ] PatronFactory.reconstitute() 호출

**BookRepositoryImpl (`book.repository.ts`)**
- [ ] @Injectable() 데코레이터
- [ ] constructor(@InjectRepository(BookEntity), @InjectRepository(HoldEntity))
- [ ] `save(book: Book): Promise<Result>` 구현
  - [ ] book instanceof AvailableBook 체크
    - [ ] BookEntity status=AVAILABLE로 저장
    - [ ] HoldEntity 삭제
  - [ ] book instanceof BookOnHold 체크
    - [ ] BookEntity status=ON_HOLD로 저장
    - [ ] HoldEntity 생성
- [ ] private `toBookEntity(book): BookEntity`
- [ ] private `toHoldEntity(book: BookOnHold): HoldEntity`

**FindAvailableBook 구현 (`book.repository.ts` 또는 별도 파일)**
- [ ] `findAvailableBookById(bookId): Promise<Option<AvailableBook>>` 구현
  - [ ] BookEntity 조회 (status=AVAILABLE)
  - [ ] toAvailableBook() 변환
- [ ] private `toAvailableBook(entity): AvailableBook`

**FindBookOnHold 구현**
- [ ] `findBookOnHoldBy(bookId): Promise<Option<BookOnHold>>` 구현
  - [ ] BookEntity + HoldEntity 조회 (JOIN)
  - [ ] toBookOnHold() 변환
- [ ] private `toBookOnHold(entity, hold): BookOnHold`

---

### 3-3. Migrations

> 위치: `apps/library/src/migrations/` (또는 프로젝트 설정에 따라)

#### 🎯 구현 체크리스트

**Migration 1: Patrons 테이블**
- [ ] CREATE TABLE patrons
  - [ ] id VARCHAR(255) PRIMARY KEY
  - [ ] patron_type VARCHAR(50) NOT NULL
  - [ ] created_at TIMESTAMP
  - [ ] updated_at TIMESTAMP

**Migration 2: Books 테이블**
- [ ] CREATE TABLE books
  - [ ] id VARCHAR(255) PRIMARY KEY
  - [ ] library_branch_id VARCHAR(255) NOT NULL
  - [ ] status VARCHAR(50) NOT NULL
  - [ ] patron_id VARCHAR(255)
  - [ ] version INT DEFAULT 0
  - [ ] created_at TIMESTAMP
  - [ ] updated_at TIMESTAMP
- [ ] CREATE INDEX idx_books_status
- [ ] CREATE INDEX idx_books_patron

**Migration 3: Holds 테이블**
- [ ] CREATE TABLE holds
  - [ ] id UUID PRIMARY KEY
  - [ ] patron_id VARCHAR(255) NOT NULL
  - [ ] book_id VARCHAR(255) NOT NULL
  - [ ] library_branch_id VARCHAR(255) NOT NULL
  - [ ] hold_to TIMESTAMP
  - [ ] created_at TIMESTAMP
- [ ] CREATE UNIQUE INDEX idx_holds_unique ON holds(patron_id, book_id)
- [ ] CREATE INDEX idx_holds_patron
- [ ] CREATE INDEX idx_holds_book

---

### 3-4. Infrastructure Module

> 위치: `libs/lending/infrastructure/src/lib/`

#### 📁 구현할 파일들

```
libs/lending/infrastructure/src/lib/
├── typeorm/
│   └── lending-typeorm.module.ts
└── lending-infrastructure.module.ts
```

#### 🎯 구현 체크리스트

**LendingTypeOrmModule (`lending-typeorm.module.ts`)**
- [ ] @Module() 데코레이터
- [ ] imports: [TypeOrmModule.forFeature([PatronEntity, BookEntity, HoldEntity])]
- [ ] providers: [PatronRepositoryImpl, BookRepositoryImpl, FindAvailableBook, FindBookOnHold]
- [ ] exports: 모든 providers

**LendingInfrastructureModule (`lending-infrastructure.module.ts`)**
- [ ] @Module() 데코레이터
- [ ] imports: [LendingApplicationModule, LendingTypeOrmModule]
- [ ] providers: [
  - [ ] { provide: PatronRepository, useExisting: PatronRepositoryImpl }
  - [ ] { provide: BookRepository, useExisting: BookRepositoryImpl }
- [ ] ]
- [ ] exports: [LendingApplicationModule]

---

## Phase 4: UI Layer

> 위치: `libs/lending/ui-rest/src/lib/`
>
> 원칙:
> - REST API 엔드포인트 제공
> - DTO 검증
> - Application Facade 호출

### 4-1. DTOs

> 위치: `libs/lending/ui-rest/src/lib/patron-profile/dtos/`

**순서:** 독립적으로 정의 가능

#### 📁 구현할 파일들

```
libs/lending/ui-rest/src/lib/patron-profile/dtos/
├── place-on-hold.dto.ts
├── cancel-hold.dto.ts
└── check-out.dto.ts
```

#### 🎯 구현 체크리스트

**PlaceOnHoldDto (`place-on-hold.dto.ts`)**
- [ ] @ApiProperty() 데코레이터 (Swagger용)
- [ ] @IsString() bookId: string
- [ ] @IsString() libraryBranchId: string
- [ ] @IsOptional() @IsNumber() numberOfDays?: number
- [ ] (patronId는 URL 경로에서 받음)

**CancelHoldDto (`cancel-hold.dto.ts`)**
- [ ] @IsString() libraryBranchId: string
- [ ] (patronId, bookId는 URL 경로에서)

**CheckOutDto (`check-out.dto.ts`)**
- [ ] @IsString() bookId: string
- [ ] @IsString() libraryBranchId: string

---

### 4-2. Controller

> 위치: `libs/lending/ui-rest/src/lib/patron-profile/`

#### 📁 구현할 파일

```
libs/lending/ui-rest/src/lib/patron-profile/
└── patron-profile.controller.ts
```

#### 🎯 구현 체크리스트

**PatronProfileController (`patron-profile.controller.ts`)**
- [ ] @Controller('patron-profile') 데코레이터
- [ ] @ApiTags('patron-profile') 데코레이터
- [ ] constructor(lendingFacade: LendingFacade)

**POST /:patronId/holds (예약)**
- [ ] @Post(':patronId/holds') 데코레이터
- [ ] @HttpCode(HttpStatus.CREATED)
- [ ] @ApiOperation({ summary: 'Place a book on hold' })
- [ ] async placeOnHold(
  - [ ] @Param('patronId') patronId: string
  - [ ] @Body() dto: PlaceOnHoldDto
- [ ] ): Promise<void>
- [ ] PatronId, BookId 등 Value Object 생성
- [ ] HoldDuration 생성 (dto.numberOfDays 사용)
- [ ] PlaceOnHoldCommand 생성
- [ ] lendingFacade.placeOnHold(command) 호출
- [ ] Result.Success이면 void 반환
- [ ] Result.Rejection이면 BadRequestException throw

**DELETE /:patronId/holds/:bookId (예약 취소)**
- [ ] @Delete(':patronId/holds/:bookId')
- [ ] @HttpCode(HttpStatus.NO_CONTENT)
- [ ] @ApiOperation({ summary: 'Cancel a hold' })
- [ ] async cancelHold(
  - [ ] @Param('patronId') patronId: string
  - [ ] @Param('bookId') bookId: string
  - [ ] @Body() dto: CancelHoldDto
- [ ] ): Promise<void>
- [ ] CancelHoldCommand 생성
- [ ] lendingFacade.cancelHold(command) 호출

**POST /:patronId/checkouts (대출)**
- [ ] @Post(':patronId/checkouts')
- [ ] @HttpCode(HttpStatus.CREATED)
- [ ] @ApiOperation({ summary: 'Check out a book' })
- [ ] async checkOut(
  - [ ] @Param('patronId') patronId: string
  - [ ] @Body() dto: CheckOutDto
- [ ] ): Promise<void>
- [ ] CheckOutBookCommand 생성
- [ ] lendingFacade.checkOut(command) 호출

---

### 4-3. UI Module

> 위치: `libs/lending/ui-rest/src/lib/`

#### 📁 구현할 파일들

```
libs/lending/ui-rest/src/lib/
├── patron-profile/
│   └── patron-profile.module.ts
└── lending-ui-rest.module.ts
```

#### 🎯 구현 체크리스트

**PatronProfileModule (`patron-profile.module.ts`)**
- [ ] @Module() 데코레이터
- [ ] imports: [LendingInfrastructureModule]
- [ ] controllers: [PatronProfileController]

**LendingUiRestModule (`lending-ui-rest.module.ts`)**
- [ ] @Module() 데코레이터
- [ ] imports: [PatronProfileModule]
- [ ] exports: [PatronProfileModule]

---

## Phase 5: 통합 및 테스트

### 5-1. Application Module 통합

> 위치: `apps/library/src/app/app.module.ts`

#### 🎯 체크리스트

- [ ] LendingUiRestModule import
- [ ] TypeORM 설정
- [ ] PostgreSQL 연결 설정

---

### 5-2. 테스트 작성 순서

**단위 테스트 (Unit Tests)**
1. [ ] Domain Layer 테스트
   - [ ] Value Objects 테스트
   - [ ] Patron 테스트 (patron.spec.ts)
   - [ ] Policy 테스트

2. [ ] Application Layer 테스트
   - [ ] PlaceOnHoldHandler 테스트
   - [ ] CancelHoldHandler 테스트
   - [ ] CheckOutBookHandler 테스트

3. [ ] Infrastructure Layer 테스트
   - [ ] PatronRepository 테스트

**통합 테스트 (Integration Tests)**
4. [ ] E2E 테스트
   - [ ] POST /patron-profile/:id/holds
   - [ ] DELETE /patron-profile/:id/holds/:bookId
   - [ ] POST /patron-profile/:id/checkouts

---

### 5-3. 실행 및 검증

```bash
# 1. 데이터베이스 시작
docker-compose up -d

# 2. 마이그레이션 실행
npm run migration:run

# 3. 테스트 실행
nx test lending-domain
nx test lending-application
nx test lending-infrastructure

# 4. 애플리케이션 실행
nx serve library

# 5. API 테스트
curl -X POST http://localhost:3000/patron-profile/patron-123/holds \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "book-456",
    "libraryBranchId": "branch-789",
    "numberOfDays": 5
  }'
```

---

## 📝 핵심 원칙 요약

### 1. 의존성 방향
```
UI Layer → Application Layer → Domain Layer
                ↑
         Infrastructure Layer
         (Domain의 Port 구현)
```

### 2. 구현 순서 원칙
1. **의존성이 없는 것부터** (Value Objects, Events)
2. **의존성이 적은 것 다음** (Policy, Entities)
3. **의존성이 많은 것 마지막** (Aggregate, Handlers)

### 3. 레이어별 순서
```
Domain (순수) → Application (조율) → Infrastructure (구현) → UI (인터페이스)
```

### 4. 테스트 전략
- Domain: 순수 단위 테스트 (모킹 없음)
- Application: Handler 테스트 (Repository 모킹)
- Infrastructure: Repository 테스트 (DB 모킹 또는 실제 DB)
- UI: E2E 테스트 (전체 통합)

---

## 🎓 추가 학습 자료

실제 구현 예제는 다음 파일들을 참고하세요:

**Domain:**
- `libs/lending/domain/src/lib/patron.ts`
- `libs/lending/domain/src/lib/policies/placing-on-hold-policy.ts`

**Application:**
- `libs/lending/application/src/lib/place-on-hold/place-on-hold.handler.ts`

**Infrastructure:**
- `libs/lending/infrastructure/src/lib/typeorm/repositories/patron.repository.ts`

**UI:**
- `libs/lending/ui-rest/src/lib/patron-profile/patron-profile.controller.ts`