# Sociālās Rehabilitācijas Sistēmas — Sistēmas Specifikācija

## 1. Celms un Mērķis

### 1.1 Sistēmas nosaukums un apraksts
Sociālās Rehabilitācijas Sistēma (SRS) ir digitālā platforma sociālās rehabilitācijas nodarbību uzskaites, klientu pārvaldības, darbinieku kontroles un analītikas nepieciešanai. Sistēma paredzēta Gramzdas (un saistītu teritoriju) sociālās rehabilitācijas pakalpojumu sniedzējiem, kur vēlamies caurspīdīgi un profesionāli uzskatīt darbinieku klientu nodarbības, analizēt tendences un pārvaldīt kaskādu struktūras.

### 1.2 Galvenie mērķi
- Caurspīdīgā nodarbību uzskatīšana ar reāllaikas datiem.
- Klientu un darbinieku pārvaldība ar loma-bazētiem piekļuves tiesībām.
- Statistiskā analīze un vizualizācija uz nodarbību datiem.
- Administratīvās kaskāžu pārvaldība (nodarbības veidi → mērķi → probleiami → uzdevumi).
- Exports un ārdarbības veidņa aizpildīšana caur Google Sheets un Apps Script.

## 2. Sistēmas Arhitektūra

### 2.1 Tehnoloģiskais slāņojums
Sistēma ir divdalas:
- **Frontend (klientpusē):** statiskais HTML/CSS/JavaScript, kas tiek vietots GitHub Pages. Nav backend servera frontend puses — visu datu apstrādi veic Google Apps Script.
- **Backend (serverpusē):** Google Apps Script (`code.gs`, `excel-veidne.gs`), kas saistējas ar Google Sheet datubāzi un izpilda `doPost` maršrutēšanu JSON payloads.

### 2.2 Datu plūme
1. Lietotājs pierakstās frontendā (`index.html` → `auth.js` → `api.js`).
2. Frontend nosūta `POST` pieprasījumu Google Apps Script Web App URL (`WEBAPP_URL`).
3. Apps Script apstrāda darbību (`doPost`), lasa/raksta datus Google Sheet lapās un atgriež JSON atbildi.
4. Frontend atjaunina UI bezlapas pārlādēšanas.

### 2.3 Aptauju un nodarbību datu avots
Galvenie dati tiek saglabāti Google Sheet šīm lapām: `Iestatijumi`, `Darbinieki`, `Klienti`, `Nodarbibas`, `Nodarbibu_veidi`, `Merki`, `Problemas`, `Uzdevumi`. Katrai lapai ir definēti kolonnu virsraksti (`atjaunotSistemasLapas` funkcijā `code.gs`).

## 3. Autentifikācija un Drošība

### 3.1 Pieejas pakalpojumi
Trīsscaļas piekļuves procedūra:
1. **Kopējā piekļuves parole** — pirmā gate (`accessGate`), pārvērtēta caur `getAccessPassword()` (Iestatijumi lapā vai Script Properties, noklusētais `VainodeSAC123*`).
2. **Darbinieka izvēle** — aktīvie darbinieki no `Darbinieki` lapas.
3. **PIN kods** — otrais faktors, pārbaudīts caur `pieteiktiesArPinUnId`, atgriež sesijas toķenu (`TOKEN_*`, 8 stundas beigas).

### 3.2 Tiesību modelis (Role-Based Access Control)
- `USER` — standarta piekļuve klientu, nodarbību un statistikas sadaļām.
- `ADMIN` — papildu piekļuve kaskādēm, lietotājiem un iestatījumiem (`admin-only` elementi slēpti lietotājiem).

### 3.3 Sesija
- Toķens saglabāts `localStorage` (`srs_access_token`).
- Sesijas beigšanas indikators (countdown 8 stundas).
- Izvešanās no sistēmas notīra sesijas datus un atgriež uz `index.html`.

## 4. Datu Modelis (Google Sheets Lapas)

### 4.1 Darbinieki
`employee_id`, `employee_name`, `pin`, `role`, `active`. Aktīvie darbinieki filtrēti pēc `active === TRUE`.

### 4.2 Klienti
`id`, `vards`, `statuss` (Aktīvs/Neaktīvs), `piezimes`.

### 4.3 Nodarbības (galvenā transakciju tabula)
`id`, `klients`, `datums`, `nodarbiba_nosaukums`, `merkis`, `problema`, `uzdevums`, `refleksija`, `motivacija`, `gaita`, `garastavoklis`, `vertejums`, `pildits`, `komentars`, `employee_id`, `darbinieks`.

