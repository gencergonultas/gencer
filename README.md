# Türk Dizi Fragmanları Web Sitesi

YouTube'dan otomatik olarak Türk dizi fragmanlarını toplayan modern ve responsive web uygulaması.

## 🎬 Özellikler

- **Otomatik Video Toplama**: YouTube API kullanarak en yeni Türk dizi fragmanlarını otomatik olarak çeker
- **Platform Filtreleme**: Netflix, BluTV, Exxen, Show TV gibi platformlara göre filtreleme
- **Gelişmiş Arama**: Dizi adı, kanal adı veya açıklamaya göre arama
- **Sıralama Seçenekleri**: Tarihe, izlenme sayısına veya başlığa göre sıralama
- **Otomatik Yenileme**: 5 dakikada bir otomatik olarak yeni videoları kontrol eder
- **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu
- **PWA Desteği**: Progressive Web App olarak yüklenebilir
- **Offline Desteği**: Service Worker ile offline kullanım

## 🚀 Kurulum

### 1. Dosyaları İndirin
Tüm dosyaları bir klasöre kopyalayın:
- `index.html`
- `style.css`
- `script.js`
- `manifest.json`
- `sw.js`
- `README.md`

### 2. YouTube API Anahtarı Alın

1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin
2. Yeni bir proje oluşturun veya mevcut projeyi seçin
3. YouTube Data API v3'ü etkinleştirin
4. API anahtarı oluşturun

### 3. API Anahtarını Ayarlayın

`script.js` dosyasını açın ve şu satırı bulun:
```javascript
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE';
```

`YOUR_YOUTUBE_API_KEY_HERE` yerine aldığınız API anahtarını yazın:
```javascript
const YOUTUBE_API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

### 4. Web Sunucusunda Çalıştırın

Dosyaları bir web sunucusunda çalıştırmanız gerekiyor (doğrudan dosya açma CORS hatalarına neden olabilir). 

**Kolay yöntemler:**

#### Python ile:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js ile:
```bash
npx http-server
```

#### PHP ile:
```bash
php -S localhost:8000
```

Sonra tarayıcınızda `http://localhost:8000` adresine gidin.

## 📱 PWA Kurulumu

1. Web sitesini tarayıcınızda açın
2. Adres çubuğundaki "Yükle" butonuna tıklayın (Chrome)
3. Veya menüden "Ana ekrana ekle" seçeneğini seçin
4. Artık uygulamayı ana ekranınızdan açabilirsiniz

## 🎯 Kullanım

### Ana Özellikler

- **Filtreleme**: Üst menüden platform filtrelerini kullanın
- **Arama**: Arama kutusuna dizi adı yazarak arama yapın
- **Sıralama**: Sağ üstteki sıralama seçeneklerini kullanın
- **Yenileme**: "Yenile" butonu ile manuel yenileme yapın
- **Otomatik Yenileme**: Checkbox ile 5 dakikada bir otomatik yenileme açın

### Video İzleme

- Herhangi bir video kartına tıklayarak YouTube'da izleyin
- Video kartları hover efekti ile etkileşimli

## 🔧 Özelleştirme

### Arama Terimlerini Değiştirme

`script.js` dosyasındaki `SEARCH_TERMS` dizisini düzenleyerek hangi terimlerle arama yapılacağını değiştirebilirsiniz:

```javascript
const SEARCH_TERMS = [
    'türk dizi fragman',
    'türk dizisi trailer',
    'netflix türk dizi',
    // Yeni terimler ekleyin
    'kendi arama teriminiz'
];
```

### Platform Etiketlerini Değiştirme

`PLATFORM_TAGS` nesnesini düzenleyerek platform isimlerini değiştirebilirsiniz:

```javascript
const PLATFORM_TAGS = {
    'netflix': 'Netflix',
    'blutv': 'BluTV',
    // Yeni platformlar ekleyin
    'yeni_platform': 'Yeni Platform'
};
```

### Renk Temasını Değiştirme

`style.css` dosyasındaki CSS değişkenlerini düzenleyerek renk temasını değiştirebilirsiniz:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* Renklerinizi buraya ekleyin */
}
```

## 📊 API Limitleri

YouTube API'nin günlük limitleri vardır:
- Ücretsiz kullanım: Günde 10,000 birim
- Her arama işlemi: ~100 birim
- Önerilen kullanım: Günde maksimum 100 arama

## 🐛 Sorun Giderme

### CORS Hatası
- Dosyaları bir web sunucusunda çalıştırdığınızdan emin olun
- Doğrudan dosya açma yerine HTTP sunucusu kullanın

### API Anahtarı Hatası
- API anahtarının doğru kopyalandığından emin olun
- YouTube Data API v3'ün etkinleştirildiğini kontrol edin
- API limitlerini aşmadığınızdan emin olun

### Video Yüklenmiyor
- İnternet bağlantınızı kontrol edin
- Tarayıcı konsolunda hata mesajlarını kontrol edin
- Demo modunda çalışıp çalışmadığını test edin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📞 İletişim

Sorularınız için issue açabilir veya iletişime geçebilirsiniz.

---

**Not**: Bu proje eğitim amaçlıdır. YouTube API kullanım şartlarına uygun olarak kullanın.
