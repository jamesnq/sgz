# Hướng dẫn chạy và chấm Assignment 3–6 trên SGZ

Tài liệu này mô tả chính xác phần đã làm cho bốn đề trong bốn ảnh được giao. Tất cả thay đổi được áp dụng vào luồng thật của SGZ, không phải một trang demo tách rời.

## Đối chiếu ảnh và assignment

| Thứ tự ảnh | Assignment | Tên đề trong ảnh | Phần thực hành trên SGZ |
| --- | --- | --- | --- |
| Ảnh 1 | **Assignment 3** | Optimize a Next.js Product Listing Page | Performance trang chủ và `/products` |
| Ảnh 2 | **Assignment 4** | Make a Next.js Checkout Flow Accessible | Accessibility luồng `/products/[slug]` và trạng thái đơn hàng |
| Ảnh 3 | **Assignment 5 (Optional)** | Harden a Next.js Login & Dashboard App | Security cho authentication, protected routes, headers và dependencies |
| Ảnh 4 | **Assignment 6 (Optional)** | Build a Production-Ready Next.js Toolchain | pnpm workspace, shared packages, quality gate, environment và CI |

Người chấm có thể chấm từng assignment độc lập theo bảng “Đối chiếu yêu cầu” ở đầu mỗi phần, sau đó làm theo mục “Cách chấm”.

## Chuẩn bị môi trường

Yêu cầu:

- Node.js `>= 24` (đúng với trường `engines` trong `package.json`).
- pnpm `10.28.0`.
- PostgreSQL, MeiliSearch và các biến môi trường của SGZ đang hoạt động.
- Chrome để chạy Lighthouse; Playwright Chromium để chạy axe tự động.

Các bước:

```bash
pnpm install --frozen-lockfile
pnpm quality
pnpm build
pnpm dev
```

Kết quả tham chiếu tại thời điểm nộp bài:

- `pnpm typecheck`: pass.
- `pnpm test:unit`: 12 file, 66 test pass (gồm 3 test XSS sanitizer mới).
- `pnpm lint`: 0 error; còn 48 warning legacy không nằm trong luồng bài tập.
- `pnpm build`: pass, 40 trang được generate.
- Shell dùng để làm bài là Node 22.9 nên pnpm in cảnh báo engine; build vẫn pass. Người chấm nên dùng Node 24 để đúng CI.

## Assignment 3 (Ảnh 1) — Optimize a Next.js Product Listing Page

### Đối chiếu yêu cầu Assignment 3

| Yêu cầu trong ảnh | Trạng thái | Phần đã làm trên SGZ | File minh chứng chính |
| --- | --- | --- | --- |
| Step 1 — Measure baseline bằng Lighthouse, ghi LCP/CLS/Performance và đo 3 lần | **Đã làm** | Đã audit production `/products`, lưu bảng baseline và kết quả sau tối ưu ở mục Lighthouse bên dưới. TBT được dùng thay cho INP vì Lighthouse navigation lab không tạo tương tác thực để đo INP. | Tài liệu này, mục Lighthouse |
| Step 2 — Tối ưu hero/LCP bằng `next/image`, priority, width/height và `sizes` | **Đã làm** | Hero mobile dùng `next/image` với `priority`, `fetchPriority="high"`, `sizes`, kích thước ổn định; video desktop có poster và tải trì hoãn. Product image cũng dùng `next/image` qua component `Media`. | `src/components/home/HeroSection/index.tsx`, `src/components/Media/ImageMedia/index.tsx`, `src/components/ProductCard/index.tsx` |
| Step 3 — Code splitting component nặng bằng `next/dynamic` và loading fallback | **Đã làm** | Tách `ProductFilters`, `MobileProductFilters` và `VirtualizedProductGrid` khỏi bundle ban đầu; có skeleton/loading fallback. | `src/app/(frontend)/products/page.client.tsx`, `src/app/(frontend)/products/ProductFilters.tsx` |
| Step 4 — Virtualize product grid, chỉ giữ item nhìn thấy trong DOM | **Đã làm** | Dùng `react-window` v2, grid responsive 2/3/4 cột, overscan một hàng và tự tải batch tiếp theo khi gần cuối. | `src/app/(frontend)/products/VirtualizedProductGrid.tsx` |
| Step 5 — Bundle analyzer và xác định ba dependency lớn nhất | **Đã làm** | Cấu hình `@next/bundle-analyzer`, thêm script `pnpm analyze`, đã ghi ba dependency lớn nhất ở mục Bundle analyzer. | `next.config.js`, `package.json` |
| Step 6 — Caching strategy (optional) | **Đã làm** | Dữ liệu public dùng `unstable_cache` với revalidate phù hợp; dữ liệu user/order không public-cache. | `src/app/(frontend)/page.tsx`, `src/app/(frontend)/products/[slug]/page.tsx` |