### 4.4 Kaskāžu struktūra (ADMIN)
- `Nodarbibu_veidi`: `id`, `nosaukums`, `aktivs`.
- `Merki`: `id`, `nv_id`, `nosaukums`, `aktivs`.
- `Problemas`: `id`, `merkis_id`, `nosaukums`, `aktivs`.
- `Uzdevumi`: `id`, `problema_id`, `nosaukums`, `aktivs`.

### 4.5 Iestatījumi
Kļūtu-sludinājumu parādi: `atslega`, `vertiba` (piemēram, `access_password`, `app_version`).

## 5. Sadaļas un Funkcionalitāte

### 5.1 Sākuma lapa (`pages/sakums.html`)
- KPI kartītes: aktīvie klienti, šodienas nodarbības, kopējais nodarbību skaits, mani ieraksti.
- Quick actions: jauna nodarbība, klienti, nodarbību vēsture, kaskādes (ADMIN).
- Pēdējās reģistrētās nodarbības tabula.

### 5.2 Jauna nodarbība (`pages/jauna-nodarbiba.html`)
- 4-solīgs kaskādes stepper: nodarbības veids → mērķis → problema → uzdevums.
- Auto-izvēles režīms, pilnības indicējs, meklēšana dialogos.
- Nodarbības apraksts: refleksija, motivācija, gaita, garastāvoklis, vērtējums, pildības statuss, komentārs.
- Saglabāšanas un notīrīšanas darbības.

### 5.3 Klienti (`pages/klienti.html`) un Klienta profils (`pages/klienta-profilis.html`)
- Klientu saraksts ar meklēšanu un statusa filtru.
- Klienta pievienošana/redagēšana modalā.

### 5.4 Nodarbību vēsture (`pages/nodarbibu-vesture.html`)
- Vēsturiskie ieraksti (izcelts darbs.md plānā).

### 5.5 Kaskādes (`pages/kaskades.html`, ADMIN)
- Četru līmeņu koka skats: nodarbības veidi → mērķi → probleiami → uzdevumi.
- Meklēšana visai kaskādejai, aktīvo filtrēšana, pievienošana/labošana/dzēšana modālajiem logiem.

### 5.6 Lietotāji (`pages/lietotaji.html`, ADMIN)
- Darbinieku pārvaldšana (pievienošana, redagēšana, loma, aktivitāte).

### 5.7 Iestatījumi (`pages/iestatijumi.html`, ADMIN)
- Sistēmas iestatījumu kļūtu-sludinājumu redagēšana.

### 5.8 Statistika (`pages/statistika.html`)
- KPI: kopējais nodarbību skaits, šodienas nodarbības, aktīvie klienti, mani ieraksti.
- 5 CSS-bazētas diagrammas: nodarbības pēc klienta (bar), pēc darbinieka (pie), laika gaitā (line, 14 dienas), nodarbību veidu sadalījums (pie), pildības statuss (pie).
- Pilnekrāna modāls katrai diagrammai.
- Nav ārpusējo bibliotēku (bez Chart.js) — visu vizualizāciju veido CSS un SVG.

## 6. Statistikas Modulis (SRS Puses)

### 6.1 Datu iegūšana
- `getSakums` — sākuma lapas agregētie rādītāji (aktivie, sodien, kopskaits, mani, pēdēji 5 ieraksti).
- `getNodarbibas` — visi nodarbību ieraksti.
- `getKlienti` — visi klienti.

### 6.2 Analītiskie rādītāji
- Kopējais ierakstu skaits un šodienas skaits.
- Aktīvo klientu skaits (statuss sākas ar "Akt").
- Darbinieku specifiskie ieraksti (`employee_id` / `darbinieks`).
- Nodarbību grupas pēc klienta, darbinieka, veida, datuma un pildības statusa.

### 6.3 Vizualizācijas veidi
- Stabi (bar) — divdimensiju salīdzinājums.
- Liča diagrame (pie) — procentuālais sadalījums ar centra kopsummas indikatoru.
- Līnijas diagrame (line) — laika tendence (pēdējie 14 dienas).

### 6.4 Ierobežojumi
Nav ārpusējo diagrammu bibliotēku. Visi grafiki ir CSS/SVG realizēti. Nav prognožu modeļa, nav regressijas, nav temporālās statistikas ārpus 14 dienu loga.

## 7. Vizuālais Izkārtojums un Dizains

### 7.1 Stilprincips
Tumšs dizains ar akcentu krāsām: `#a855f7` (violetta), `#ec4899` (rozē). Glassmorphism efekts kartītes un diagrammai. Responsive iegārtojums (grid `auto-fit`, mobilā versija vienai kolonna).

### 7.2 Iekārtojuma elements
- Kreisa sānloce ar logo, lietotāja vārdu/rolu, navigāciju un iziet pogu.
- Galvenais saturs ar header, page-header (virsraksts un apraksts), galvenā satura zona un footer ar versiju.
- KPI kartītes ar gradienta fona un tekstu-maska krāsām.
- Diagramma kartītes ar pilnekrāna pogu un modalu.

