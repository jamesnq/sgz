# Báo cáo bài thực hành Assignment 3 đến Assignment 6 trên dự án SGZ

Trong bài này, em áp dụng các nội dung đã học về performance, accessibility, security và production toolchain vào dự án Next.js SGZ hiện tại. Em thực hiện trực tiếp trên các luồng thật của dự án thay vì tạo trang demo riêng.

Tài liệu gồm hai mục đích:

1. Báo cáo những thay đổi em đã thực hiện cho từng assignment.
2. Cung cấp từng bước để người chấm có thể chạy lại và kiểm tra kết quả.

Thông tin bài nộp:

- Repository: `jamesnq/sgz`.
- Branch: `assignment`.
- Framework: Next.js 16, React 19 và Payload CMS 3.
- Package manager: pnpm.

## Chuẩn bị môi trường để chấm bài

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

Kết quả em ghi nhận tại thời điểm nộp bài:

- `pnpm typecheck`: pass.
- `pnpm test:unit`: 12 file, 66 test pass (gồm 3 test XSS sanitizer mới).
- `pnpm lint`: 0 error; còn 48 warning legacy không nằm trong luồng bài tập.
- `pnpm build`: pass, 40 trang được generate.
- Môi trường local em dùng Node 22.9 nên pnpm có cảnh báo engine, tuy nhiên build vẫn pass. Người chấm nên dùng Node 24 để đúng với cấu hình CI.

## Assignment 3: Optimize a Next.js Product Listing Page

### Mục tiêu

Mục tiêu của assignment này là đo performance ban đầu của trang danh sách sản phẩm, tối ưu LCP và layout shift, tách bundle, giảm số lượng product node trong DOM và kiểm tra lại kết quả sau tối ưu.

### Đối chiếu yêu cầu Assignment 3

| Yêu cầu của assignment | Kết quả | Phần em đã thực hiện | File minh chứng chính |
| --- | --- | --- | --- |
| Step 1: Đo baseline bằng Lighthouse, ghi LCP, INP, CLS, Performance và đo 3 lần | **Hoàn thành** | Em đã audit production route `/products`, sau đó lưu bảng baseline và kết quả sau tối ưu ở phần Lighthouse. Lighthouse navigation lab không tạo tương tác thực nên INP không có dữ liệu; em dùng TBT làm chỉ số phản ánh main-thread blocking trong lần đo lab. | Báo cáo này, phần Lighthouse |
| Step 2: Tối ưu hero và LCP bằng `next/image`, priority, width, height và `sizes` | **Hoàn thành** | Em dùng `next/image` cho hero mobile với `priority`, `fetchPriority="high"`, `sizes` và kích thước ổn định. Video desktop có poster và được tải trì hoãn. Product image cũng dùng `next/image` qua component `Media`. | `src/components/home/HeroSection/index.tsx`, `src/components/Media/ImageMedia/index.tsx`, `src/components/ProductCard/index.tsx` |
| Step 3: Code splitting component nặng bằng `next/dynamic` và loading fallback | **Hoàn thành** | Em tách `ProductFilters`, `MobileProductFilters` và `VirtualizedProductGrid` khỏi bundle ban đầu. Các component dynamic có skeleton hoặc loading fallback. | `src/app/(frontend)/products/page.client.tsx`, `src/app/(frontend)/products/ProductFilters.tsx` |
| Step 4: Virtualize product grid và chỉ giữ item nhìn thấy trong DOM | **Hoàn thành** | Em dùng `react-window` v2 với grid responsive 2, 3 hoặc 4 cột, overscan một hàng và tự tải batch tiếp theo khi gần cuối. | `src/app/(frontend)/products/VirtualizedProductGrid.tsx` |
| Step 5: Dùng bundle analyzer và xác định ba dependency lớn nhất | **Hoàn thành** | Em cấu hình `@next/bundle-analyzer`, thêm script `pnpm analyze` và ghi lại ba dependency lớn nhất ở phần Bundle analyzer. | `next.config.js`, `package.json` |
| Step 6: Thêm caching strategy | **Hoàn thành** | Em dùng `unstable_cache` với thời gian revalidate phù hợp cho dữ liệu public. Em không public-cache dữ liệu user và order. | `src/app/(frontend)/page.tsx`, `src/app/(frontend)/products/[slug]/page.tsx` |

### Báo cáo phần em đã thực hiện