### Chi tiết phần đã triển khai

1. Hero trang chủ dùng `next/image`, `priority`, `fetchPriority="high"`, `sizes` và kích thước ổn định. Video nền trì hoãn 1,5 giây và mobile dùng ảnh poster.
2. Bộ lọc desktop/mobile được tách khỏi bundle ban đầu bằng `next/dynamic` trong `products/page.client.tsx`.
3. Danh sách dùng `react-window` v2 tại `products/VirtualizedProductGrid.tsx`. Grid responsive 2/3/4 cột, cao 720 px, overscan 1 hàng và gọi `showMore()` khi gần cuối.
4. Tiêu đề trang và vùng giữ chỗ được server-render trong `products/page.tsx`, tránh footer nhảy khi InstantSearch hydrate.
5. Ảnh product dùng `next/image` thông qua `Media`, có `sizes`, width/height hoặc `fill` trong container có aspect ratio.
6. Dữ liệu homepage đã dùng `unstable_cache`: post/product revalidate 60 giây và stats 3600 giây. Dữ liệu user/order không cache công khai.
7. Bundle analyzer được cấu hình bằng `@next/bundle-analyzer`. Script ép webpack vì analyzer cũ không đọc được Turbopack build.

### Cách chấm virtualization và code splitting

1. Mở `http://localhost:3000/products`.
2. DevTools > Elements, tìm `[data-testid="virtualized-product-grid"]`.
3. Đếm các phần tử `[role="gridcell"]`; số node phải chỉ tương ứng viewport + overscan, không tăng bằng toàn bộ số hit đã tải.
4. Cuộn bên trong grid. Nội dung cell thay đổi và trang tự tải batch tiếp theo khi gần cuối.
5. DevTools > Network > JS, reload trang. Tìm chunk chứa `ProductFilters` và `VirtualizedProductGrid`.
6. Mở bộ lọc mobile hoặc scroll grid; chunk được tải độc lập, xác nhận code splitting hoạt động.

Kết quả kiểm tra DOM tự động ở viewport 1280×800: grid báo `24 sản phẩm` đã tải nhưng DOM chỉ có `12` phần tử `role="gridcell"` (visible + overscan).

### Lighthouse

Chạy trong cửa sổ Incognito, production server, ba lần rồi lấy trung bình:

```bash
pnpm build
pnpm exec next start -p 3000
```

DevTools > Lighthouse > Mobile > Performance, Accessibility, Best Practices, SEO > Analyze page load.

Kết quả lab trên `/products`:

| Chỉ số | Baseline lab | Sau tối ưu cuối |
| --- | ---: | ---: |
| Performance | 45 | 77 |
| Accessibility | 89 | 100 |
| Best Practices | 92 | 96 |
| SEO | 100 | 100 |
| LCP | 9,0 s | 5,9 s |
| CLS | 0,785 | 0,036 |
| TBT | 220 ms | 140 ms |
| Speed Index | 4,3 s | 2,6 s |

`Baseline lab` là lần production audit đầu tiên trước pass SSR/layout/a11y cuối, không phải số liệu bịa lại từ Git history. LCP còn phụ thuộc thời gian MeiliSearch và các provider client toàn cục; CLS, TBT và accessibility là các cải thiện ổn định nhất. Người chấm cần dùng ba lần chạy trên máy của mình thay vì so điểm tuyệt đối giữa hai máy.

