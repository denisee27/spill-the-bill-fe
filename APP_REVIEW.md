# Spill the Bill — App Review & Findings
> Research only — no code changed. Tanggal: 17 Oktober 2026.

---

## 1. Autentikasi

### JWT & Cookie
- Token disimpan di `localStorage` (AuthProvider.jsx) → **rentan XSS**. Backend mengirim JWT via httpOnly cookie di production, tapi frontend juga menyimpannya di localStorage sebagai fallback. Seharusnya andalkan cookie saja.
- Cookie `maxAge` = 30 hari, JWT expiry = 7 hari → **mismatch**. Cookie bertahan jauh lebih lama dari token-nya.
- **Tidak ada refresh token**. Setelah 7 hari user harus login ulang. Tidak ada mekanisme auto-refresh.

### OTP
- OTP disimpan **in-memory** (`otp.store.js`) → hilang kalau server restart. Tidak bisa multi-instance.
- **Tidak ada rate limiting** pada endpoint `/auth/send-otp` → bisa di-spam.

### Role & Permission
- Hanya ada 2 role: `ADMIN` dan `USER`. Tidak ada granularity (misal admin gudang vs admin keuangan).

---

## 2. Flow Order

### Checkout → Order Creation
- Stock dicek **sebelum** transaksi DB (order.service.js L55-64), lalu transaksi dengan isolasi `Serializable` yang benar-benar mendekremen stok. Window TOCTOU tetap ada.
- Shipping fee dari frontend **langsung dipercaya** backend — jika user memanipulasi nilai, total order bisa salah. Backend harus re-kalkulasi sendiri.

### Payment Proof
- Upload payment proof → status `CHECKING_PAYMENT`.
- Admin verifikasi manual → `PAYMENT_APPROVED` atau `PAYMENT_REJECTED`.
- **Tidak ada notifikasi otomatis** ke user saat payment ditolak selain email.
- **Tidak ada workflow recovery**: jika ditolak, user harus upload ulang secara manual tanpa panduan jelas.

### Status Order
- Tidak ada tabel `OrderStatusHistory` → tidak bisa lihat kapan tiap status berubah (audit trail).
- User hanya bisa cancel order `PENDING_PAYMENT`. Setelah payment approved, tidak bisa cancel dari sisi user.

### Delivery Confirmation
- User bisa mark `SHIPPED` sebagai `DELIVERED` tanpa bukti apapun. Rentan klaim palsu.

---

## 3. Race Condition — KRITIS

### Voucher Usage (PALING KRITIS)
- Di `order.service.js` baris ~87: cek `usedCount >= maxUses`, lalu increment di baris ~155.
- **Dua order concurrent bisa sama-sama lolos cek** sebelum salah satu increment.
- Fix: gunakan DB-level atomic update — `UPDATE voucher SET usedCount = usedCount + 1 WHERE id = ? AND usedCount < maxUses RETURNING *`. Jika rows affected = 0, tolak.

### Cart Update Concurrent
- Optimistic update di frontend bisa conflict jika user buka dua tab/device secara bersamaan.

### Member Status Grant
- `getMemberProgress` bisa dipanggil concurrent dan double-grant membership. Minor karena idempotent, tapi tetap bisa bikin log ganda.

---

## 4. Membership System

- Member status diberikan saat order `PAYMENT_APPROVED`, **bukan** `DELIVERED`. Jika admin reject payment setelah approve (edge case), user tetap jadi member.
- Discount `discountPercent` ada di settings, tapi **belum diaplikasikan ke total order** (hanya free shipping yang diterapkan). Ini gap yang belum terimplementasi.
- Renewal cron job jalan tiap 00:05 UTC — tidak ada fallback jika job gagal.

---

## 5. Cart Flow

- `updateItem` di cart.service.js tidak re-validasi stok saat user naikkan quantity. User bisa update quantity ke 999 untuk produk stok 1.
- Frontend `addItem` (useCart.js) cek stok dari data cache — bisa stale jika stok berubah sejak terakhir fetch.

---

## 6. Review System

- **Tidak ada verifikasi** bahwa user yang review sudah benar-benar membeli dan menerima produk (`DELIVERED`). Siapapun yang login bisa review produk manapun.
- Review comment di-render tanpa HTML sanitization → **potensi XSS** jika konten dirender sebagai HTML.

---

## 7. Shipping