1. Em dùng `next/image`, `priority`, `fetchPriority="high"`, `sizes` và kích thước ổn định cho hero trang chủ. Video nền được trì hoãn 1,5 giây và phiên bản mobile dùng poster tĩnh.
2. Em tách bộ lọc desktop và mobile khỏi bundle ban đầu bằng `next/dynamic` trong `products/page.client.tsx`.
3. Em dùng `react-window` v2 tại `products/VirtualizedProductGrid.tsx`. Grid hỗ trợ 2, 3 hoặc 4 cột, cao 720 px, overscan 1 hàng và gọi `showMore()` khi gần cuối.
4. Em server-render tiêu đề trang và vùng giữ chỗ trong `products/page.tsx` để tránh footer bị nhảy khi InstantSearch hydrate.
5. Em dùng `next/image` thông qua `Media` cho ảnh sản phẩm, có `sizes`, width, height hoặc `fill` trong container có aspect ratio.
6. Em dùng `unstable_cache` cho dữ liệu homepage. Post và product revalidate sau 60 giây, stats revalidate sau 3600 giây. Dữ liệu user và order không được cache công khai.
7. Em cấu hình `@next/bundle-analyzer`. Script analyze dùng webpack vì bundle analyzer hiện tại không đọc được Turbopack build.

### Hướng dẫn kiểm tra virtualization và code splitting

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

## Assignment 4: Make a Next.js Checkout Flow Accessible

### Mục tiêu

Mục tiêu của assignment này là làm cho luồng checkout có thể sử dụng bằng bàn phím và screen reader, đồng thời sửa các vấn đề semantic HTML, ARIA, focus management và thông báo trạng thái.

### Đối chiếu yêu cầu Assignment 4

| Yêu cầu của assignment | Kết quả | Phần em đã thực hiện | File minh chứng chính |
| --- | --- | --- | --- |
| 1: Audit bằng Lighthouse và axe, ghi lại issue | **Hoàn thành** | Em thêm Playwright và axe để chặn violation mức serious hoặc critical. Lighthouse Accessibility tham chiếu đạt 100 trên `/products`. Danh sách issue trước và sau được ghi bên dưới. | `e2e/accessibility.spec.ts`, báo cáo này |
| 2: Sửa semantic HTML, ARIA, label và linked errors | **Hoàn thành** | Em đồng bộ `label` và `id`, thêm `required`, `aria-required`, `aria-invalid`, `aria-describedby`. Payment selector dùng `fieldset` và `legend`. | `src/blocks/Form/common/FieldWrapper.tsx`, `src/blocks/Form/{Text,Number,Select,Textarea,Checkbox}/index.tsx`, `src/app/(frontend)/products/[slug]/page.client.tsx` |
| 3: Focus trap và focus restoration cho confirmation modal | **Hoàn thành** | Em dùng Radix Dialog cho confirmation modal để trap focus, hỗ trợ đóng bằng Escape và trả focus về nút trigger. | `src/app/(frontend)/products/[slug]/page.client.tsx`, `src/components/ui/dialog.tsx` |
| 4: Thêm `aria-live` cho cập nhật trạng thái đơn hàng | **Hoàn thành** | Em thêm live region cho trạng thái checkout và order status refresh. | `src/app/(frontend)/products/[slug]/page.client.tsx`, `src/app/(frontend)/user/orders/[id]/page.client.tsx` |
| 5: Test keyboard-only và screen reader | **Hoàn thành** | Em viết quy trình kiểm tra bằng bàn phím, VoiceOver hoặc NVDA và thêm test axe tự động. Modal được kiểm tra với Tab, Shift+Tab, Enter và Escape. | `e2e/accessibility.spec.ts`, phần hướng dẫn kiểm tra bằng bàn phím |

### Báo cáo vấn đề trước và sau khi sửa

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

### Hướng dẫn kiểm tra bằng bàn phím

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

## Assignment 5 (Optional): Harden a Next.js Login & Dashboard App

### Mục tiêu

Mục tiêu của assignment này là audit các rủi ro bảo mật phía frontend, xử lý XSS, thêm security headers, bảo vệ route, sử dụng cookie an toàn và kiểm tra dependency vulnerabilities.

### Đối chiếu yêu cầu Assignment 5