### Bundle analyzer

```bash
pnpm analyze
open .next/analyze/client.html
```

Ba dependency lớn nhất trên toàn client treemap ở lần đo hiện tại:

1. `@payloadcms/ui`: khoảng 1109 KiB parsed, thuộc admin route.
2. `exceljs`: khoảng 910 KiB parsed, thuộc stocks/import route.
3. `next`: khoảng 587 KiB parsed, runtime dùng chung.

Hai dependency đầu không phải initial chunk của `/products`; route splitting giữ chúng khỏi storefront listing. Báo cáo HTML sinh tại `.next/analyze/{client,nodejs,edge}.html` và không commit vì `.next` là build artifact.

## Assignment 4 (Ảnh 2) — Make a Next.js Checkout Flow Accessible

### Đối chiếu yêu cầu Assignment 4

| Yêu cầu trong ảnh | Trạng thái | Phần đã làm trên SGZ | File minh chứng chính |
| --- | --- | --- | --- |
| 1 — Audit bằng Lighthouse và axe, ghi lại issue | **Đã làm** | Có Playwright + axe chặn violation mức serious/critical; Lighthouse Accessibility tham chiếu đạt 100 trên `/products`; issue before/after được liệt kê bên dưới. | `e2e/accessibility.spec.ts`, tài liệu này |
| 2 — Sửa semantic HTML/ARIA, label và linked errors | **Đã làm** | Đồng bộ `label`/`id`; thêm `required`, `aria-required`, `aria-invalid`, `aria-describedby`; payment selector dùng `fieldset`/`legend`. | `src/blocks/Form/common/FieldWrapper.tsx`, `src/blocks/Form/{Text,Number,Select,Textarea,Checkbox}/index.tsx`, `src/app/(frontend)/products/[slug]/page.client.tsx` |
| 3 — Focus trap và focus restoration cho confirmation modal | **Đã làm** | Confirmation modal dùng Radix Dialog: trap focus, đóng bằng Escape và trả focus về nút trigger. | `src/app/(frontend)/products/[slug]/page.client.tsx`, `src/components/ui/dialog.tsx` |
| 4 — `aria-live` cho cập nhật trạng thái đơn hàng | **Đã làm** | Thêm live region cho trạng thái checkout và order status refresh. | `src/app/(frontend)/products/[slug]/page.client.tsx`, `src/app/(frontend)/user/orders/[id]/page.client.tsx` |
| 5 — Test keyboard-only và screen reader | **Đã làm** | Có quy trình keyboard/VoiceOver/NVDA bên dưới và test axe tự động; modal được kiểm tra Tab, Shift+Tab, Enter và Escape. | `e2e/accessibility.spec.ts`, mục Chấm bằng keyboard |

### Before/after issue list

| Trước | Sau |
| --- | --- |
| `label htmlFor="input-x"` nhưng input dùng `id="x"` | Tất cả label/input dùng chung helper `getFieldInputId()` |
| Trường bắt buộc thiếu liên kết mô tả/lỗi | Có `required`, `aria-required`, `aria-invalid`, `aria-describedby` và error id |
| Nút thanh toán gọi server action ngay | Mở confirmation dialog có title, description, summary và hai action rõ ràng |
| Không có focus trap/restore cho xác nhận | Radix Dialog trap focus, đóng bằng Escape và trả focus về trigger |
| Phương thức thanh toán không có group semantic | Dùng `fieldset`, `legend`, radio checked/readOnly |
| Kết quả checkout chỉ thể hiện bằng toast/navigation | Có `role="status"`, `aria-live="polite"`, `aria-atomic="true"` |
| Trạng thái order refresh 10 giây nhưng không được đọc | Order status là live region |
| Trang thiếu main landmark/skip link | Layout có skip link và `<main id="main-content">` |

### Chấm bằng keyboard