### 7.3 Krāsu palete (statistikai)
`#a855f7`, `#ec4899`, `#818cf8`, `#f472b6`, `#c4b5fd`, `#fbcfe8`, `#22c55e`, `#f43f5e`.

## 8. API un Integrācija

### 8.1 Google Apps Script (`code.gs`)
- `doPost(e)` — galvenais maršrutētājs, atbalsta `action` parametrus: `getAppInfo`, `getEmployees`, `login`, `getSakums`, `getKlienti`, `saveKlients`, `getKaskade`, `saveNodarbibasVeids`, `saveMerkis`, `saveProblema`, `saveUzdevums`, `deleteKaskadeItem`, `getNodarbibas`, `saveNodarbiba`, `fillVeidne`, `createFirstEmployee`, `getLietotaji`, `saveLietotajs`, `getIestatijumi`, `saveIestatijumi`, `seedTestData`.
- `doGet(e)` — atļauja tikai POST, OPTIONS preflight.

### 8.2 Excel Veidne (`excel-veidne.gs`)
- `fillVeidne(data)` — ieraksta nodarbību ierakstu vērtības noteiktām Google Sheet šūnām (piemēram, `B3`, `C26`, `A25` u.c.).
- Ierobežojums: ir jākonfigurē `VEIDNE_SS_ID`.

### 8.3 Frontend API slānis (`js/api.js`)
- `api(action, payload)` — universālais `POST` pieprasījuma slānis ar `access_token`, loader indikatoru un JSON atbildei.

## 9. Testēšana un Kvalitāte

### 9.1 Testi (`tests/`)
- `structure-test.js` — 38/38 PASS, struktūras testa.
- `e2e-api-test.js` — end-to-end API testa.
- `template-fill-test.js` — veidņa aizpildes testa.

### 9.2 Statuss (saskaņā ar darbs.md)
- GitHub Pages frontend faili: izveidoti.
- Lokālais `code.gs`: paplašināts ar visām lapu darbībām.
- Versija: 2.0.1.
- Apps Script deploy ar jauno `code.gs`: neizdarīts šajā vidē (obligāts pēc deploy).

## 10. Realitāte un Faktiskais Stāvoklis

### 10.1 Kas ir realizēts
- Pilnīga autentifikācijas caurvara (parole → darbinieks → PIN).
- CRUD operācijas klientiem, darbiniekiem un nodarbībām.
- Kaskāžu pārvaldba ARMIN lomai.
- Statistikas panelē ar 5 diagrammi un KPI.
- Mobilā navigācija, sesijas indikators, loading indikators, modālo logu pārvaldība.

### 10.2 Kas vēl nav realizēts
- Apps Script deploy produkcionā videi (manuāls processus).
- Automātiskie testa dati (seedTestData atgriež `seeded: false`).
- Nodarbību ieraksta labošanas atsevišķa lapa (plānots darbs.md).
- Atvērtas statistikas paneļas / publiskā API (nākotnes iespējas, ne reālizētas).

## 11. Vērtējums (1-10)

| Aspekts | Vērtējums | Komentārs |
|---------|-----------|-----------|
| Autentifikācija un drošība | 8/10 | Trīsscala, toķeni, lomas, sesijas |
| Datu modelis (Google Sheets) | 7/10 | Struktūrets, nav relācionala datubāze |
| Frontend architektūra | 8/10 | Modulārs, atsevišķi js/css/html faili |
| Statistikas vizualizācija | 8/10 | CSS/SVG, responsive, pilnekrāns, bez ārpusējām bibliotēmām |
| Kaskāžu pārvaldba | 8/10 | Interaktīvs 4-līmeņu skats, ADMIN |
| Dokumentācija | 6/10 | PLAN.md, darbs.md ir, sistēmā specifikācija trūkoja (tagad izveidota) |
| Testēšana | 7/10 | Struktuura un e2e testi eksistē |
| Kopējais profesionālais līmenis | 8/10 | Caurspīdīgs, strukturēts, gatavs produkcijai pēc Apps Script deploy |

## 12. Kopsavilkums
Sociālās Rehabilitācijas Sistēma ir profesionāli veidota, modulāra un caurspīdīga sociālās rehabilitācijas nodarbību uzskaites risinājums. Sistēma ir visu lietotāju sadaļu (sākums, jauna nodarbība, klienti, vēsture, statistika) un administratīvām sadaļām (kaskādes, lietotāji, iestatījumi) kompleti realizēta frontendā, ar Google Apps Script backend integrāciju. Galvenais atlikušais soļis ir Apps Script deploy produkcionā videi, kad sistēma kļūst pilnībā operatīvā.
