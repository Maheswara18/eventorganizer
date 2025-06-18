# Event Organizer App

Aplikasi Event Organizer ini dikembangkan menggunakan **Laravel (PHP)** sebagai backend dan **Ionic (Angular)** sebagai frontend. Aplikasi ini memungkinkan pengguna untuk mendaftar event, melakukan pembayaran, check-in melalui QR Code, dan mendapatkan sertifikat kehadiran.

---

## ⚙️ Struktur Proyek

    ```
    SistemEventOrganizer
    ├── app/
    ├── bootstrap/
    ├── config/
    ├── database/
    ├── frontend/    # Ionic
    ├── public/
    ├── resources/
    ├── routes/
    ├── storage/
    ├── test/
    ├── .editorconfig
    ├── .env
    ├── .env.example
    ├── .gitattributes
    ├── .gitgore
    ├── artisan
    ├── composer.json
    ├── composer.lock
    ├── endpoint_baca.txt
    ├── package-lock.json
    ├── package.json
    ├── phpunit.xml
    ├── README.md
    └── vite.config.js
    ```

## 🚀 Instalasi

### Imagick (Backend)
1. Untuk menginstall Imagick bisa diikuti langkah yang ada di link dibawah ini:

    ```bash
    https://mlocati.github.io/articles/php-windows-imagick.html
    ```
    Disarankan untuk menggunakan PHP versi 8.2 atau 8.1 (lebih banyak imagick build tersedia)
### Backend (Laravel)

1. Clone repositori ini:

   ```bash
   git clone https://github.com/Maheswara18/eventorganizer.git
   cd eventorganizer
   ```

2. Install depedensi Laravel

    ```bash
    composer install
    ```
    Proses ini cukup lama dan memakan cukup banyak internet jadi pastikan siapkan internet yang baik.

3. Duplikat file environment

    ```bash
    cp .env.example .env
    ```


4. Atur konfigurasi database di file .env

    contoh
    ```bash
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=(nama database)
    DB_USERNAME=root
    DB_PASSWORD=
    ```

5. Generate application key

    ```bash
    php artisan key:generate
    ```

6. Jalankan migrasi

    ```bash
    php artisan migrate
    ```

7. Jalankan server lokal

    ```bash
    php artisan serve
    ```

### Frontend (Ionic + Angular)

1. Buka file frontend di kode editor yang baru (jadi kita menjalankan vscode 2 sekaligus 1 untuk backend dan 1 untuk ionic)

    ```bash
    cd ../frontend
    ```

2. install dependensi

    ```bash
    npm install
    ```

3. Jalankan Ionic

    ```bash
    ionic serve
    ```


## 🔄 Alur Bekerjasama Menggunakan GitHub

### 1. Masuk ke Folder Project

Buka terminal dengan cara

    klik kanan di folder SistemEventOrganizer lalu open terminal here

atau

    klik kanan dan Open Git Bash Here

cara lain

search cmd lalu jalankan perintah

    cd C:/Path/SistemEventOrganizer


### 2. Cek Status Project

Gunakan perintah ini untuk melihat apakah ada file yang berubah atau update dari tim lain:

    git status


Jika muncul pesan seperti:

    Your branch is behind 'origin/main' by 2 commits.

Berarti ada perubahan terbaru dari tim yang belum kamu ambil.

### 3. Ambil Update Terbaru dari GitHub

Untuk menyinkronkan dengan versi terbaru di GitHub, jalankan:

    git pull origin main

## ✍️ Menyimpan dan Mengirim Perubahan ke GitHub

Setelah kamu mengedit atau menambahkan file ke project, lakukan langkah-langkah berikut:

### 1. Cek Perubahan

    git status

### 2. Tambahkan Semua Perubahan

    git add .

### 3. Commit Perubahan

Buat commit dengan pesan yang jelas:

    git commit -m "Deskripsikan perubahan yang kamu buat"

Contoh:

    git commit -m "Menambahkan fitur login di frontend dan API auth di backend"

### 4. Push ke GitHub

Kirim perubahan ke repository GitHub:

    git push origin main

    ---

## 💡 Tips Kolaborasi Tim

- ✅ Selalu jalankan `git pull origin main` sebelum memulai kerja.
- ✅ Gunakan pesan commit yang jelas dan singkat.
- ✅ Gunakan branch baru jika ingin mengerjakan fitur secara terpisah.
- ✅ Gunakan `.gitignore` agar file yang tidak penting tidak ikut ke GitHub (misalnya: `node_modules`, `.env`, `vendor/`, dll).

---

Semoga panduan ini membantu semua anggota tim untuk bekerjasama dengan lancar dan rapi 🚀