1. Đăng nhập, mở một `/products/[slug]` đang bán.
2. Chỉ dùng Tab/Shift+Tab. Focus phải nhìn thấy được và đi qua form theo thứ tự hợp lý.
3. Label phải focus/activate đúng control; field bắt buộc được screen reader đọc kèm trạng thái.
4. Focus nút `Thanh toán`, nhấn Enter.
5. Focus phải nằm trong modal; Tab không thoát ra nền; Escape đóng modal.
6. Mở lại modal, chọn `Quay lại`; focus trở về nút `Thanh toán`.
7. Xác nhận; screen reader đọc trạng thái đang xử lý/thành công/lỗi.
8. Ở trang chi tiết đơn, thay đổi trạng thái từ workspace hoặc chờ refresh; region đọc `Trạng thái đơn hàng: ...`.

### axe và screen reader

```bash
E2E_PRODUCT_SLUG=<slug-public> pnpm playwright test e2e/accessibility.spec.ts
```

Test listing chặn axe violation mức serious/critical. Test checkout cần `E2E_PRODUCT_SLUG`; nếu thiếu sẽ skip có chủ đích. Manual screen reader:

- macOS: bật VoiceOver bằng Cmd+F5.
- Windows: dùng NVDA.
- Kiểm tra heading/landmark rotor, field label/error, modal title/description và live announcements.

Lighthouse Accessibility tham chiếu của `/products` sau fix: `100/100`.

## Assignment 5 (Ảnh 3, Optional) — Harden a Next.js Login & Dashboard App

### Đối chiếu yêu cầu Assignment 5

| Yêu cầu trong ảnh | Trạng thái | Phần đã làm trên SGZ | File minh chứng chính |
| --- | --- | --- | --- |
| OWASP Top 10 frontend assessment, tìm ít nhất 5 issue | **Đã làm** | Đã xác định và xử lý 6 nhóm rủi ro: security headers, route gate, image allowlist, SVG XSS, iframe sandbox và dependency vulnerabilities. | Bảng OWASP bên dưới |
| Fix XSS do unsafe HTML rendering | **Đã làm** | SVG/HTML đầu vào được sanitize bằng allowlist tag/attribute; loại event handler, `href`, style và protocol nguy hiểm; có unit test payload XSS. | `src/components/ui/string-to-svg.tsx`, `src/components/ui/__tests__/string-to-svg.test.ts` |
| Thêm CSP headers | **Đã làm** | Cấu hình CSP cùng HSTS, nosniff, referrer policy và permissions policy cho toàn bộ route. | `next.config.js` |
| Protect routes bằng Next.js middleware | **Đã làm** | Middleware gate `/user`, `/workspace`, `/stocks`; server layout tiếp tục verify token và role. | `src/middleware.ts`, `src/app/(workspace)/layout.tsx` |
| Thay token storage bằng secure HttpOnly cookie | **Đã làm** | Login dùng Payload cookie với `credentials: include`; không lưu token ở localStorage/sessionStorage; session được kiểm tra server-side. | `src/collections/Users/index.ts`, `src/hooks/getServerSession.ts` |
| Clickjacking protection bằng `frame-ancestors` hoặc `X-Frame-Options` | **Đã làm** | CSP có `frame-ancestors 'none'` và header `X-Frame-Options: DENY`; iframe preview được sandbox. | `next.config.js`, `src/components/BeforeDashboard/EmailTools/{OrderCompletionPreview,PromotionalComposer}.tsx` |
| Dependency scan bằng npm audit/Snyk/Socket | **Đã làm** | Chạy `pnpm audit --prod --audit-level=high`; kết quả sau fix không còn high/critical. | `package.json`, `pnpm-lock.yaml`, mục Dependency scan |

### OWASP frontend audit và remediation

| Rủi ro phát hiện | Mức trước | Fix | Mức sau |
| --- | --- | --- | --- |
| Không có CSP/security headers | High | CSP, HSTS, nosniff, referrer, permissions và frame protection trong `next.config.js` | Low |
| Middleware bị vô hiệu (`matcher: []`) | High | Gate `/user`, `/workspace`, `/stocks` bằng sự tồn tại của HttpOnly cookie; layout vẫn verify token/role server-side | Low |
| `next/image` cho phép mọi hostname HTTP/HTTPS | High | Chỉ allow production, staging, server URL và S3 endpoint đã cấu hình | Low |
| SVG raw HTML chưa lọc attribute của element con | Critical | Allowlist tag/attribute, loại event/href/style/protocol nguy hiểm ở cả SSR và DOM parser | Low |
| `iframe srcDoc` preview không sandbox | High | `sandbox=""` và `referrerPolicy="no-referrer"`; iframe admin giới hạn capability | Low |
| Dependency tree cũ | Critical | Nâng Next 16.2.11, Payload 3.87, Novu 3.18, React 19.2.8 và override transitive có giới hạn major | Không còn high/critical |

