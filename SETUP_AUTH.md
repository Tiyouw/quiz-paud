# Setup Autentikasi Guru (SiKecilPintar)

Dokumen ini berisi langkah-langkah yang **harus dilakukan secara manual di Supabase Dashboard** setelah cabang `feat/teacher-auth` di-merge ke `main`. Tanpa langkah-langkah ini, fitur login dan pembatasan akses tidak akan bekerja.

---

## Bagian A - SQL RLS (jalankan di Supabase SQL Editor)

Tujuan: kunci semua operasi tulis (INSERT/UPDATE/DELETE) pada tabel `chapters`, `questions`, dan bucket storage `quiz-images` supaya hanya bisa dilakukan oleh user yang sudah login. Tabel `scores` tetap terbuka untuk INSERT (supaya anak-anak bisa menyimpan nilai tanpa login). SELECT tetap terbuka di semua.

Buka Supabase Dashboard -> SQL Editor -> New query, lalu tempel blok di bawah dan klik **Run**:

```sql
-- ============ TABEL: chapters ============
DROP POLICY IF EXISTS "chapters_select" ON public.chapters;
DROP POLICY IF EXISTS "chapters_insert" ON public.chapters;
DROP POLICY IF EXISTS "chapters_update" ON public.chapters;
DROP POLICY IF EXISTS "chapters_delete" ON public.chapters;

CREATE POLICY "chapters_select" ON public.chapters
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chapters_insert" ON public.chapters
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "chapters_update" ON public.chapters
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "chapters_delete" ON public.chapters
  FOR DELETE TO authenticated USING (true);

-- ============ TABEL: questions ============
DROP POLICY IF EXISTS "questions_select" ON public.questions;
DROP POLICY IF EXISTS "questions_insert" ON public.questions;
DROP POLICY IF EXISTS "questions_update" ON public.questions;
DROP POLICY IF EXISTS "questions_delete" ON public.questions;

CREATE POLICY "questions_select" ON public.questions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "questions_insert" ON public.questions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "questions_update" ON public.questions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "questions_delete" ON public.questions
  FOR DELETE TO authenticated USING (true);

-- ============ TABEL: scores ============
DROP POLICY IF EXISTS "scores_select" ON public.scores;
DROP POLICY IF EXISTS "scores_insert" ON public.scores;
DROP POLICY IF EXISTS "scores_update" ON public.scores;
DROP POLICY IF EXISTS "scores_delete" ON public.scores;

CREATE POLICY "scores_select" ON public.scores
  FOR SELECT TO anon, authenticated USING (true);
-- Anak-anak boleh submit nilai tanpa login
CREATE POLICY "scores_insert" ON public.scores
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Update/Delete cuma boleh oleh Guru
CREATE POLICY "scores_update" ON public.scores
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scores_delete" ON public.scores
  FOR DELETE TO authenticated USING (true);

-- ============ STORAGE: bucket 'quiz-images' ============
DROP POLICY IF EXISTS "quiz_images_select" ON storage.objects;
DROP POLICY IF EXISTS "quiz_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "quiz_images_update" ON storage.objects;
DROP POLICY IF EXISTS "quiz_images_delete" ON storage.objects;

CREATE POLICY "quiz_images_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'quiz-images');
CREATE POLICY "quiz_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'quiz-images');
CREATE POLICY "quiz_images_update" ON storage.objects
  FOR UPDATE TO authenticated
    USING (bucket_id = 'quiz-images')
    WITH CHECK (bucket_id = 'quiz-images');
CREATE POLICY "quiz_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'quiz-images');
```

Akan muncul peringatan "Query has destructive operations" karena ada `DROP POLICY`. Aman, klik **Run this query**. Yang dihapus hanya aturan izin, bukan data atau gambar.

---

## Bagian B - Membuat akun Guru (satu akun dipakai bersama)

1. Buka Supabase Dashboard -> **Authentication** -> **Users**.
2. Klik tombol **Add user** lalu pilih **Create new user**.
3. Isi:
   - **Email**: contohnya `guru@sikecilpintar.id` (pakai apa saja, ini cuma untuk login, tidak perlu email asli)
   - **Password**: pilih yang kuat, contoh `SiKecilPintar2025!`
   - Aktifkan toggle **Auto Confirm User** -> supaya tidak perlu verifikasi email.
4. Klik **Create user**.
5. Catat email + password tersebut dan bagikan ke guru-guru (maks 4 orang pakai akun sama).

Cara mengganti password:
- Authentication -> Users -> klik user -> menu `...` -> **Send password recovery** (kirim link reset ke email), atau
- Langsung ubah lewat Dashboard: klik user -> **Reset password**.

---

## Bagian C - Cara pakai di aplikasi

1. Buka website, klik tombol **"Masuk Guru"** di pojok kanan atas.
2. Masukkan email & password yang tadi dibuat.
3. Setelah login:
   - Tombol **Tambah Bab Baru**, ikon edit (✏️), hapus (🗑️), dan **Kelola Soal** muncul di halaman Pelajaran.
   - Halaman `/chapter/:id` ("Kelola Soal") bisa dibuka.
   - Tombol di pojok kanan atas berubah menjadi **"Keluar"**.
4. Anak-anak (tidak login) hanya melihat kartu bab + tombol **Mulai Quiz**. Semua tombol admin tersembunyi, dan membuka `/chapter/:id` langsung akan diarahkan ke halaman Login.

---

## Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Halaman Pelajaran / Quiz kosong setelah jalanin SQL | Policy SELECT untuk `anon` terhapus | Re-run Bagian A, pastikan tiap tabel punya policy `<table>_select` untuk `anon, authenticated` |
| Sudah login tapi "Tambah Bab" gagal | Policy INSERT untuk `authenticated` tidak ada | Jalankan ulang SQL di Bagian A |
| Tidak bisa login, muncul "Email atau kata sandi salah" | User belum dibuat di Supabase, atau Auto Confirm lupa diaktifkan | Cek Authentication -> Users; pastikan user ada dan statusnya confirmed |
| Setelah logout masih kelihatan tombol admin | Cache browser | Hard refresh (Ctrl+Shift+R / Cmd+Shift+R) |
| Upload gambar soal gagal padahal sudah login | Policy storage belum diupdate | Jalankan ulang blok `storage.objects` di Bagian A |

---

## Catatan keamanan

- Anon key Supabase tetap ada di repo (hardcoded di `src/supabaseClient.js`). Itu tidak masalah **selama RLS di Bagian A aktif** - anon key hanya bisa melakukan apa yang diizinkan policy.
- Jangan pernah commit `service_role` key. Yang boleh ada di frontend hanyalah `anon` key.
- Kalau ke depan mau fitur cheat-prevention (menyembunyikan kunci jawaban dari browser), bisa dibuat RPC function di Supabase yang menerima jawaban murid dan mengembalikan skor. Itu pekerjaan fase berikutnya.
