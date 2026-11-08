# SOCIAL REHABILITĀCIJAS SISTĒMA - DARBĪBAS PLĀNS

## MĒRĶIS
Izveidot sociālās rehabilitācijas nodarbību uzskaites sistēmu. Dizains paliek tumšs.

## PRINCIPI
- [x] Dizains netiek mainīts
- [x] GitHub Pages tikai frontend
- [x] Google Sheets caur Apps Script (code.gs lokāli, deploy manuāli)
- [x] Pieteikšanās ar kopējo paroli + PIN
- [x] Tiesības pēc lomas (ADMIN sadaļas slēptas USER)
- [x] Kreisā navigācija

## BLOKI
- [x] 1. Kopīgais izkārtojums: `js/layout.js`, stili
- [x] 2. Sākums: `pages/sakums.html`, `js/sakums.js`, `css/sakums.css`
- [x] 3. Jauna nodarbība: `pages/jauna-nodarbiba.html`, `js/jauna-nodarbiba.js`, kaskāde/validācija/saglabāšana
- [x] 4. Klienti: `pages/klienti.html`, `pages/klienta-profilis.html`, `js/klienti.js`, `js/klienta-profilis.js`, `css/klienti.css`
- [x] 5. Nodarbību vēsture: `pages/nodarbibu-vesture.html`, `js/nodarbibu-vesture.js`, `css/nodarbibu-vesture.css` (labot-ierakstu atsevišķa lapa vēl var tikt pievienota)
- [x] 6. ADMIN: `pages/kaskades.html`, `pages/lietotaji.html`, `pages/iestatijumi.html` + atbilstošie js/css
- [x] Testi: `tests/structure-test.js` (38/38 PASS), `tests/e2e-api-test.js`, `pages/test.html`/`js/test.js`

## TESTA DATI (seedTestData)
- Versija 2.0: testa dati netiek ievietoti automātiski.
- Lietotājs veido datus patstāvīgi caur Kaskādēm (ADMIN):
  1. Nodarbības veidi (sakne slānis)
  2. Mērķi (saistīti ar nodarbības veidu)
  3. Problēmas (saistīti ar mērķi)
  4. Uzdevumi (saistīti ar problēmu)
- Pēc kasādžu izveides šie elementi ir pieejami jaunas nodarbības formai.

## PĒC DEPLOY (obligāti)
1. Iekopēt lokālo `code.gs` Apps Script projektā (aizstāt saturu).
2. Pārbaudīt `doPost` action maršrutēšanu un nepieciešamās Sheet cilnes.
3. Deploy -> Manage deployments -> New version / atjaunināt Web App.
4. Palaist `node tests/e2e-api-test.js` vai atvērt `pages/test.html` (ADMIN sesijā).

## STATUSS
- [x] GitHub Pages frontend faili izveidoti
- [x] Lokālais `code.gs` paplašināts ar visām lapu darbībām (seedTestData bez testa datiem)
- [x] Versija 2.0.0
- [ ] Apps Script deploy ar jauno `code.gs` (neizdarīts šajā vidē)