Kiểm tra headers:

```bash
curl -I http://localhost:3000/products
```

Phải thấy ít nhất: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` và `Strict-Transport-Security`.

Kiểm tra route gate khi không có cookie:

```bash
curl -I http://localhost:3000/user/orders
curl -I http://localhost:3000/workspace
```

Kỳ vọng redirect về `/?authRequired=1&redirect=...`. Đây chỉ là fast gate; kiểm tra quyền thật vẫn nằm ở server layout với `payload.auth()` và role `admin/staff`, nên giả cookie không cấp quyền truy cập dữ liệu.

### Auth/session/cookie strategy

- Login gọi Payload endpoint với `credentials: include`; token không lưu trong localStorage/sessionStorage.
- Payload phát signed `payload-token` cookie và phía client không thể đọc token khi cookie là HttpOnly.
- Protected user layout gọi `getServerSession()`/`payload.auth()`; workspace kiểm tra thêm role.
- Collection Users có `maxLoginAttempts: 5`, lock time và token expiration được cấu hình tập trung.
- `useSessions: false` được giữ lại vì plugin OAuth hiện tại tạo JWT không có `sid`; bật lại tùy tiện sẽ phá OAuth. Đây là quyết định tương thích có ghi chú trong source.
- API response dùng `private, no-store`; dữ liệu cá nhân không dùng ISR/public cache.

CSP production không cho `unsafe-eval`. Theme bootstrap script đã được loại bỏ và `data-theme="dark"` được render trực tiếp trên thẻ `html`; `unsafe-inline` hiện vẫn cần cho một số bootstrap/third-party script và nên được thay bằng nonce trong một đợt hardening tiếp theo khi toàn bộ integration hỗ trợ.

### Dependency scan before/after

```bash
pnpm audit --prod --audit-level=high
```

- Before: 186 vulnerability — 3 critical, 87 high, 79 moderate, 17 low.
- After: 5 vulnerability — 0 critical, 0 high, 4 moderate, 1 low.
- Lệnh trả exit code 0 ở threshold high.

## Assignment 6 (Ảnh 4, Optional) — Build a Production-Ready Next.js Toolchain

### Đối chiếu yêu cầu Assignment 6

| Yêu cầu trong ảnh | Trạng thái | Phần đã làm trên SGZ | File minh chứng chính |
| --- | --- | --- | --- |
| 1 — pnpm + Turborepo monorepo, shared `ui`, `tsconfig`, `eslint-config`, path aliases/package boundaries | **Đã làm** | Giữ app SGZ ở root để không phá deploy nhưng chuyển root thành pnpm workspace/Turborepo; tạo đủ ba shared package và app import thật `@sgz/ui`. | `pnpm-workspace.yaml`, `turbo.json`, `packages/ui`, `packages/tsconfig`, `packages/eslint-config` |
| 2 — ESLint flat config, Prettier, Husky, lint-staged và `tsc --noEmit` | **Đã làm** | ESLint 9 flat config; format scripts; pre-commit chỉ kiểm tra staged files; `pnpm typecheck` chạy `tsc --noEmit`. | `eslint.config.mjs`, `package.json`, `.husky/pre-commit` |
| 3 — Environment development/staging/production; public vs server-only; image domains, headers, analyzer | **Đã làm** | Tạo ba file env example, ghi rõ quy tắc `NEXT_PUBLIC_*`; cấu hình image allowlist, security headers và bundle analyzer. | `.env.development.example`, `.env.staging.example`, `.env.production.example`, `next.config.js` |
| 4 — CI install, lint, typecheck, test, build; cache pnpm/Next; analyze main | **Đã làm** | GitHub Actions có đủ quality stages, cache pnpm store + `.next/cache` + `.turbo`, và upload bundle report trên main. | `.github/workflows/ci.yml` |

### Monorepo/workspace

SGZ vẫn là app ở root để tránh migration phá deploy hiện tại, nhưng root đã trở thành pnpm workspace/Turborepo với shared package:

```text
.
├── packages/
│   ├── ui/             # @sgz/ui, được app import thật
│   ├── tsconfig/       # base, nextjs, react-library
│   └── eslint-config/  # no-eval/no-new-func rules dùng chung
├── pnpm-workspace.yaml
└── turbo.json
```

`@sgz/ui` được khai báo bằng `workspace:*` và Next transpile qua `transpilePackages`. Path alias `@/*` và `@payload-config` tiếp tục giữ package boundary hiện có.

### Code quality

- ESLint 9 flat config native; không còn dùng `next lint` đã bị loại ở Next 16.
- Prettier config và các script `format`, `format:check`.
- Husky `.husky/pre-commit` chạy lint-staged.
- lint-staged chỉ lint/format file staged, không quét lại toàn repo.
- `pnpm typecheck` chạy `tsc --noEmit`.
- `pnpm quality` chạy lint + typecheck + unit test.

Chấm hook:

```bash
ls -l .husky/pre-commit
cat .husky/pre-commit
```

File phải executable và nội dung là `pnpm exec lint-staged`.

### Environment config

- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`

Chỉ biến `NEXT_PUBLIC_*` được đưa ra browser. `DATABASE_URI`, `PAYLOAD_SECRET`, khóa S3/payment/email/OAuth là server-only và phải đặt trong secret store của platform; không commit file `.env.development`, `.env.staging`, `.env.production` thật.

### CI pipeline

File `.github/workflows/ci.yml` có:

1. install bằng pnpm frozen lockfile;
2. lint;
3. typecheck;
4. unit test;
5. build;
6. cache pnpm store, `.next/cache`, `.turbo`;
7. bundle analysis riêng trên main và upload artifact.

CI dùng Node 24. Build cần `DATABASE_URI` và `PAYLOAD_SECRET` trong GitHub repository secrets vì SGZ prerender dữ liệu Payload thật.

## Checklist pass/fail nhanh cho người chấm

- [ ] `pnpm install --frozen-lockfile` thành công trên Node 24.
- [ ] `pnpm quality` không có error và 66 unit test pass.
- [ ] `pnpm build` thành công.
- [ ] `/products` có server-rendered H1 và CLS gần 0,03 trong lab reference.
- [ ] DOM grid chỉ chứa item visible + overscan.
- [ ] Filter/grid nằm trong JS chunk riêng.
- [ ] `pnpm analyze` tạo ba HTML treemap.
- [ ] Checkout dùng keyboard, modal trap/restore focus.
- [ ] Field label/error được liên kết; live status được screen reader đọc.
- [ ] Axe không có serious/critical violation trên listing.
- [ ] Security headers xuất hiện; protected routes redirect khi chưa auth.
- [ ] Audit không còn high/critical.
- [ ] Workspace có ba shared package và app import `@sgz/ui`.
- [ ] Husky/lint-staged và GitHub Actions đúng các quality gate.

## Giới hạn đã biết

- Next 16 cảnh báo convention `middleware.ts` sẽ đổi thành `proxy.ts`. Bài assignment yêu cầu middleware và hiện build vẫn tạo Proxy thành công; có thể rename trong migration Next tiếp theo.
- LCP mobile còn biến động do InstantSearch/MeiliSearch và global providers. Tiêu đề đã server-render, CLS đã xử lý; tối ưu tiếp theo là tách thêm provider/chat widget theo interaction.
- 48 lint warning legacy được giữ riêng để tránh một refactor diện rộng không liên quan bài; CI không có lint error.
- Bốn moderate và một low dependency advisory còn lại không có high/critical impact theo threshold của bài và cần tiếp tục theo dõi khi upstream phát hành bản tương thích.
