# MaouEdu AI Video Studio (MC Raja Iblis • Gaya B)

AI Educational Video Generator bergaya TikTok (`9:16`) dengan **1-Prompt Auto-Research**, presenter konsisten **MC Raja Iblis (Maou Vaelen)**, suara cowok ElevenLabs (`cPoqAvGWCPfCfyPMwe4z`) + fallback bariton gratis, rumus storytelling **`Trial → TAPI... → JADI... → SELAMAT!`**, dan subtitle kotak kuning ala `@untabiru5`.

## Fitur Utama
- **1-Prompt to Video:** Cukup ketik prompt seperti `"bikin vid tentang buat aquarium ikan arwana"` → sistem otomatis riset online (Wikipedia ID/EN + DuckDuckGo), menyusun skrip edukasi MC Raja Iblis, merekam suara cowok per scene, dan langsung memutar/merender video 9:16 siap download.
- **Character Bible Terkunci (Copyright-Safe):** Maou Vaelen (Modern Overlord) dengan rambut *ash-silver* + *crimson streak*, tanduk asimetris (kiri patah bercahaya merah), *long coat* hitam-emas, dan aura bayangan tipis.
- **Vercel Ready:** Menggunakan static frontend di `public/` dan stateless Vercel Serverless Functions di `api/`.

## Menjalankan Secara Lokal
```bash
npm start
# Buka http://localhost:3000
```

## Deploy ke Vercel
1. Hubungkan repository GitHub ini di [Vercel](https://vercel.com/new).
2. (Opsional) Tambahkan Environment Variables di Vercel Project Settings:
   - `GEMINI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID=cPoqAvGWCPfCfyPMwe4z`
3. Deploy!