| Yêu cầu của assignment | Kết quả | Phần em đã thực hiện | File minh chứng chính |
| --- | --- | --- | --- |
| OWASP Top 10 frontend assessment, tìm ít nhất 5 issue | **Hoàn thành** | Em xác định và xử lý 6 nhóm rủi ro gồm security headers, route gate, image allowlist, SVG XSS, iframe sandbox và dependency vulnerabilities. | Bảng OWASP bên dưới |
| Fix XSS do unsafe HTML rendering | **Hoàn thành** | Em sanitize SVG và HTML đầu vào bằng allowlist tag và attribute. Sanitizer loại event handler, `href`, style và protocol nguy hiểm. Em cũng thêm unit test với payload XSS. | `src/components/ui/string-to-svg.tsx`, `src/components/ui/__tests__/string-to-svg.test.ts` |
| Thêm CSP headers | **Hoàn thành** | Em cấu hình CSP cùng HSTS, nosniff, referrer policy và permissions policy cho toàn bộ route. | `next.config.js` |
| Protect routes bằng Next.js middleware | **Hoàn thành** | Em dùng middleware để gate `/user`, `/workspace` và `/stocks`. Server layout vẫn tiếp tục verify token và role. | `src/middleware.ts`, `src/app/(workspace)/layout.tsx` |
| Thay token storage bằng secure HttpOnly cookie | **Hoàn thành** | Em dùng Payload cookie với `credentials: include` cho login, không lưu token ở localStorage hoặc sessionStorage và kiểm tra session ở server. | `src/collections/Users/index.ts`, `src/hooks/getServerSession.ts` |
| Clickjacking protection bằng `frame-ancestors` hoặc `X-Frame-Options` | **Hoàn thành** | Em thêm `frame-ancestors 'none'`, header `X-Frame-Options: DENY` và sandbox cho iframe preview. | `next.config.js`, `src/components/BeforeDashboard/EmailTools/{OrderCompletionPreview,PromotionalComposer}.tsx` |
| Dependency scan bằng npm audit, Snyk hoặc Socket | **Hoàn thành** | Em chạy `pnpm audit --prod --audit-level=high`. Kết quả sau khi sửa không còn vulnerability mức high hoặc critical. | `package.json`, `pnpm-lock.yaml`, phần Dependency scan |

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

- Before: 186 vulnerability, gồm 3 critical, 87 high, 79 moderate và 17 low.
- After: 5 vulnerability, gồm 0 critical, 0 high, 4 moderate và 1 low.
- Lệnh trả exit code 0 ở threshold high.

## Assignment 6 (Optional): Build a Production-Ready Next.js Toolchain

### Mục tiêu

Mục tiêu của assignment này là xây dựng cấu trúc workspace có shared packages, thiết lập quality gate cho local và CI, phân tách environment configuration và hỗ trợ bundle analysis trong quy trình build.

### Đối chiếu yêu cầu Assignment 6

| Yêu cầu của assignment | Kết quả | Phần em đã thực hiện | File minh chứng chính |
| --- | --- | --- | --- |
| 1: pnpm và Turborepo monorepo, shared `ui`, `tsconfig`, `eslint-config`, path aliases và package boundaries | **Hoàn thành** | Em giữ app SGZ ở root để không phá quy trình deploy hiện tại, sau đó chuyển root thành pnpm workspace và Turborepo. Em tạo đủ ba shared package và dùng `@sgz/ui` trong app. | `pnpm-workspace.yaml`, `turbo.json`, `packages/ui`, `packages/tsconfig`, `packages/eslint-config` |
| 2: ESLint flat config, Prettier, Husky, lint-staged và `tsc --noEmit` | **Hoàn thành** | Em cấu hình ESLint 9 flat config, format scripts và pre-commit hook chỉ kiểm tra staged files. `pnpm typecheck` chạy `tsc --noEmit`. | `eslint.config.mjs`, `package.json`, `.husky/pre-commit` |
| 3: Environment development, staging, production, public và server-only variables, image domains, headers, analyzer | **Hoàn thành** | Em tạo ba file env example, ghi rõ quy tắc `NEXT_PUBLIC_*`, cấu hình image allowlist, security headers và bundle analyzer. | `.env.development.example`, `.env.staging.example`, `.env.production.example`, `next.config.js` |
| 4: CI install, lint, typecheck, test, build, cache pnpm và Next, analyze main | **Hoàn thành** | Em tạo GitHub Actions có đủ quality stages, cache pnpm store, `.next/cache`, `.turbo` và upload bundle report trên main. | `.github/workflows/ci.yml` |

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

## Kết luận

Em đã hoàn thành bốn assignment trên cùng dự án SGZ và giữ các thay đổi trong branch `assignment`. Kết quả chính gồm trang product listing được tối ưu và virtualize, checkout có semantic và focus management tốt hơn, ứng dụng có thêm các lớp bảo vệ security, cùng với workspace và CI quality gate có thể chạy lại.

Người chấm có thể dùng bảng đối chiếu của từng assignment để xem file minh chứng, sau đó dùng phần hướng dẫn kiểm tra và checklist tổng để xác nhận kết quả.

## Giới hạn em ghi nhận

- Next 16 cảnh báo convention `middleware.ts` sẽ đổi thành `proxy.ts`. Bài assignment yêu cầu middleware và hiện build vẫn tạo Proxy thành công; có thể rename trong migration Next tiếp theo.
- LCP mobile còn biến động do InstantSearch/MeiliSearch và global providers. Tiêu đề đã server-render, CLS đã xử lý; tối ưu tiếp theo là tách thêm provider/chat widget theo interaction.
- 48 lint warning legacy được giữ riêng để tránh một refactor diện rộng không liên quan bài; CI không có lint error.
- Bốn moderate và một low dependency advisory còn lại không có high/critical impact theo threshold của bài và cần tiếp tục theo dõi khi upstream phát hành bản tương thích.