- Bergantung **100% pada RajaOngkir API** tanpa fallback dan tanpa caching. Kalau RajaOngkir down → checkout tidak bisa dilanjutkan.
- Tidak ada mekanisme retry jika request ke RajaOngkir timeout.
- Pertimbangkan cache biaya ongkir (Redis/memory) dengan TTL beberapa jam — harga jarang berubah dalam sehari.

---

## 8. Keamanan

| Area | Temuan | Severity |
|------|--------|----------|
| JWT Storage | localStorage vulnerable to XSS | 🔴 Tinggi |
| OTP Store | In-memory, tidak persisten | 🔴 Tinggi |
| Voucher Race | Check + increment tidak atomic | 🔴 Kritis |
| Shipping Fee | Frontend value dipercaya backend | 🟡 Tinggi |
| Review XSS | Content tidak di-sanitize | 🟡 Medium |
| Rate Limit OTP | Tidak ada | 🟡 Medium |
| File Upload | Tidak ada batas per-file (total 100MB) | 🟡 Medium |
| Review Auth | Tidak cek user pernah beli | 🟡 Medium |
| CORS | Origin dari env var, bisa misconfigured | 🟡 Medium |

---

## 9. Performa

### Query N+1 & Heavy Includes
- `findById` untuk order include: user, items (dengan product + variant), address, paymentProofs, refundRequest, refundDetail — **sangat berat** jika dipanggil dalam loop.
- Tidak ada pagination untuk order items.

### Missing Database Indexes
Schema tidak punya explicit indexes selain PK/unique. Yang seharusnya ditambah:

```prisma
model Order {
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
model CartItem {
  @@index([cartId])
}
model OrderItem {
  @@index([orderId])
}
model Review {
  @@index([productId])
  @@index([userId, productId])
}
model ProductVariant {
  @@index([productId])
}
```

Tanpa index ini, query `WHERE userId = ?` akan full table scan seiring data tumbuh.

### Tidak Ada Caching
- Tidak ada Redis/cache layer.
- Data yang jarang berubah (provinces, product catalog, member settings) di-query dari DB setiap request.

---

## 10. Arsitektur

### Kekuatan
- Separation of concerns rapi: Router → Controller → Service → Repository → Prisma
- Dependency injection via Awilix
- Zod validation di semua endpoint
- Centralized error handling
- React Query untuk state management frontend
- Optimistic updates di cart

### Kelemahan
- Tidak ada message queue (RabbitMQ/SQS) untuk async tasks — cron job langsung query DB
- Tidak ada soft delete untuk audit trail (produk dihapus permanen)
- Job renewal member tidak ada error tracking jika gagal
- OTP in-memory tidak production-ready untuk multi-instance deployment

---

## 11. Fitur yang Belum Ada / Gap

| Gap | Impact |
|-----|--------|
| Refresh token | User logout paksa setiap 7 hari |
| Order timeline/history timestamps | Tidak bisa audit kapan tiap status berubah |
| Cancel order setelah payment approved | User tidak bisa withdraw |
| Refund parsial | Return satu item dari banyak tidak bisa |
| Validasi review (harus sudah beli) | Review tidak kredibel |
| Discount member belum diaplikasikan ke total | Fitur sudah di-setting tapi tidak jalan |
| Fallback shipping API | Checkout mati kalau RajaOngkir down |
| Stock audit trail | Tidak ada history perubahan stok |
| Notifikasi in-app | Semua notif hanya email |
| 2FA untuk admin | Akun admin tidak ada lapisan keamanan ekstra |

---

## 12. Prioritas Perbaikan (High Impact dulu)

### 🔴 Segera
1. **Voucher race condition** — atomic check+increment di DB level
2. **Shipping fee validation** — backend harus re-kalkulasi, jangan percaya nilai dari frontend
3. **Discount member** — implement pengurangan `discountPercent` ke subtotal order

### 🟡 Jangka Pendek
4. **Database indexes** — tambahkan sesuai daftar di atas sebelum data tumbuh besar
5. **Stock re-validation di cart update** — cek stok saat user update quantity
6. **Review auth gate** — cek order DELIVERED sebelum izinkan review
7. **RajaOngkir fallback** — error handling yang lebih baik + cache

### 🔵 Jangka Menengah
8. **Refresh token** — user experience lebih baik
9. **OTP persistence** — pindah ke Redis atau DB agar survive restart
10. **OrderStatusHistory** — tracking kapan tiap status berubah
11. **Content sanitization** — DOMPurify di frontend untuk review/deskripsi produk
12. **Rate limiting** — terutama untuk `/send-otp` dan endpoint upload
