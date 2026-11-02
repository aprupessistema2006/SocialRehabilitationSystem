Sociālās rehabilitācijas nodarbību uzskaites sistēma
Pilns programmas izstrādes un ieviešanas plāns · GitHub + Google Sheets + Google Apps Script

Šis ir pilnais projekta plāns no tukša GitHub repozitorija līdz gatavai, internetā pieejamai lietotnei. Tajā paredzēta visa nepieciešamā funkcionalitāte, datubāzes uzbūve, katras lapas un faila uzdevumi, lietotāju tiesības, kaskādes, klientu vēsture, ierakstu labošana un dokumentu eksports.

Svarīgi: šeit ir izstrādes specifikācija, nevis programmas kods. Visi lietotnes nosaukumi, izvēlnes, pogas, datubāzes lapas un lietotājam redzamie paziņojumi paredzēti latviešu valodā.
1. Projekta mērķis un gala rezultāts
Izveidot sociālās rehabilitācijas nodarbību uzskaites sistēmu, kuru divi darbinieki var izmantot vienlaikus no datora vai telefona, atverot vienu interneta adresi.

Sistēmai jānodrošina:
1. Katram darbiniekam savs lietotāja konts.
2. Pieteikšanās sistēmā ar piekļuves pārbaudi.
3. Klientu pievienošana un pārvaldība.
4. Jaunas nodarbības reģistrēšana.
5. Kaskādes izvēles: nodarbība → mērķis → problēma → uzdevums.
6. Nodarbības datu saglabāšana Google Sheets datubāzē.
7. Pilna klienta nodarbību vēsture.
8. Iepriekš saglabātu ierakstu atvēršana un labošana.
9. Informācija par to, kurš darbinieks izveidojis vai labojis ierakstu.
10. Kaskāžu papildināšana un labošana administratora sadaļā.
11. Nodarbības veidlapas eksports PDF vai Excel formātā.
12. Sistēmas izmantošana internetā, bez programmas instalēšanas.
13. Rezerves kopijas un izmaiņu uzskaite.
2. Tehnoloģijas un sistēmas uzbūve
Lietotājs — pārlūks

Dators, telefons vai planšete


GitHub

Projekta faili, versijas un izstrāde


Google Apps Script

Lietotnes serveris, autorizācija un datu apstrāde

Google Sheets

Datubāze


Google Drive

Dokumenti un rezerves kopijas




Katra pakalpojuma uzdevums
Pakalpojums	Paredzētais pielietojums
GitHub	Visu programmas failu glabāšana
GitHub Pages	Var izmantot publiskai informatīvai lapai vai statiskam lietotnes priekšskatījumam
Google Apps Script	Galvenā lietotnes darbība un servera funkcijas
Google Sheets	Datu bāze
Google Drive	Veidnes, PDF un Excel dokumenti

Svarīgs tehniskais lēmums: galveno lietotni ieteicams izvietot ar Google Apps Script tīmekļa lietotnes funkciju, izmantojot HTML Service. GitHub paliek galvenā koda glabāšanas un versiju kontroles vieta. Tādējādi nav nepieciešams atsevišķi risināt GitHub Pages un Apps Script savstarpējās piekļuves, pāradresācijas un autorizācijas sarežģījumus.

Ja vēlies, lai pati lietotne obligāti atveras no GitHub Pages adreses, to var veidot kā atsevišķu arhitektūras variantu, bet tad jāparedz drošs API starpnieks un autentifikācijas risinājums. Nekādā gadījumā nedrīkst ievietot Google piekļuves atslēgas vai datubāzes noslēpumus publiskajos JavaScript failos.
3. Pilna GitHub projekta struktūra
Tavā repozitorijā SocialRehabilitationSystem jāizveido šāda struktūra:
social-rehabilitation-system/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── form.js
│   ├── cascade.js
│   ├── history.js
│   └── admin.js
│
├── backend/
│   ├── Main.gs
│   ├── Database.gs
│   ├── Activities.gs
│   ├── Clients.gs
│   ├── Cascades.gs
│   ├── Documents.gs
│   ├── Authentication.gs
│   └── Settings.gs
│
├── templates/
│   └── activity_template
│
└── README.md


Papildus projekta attīstības gaitā ieteicams pievienot tests/ mapi, kurā glabājas pārbaudes un testa scenāriji. Tā nav obligāta sākotnējās struktūras sastāvdaļa.

Svarīgi par failu izvietošanu: GitHub repozitorijā var uzturēt norādīto mapju struktūru, bet Google Apps Script projektā .gs un HTML faili būs jāizveido vai jāsinhronizē atbilstoši Apps Script failu struktūrai. Apps Script pats automātiski neizpilda GitHub repozitorija failus. Sinhronizācijai var izmantot clasp vai kontrolētu manuālu izvietošanu.
4. Frontend — lietotnes redzamā daļa
Frontend ir viss, ko darbinieks redz ekrānā. Tam jābūt latviešu valodā, ērti lietojamam un pielāgotam dažādiem ekrāna izmēriem.
4.1. frontend/index.html
Galvenā lietotnes struktūra.

Tajā jāparedz šādas sadaļas:
- Pieteikšanās.
- Sākumlapa.
- Jauna nodarbība.
- Klientu saraksts.
- Klienta profils.
- Klienta nodarbību vēsture.
- Ierakstu labošana.
- Kaskāžu pārvaldība.
- Darbinieku un lietotāju pārvaldība.
- Dokumentu eksports.
- Sistēmas iestatījumi.
Navigācijas izvēlne:
1. Sākums
2. Jauna nodarbība
3. Klienti
4. Nodarbību vēsture
5. Kaskādes
6. Lietotāji
7. Iestatījumi
8. Iziet
Darbiniekam jāredz tikai tās sadaļas, kuras atļauj viņa loma.
4.2. frontend/style.css
Atbild par visu vizuālo noformējumu:
- Vienots dizains visā lietotnē.
- Latviski nosaukumi un paziņojumi.
- Pārskatāmas formas.
- Skaidras pogas.
- Izvēļņu un tabulu noformējums.
- Kļūdu un veiksmīgas saglabāšanas paziņojumi.
- Mobilā versija.
- Pieejamība — salasāms fonts, kontrasts, tastatūras vadība.
- Ielādes indikatori, lai lietotājs zinātu, kad dati tiek saglabāti.
4.3. frontend/app.js
Galvenais lietotnes darbības vadības fails.

Tam jānodrošina:
- Lietotnes sākotnējā ielāde.
- Lietotāja sesijas pārbaude.
- Sākotnējo datu saņemšana.
- Navigācija starp sadaļām.
- Backend pieprasījumu vadība.
- Kļūdu apstrāde.
- Lietotāja tiesību pārbaudes attēlošana.
- Sesijas pārtraukšana.
- Paziņojumu attēlošana.
4.4. frontend/form.js
Atbild par nodarbības reģistrēšanas formu.

Formā jābūt šādiem laukiem:
1. Klients.
2. Datums.
3. Nodarbības nosaukums.
4. Mērķis.
5. Klienta problēma.
6. Uzdevums.
7. Refleksija.
8. Klienta sadarbība un motivācija.
9. Nodarbības gaita.
10. Klienta garastāvoklis.
11. Nodarbības vērtējums.
12. Pēc apmācību programmas tika pildīts (izpildīts).
13. Komentārs/piezīme.
14. Darbinieks.
Darbinieka lauks automātiski jāaizpilda ar pieteikušos darbinieku. Parastam darbiniekam nevajadzētu ļaut patvaļīgi izvēlēties cita darbinieka vārdu.

Pogas:
- Saglabāt
- Saglabāt un eksportēt PDF
- Saglabāt un eksportēt Excel
- Notīrīt formu
- Atcelt
Pēc saglabāšanas jāparāda ieraksta numurs un apstiprinājums. Ja saglabāšana neizdodas, jāparāda kļūda un jāsaglabā lietotāja ievadītais saturs, lai to nepazaudētu.
4.5. frontend/cascade.js
Atbild par atkarīgo izvēļņu darbību.

Kaskādes secība:
1. Nodarbības nosaukums

Izvēlas nodarbības veidu


2. Mērķis

Rāda tikai izvēlētajai nodarbībai atbilstošos mērķus


3. Klienta problēma

Rāda tikai konkrētajam mērķim atbilstošās problēmas


4. Uzdevums

Rāda tikai konkrētajai problēmai atbilstošos uzdevumus


Ja lietotājs nomaina augstāka līmeņa izvēli, visi zemākie līmeņi jānotīra un jāielādē no jauna.

Jāparedz arī iespēja administratoram pievienot jaunus kaskādes elementus. Parastam darbiniekam brīvā teksta ievade pieļaujama tikai tad, ja to apstiprina sistēmas prasības, un šādi ieraksti jāatzīmē kā individuāli, nevis jāievieto automātiski kopējā kaskādē.
4.6. frontend/history.js
Atbild par klientu vēsturi un ierakstu apskati.

Jāparedz:
- Meklēšana pēc klienta.
- Klientu saraksts.
- Klienta profila atvēršana.
- Visu klienta nodarbību apskate.
- Filtrs pēc datuma no–līdz.
- Filtrs pēc nodarbības veida.
- Filtrs pēc darbinieka.
- Ieraksta pilna apskate.
- Ieraksta labošana.
- PDF un Excel eksports.
Klienta profilā jābūt hronoloģiskam nodarbību sarakstam. Katram ierakstam jāparāda datums, nodarbības nosaukums, darbinieks un iespēja atvērt pilnu ierakstu.
4.7. frontend/admin.js
Administratora sadaļa.

Tajā jānodrošina:
- Jauna klienta pievienošana.
- Klienta datu labošana.
- Klienta deaktivizēšana.
- Darbinieku pārvaldība.
- Lietotāju lomu pārvaldība.
- Kaskāžu pārvaldība.
- Sistēmas iestatījumi.
- Audita žurnāla apskate.
- Dokumentu veidnes konfigurācija.

5. Backend — sistēmas servera daļa
Backend apstrādā pieprasījumus, pārbauda tiesības un veic darbības ar datubāzi. Visas būtiskās pārbaudes jāveic servera pusē, nevis tikai pārlūkā.
5.1. backend/Main.gs
Galvenais servera ieejas punkts.

Atbild par:
- Lietotnes atvēršanu.
- HTML failu izsniegšanu.
- Sākotnējo konfigurāciju.
- Pieprasījumu novirzīšanu uz atbilstošām funkcijām.
- Vispārēju kļūdu apstrādi.
5.2. backend/Database.gs
Galvenais datubāzes pārvaldības fails.

Atbild par:
- Google Sheets dokumenta identificēšanu.
- Datu lapu atrašanu.
- Datu nolasīšanu.
- Datu saglabāšanu.
- Datu labošanu.
- ID ģenerēšanu.
- Datu validāciju.
- Vienlaicīgas piekļuves aizsardzību.
- Kļūdu apstrādi.
Jāizmanto unikāli ID, nevis rindas numurs kā ieraksta identifikators. Vienlaicīgu darbību gadījumā jāizmanto Apps Script bloķēšanas mehānisms, lai divi darbinieki nepārrakstītu viens otra datus.
5.3. backend/Activities.gs
Atbild par nodarbību ierakstiem:
- Jauna ieraksta izveidošana.
- Ieraksta nolasīšana.
- Ieraksta labošana.
- Ieraksta arhivēšana.
- Ieraksta statusa maiņa.
- Klienta vēstures iegūšana.
- Ierakstu meklēšana pēc datuma un darbinieka.
- Ieraksta izmaiņu reģistrēšana.
5.4. backend/Clients.gs
Atbild par klientu datiem:
- Klienta pievienošana.
- Klienta datu labošana.
- Klienta atrašana.
- Klienta profila iegūšana.
- Klienta vēstures sasaistīšana.
- Klienta deaktivizēšana.
Klienta dzēšana nedrīkst automātiski izdzēst viņa nodarbību vēsturi.
5.5. backend/Cascades.gs
Atbild par kaskāžu datiem:
- Nodarbību veidu nolasīšana.
- Mērķu nolasīšana.
- Problēmu nolasīšana.
- Uzdevumu nolasīšana.
- Jaunu elementu pievienošana.
- Elementu labošana.
- Elementu deaktivizēšana.
- Elementu secības maiņa.
5.6. backend/Documents.gs
Atbild par dokumentu izveidi:
- Veidnes kopēšana.
- Veidnes lauku aizpildīšana.
- PDF ģenerēšana.
- Excel XLSX ģenerēšana.
- Dokumenta nosaukuma izveide.
- Dokumenta saglabāšana Google Drive.
- Dokumenta lejupielādes saites atgriešana lietotājam.
- Pagaidu failu dzēšana atbilstoši noteiktajam glabāšanas termiņam.
5.7. backend/Authentication.gs
Atbild par pieteikšanos un piekļuves tiesībām:
- Lietotāja identitātes pārbaude.
- Lietotāja aktīvā statusa pārbaude.
- Lomas pārbaude.
- Piekļuves ierobežošana.
- Sesijas pārbaude, ja izmantota atsevišķa autentifikācija.
- Aizliegto darbību bloķēšana.
Ieteicamais risinājums: izmantot katra darbinieka Google kontu un servera pusē atļauto e-pastu sarakstu. Tas ir drošāk nekā pašam veidot lietotājvārdu un paroļu sistēmu.

Ja tomēr nepieciešami atsevišķi lietotājvārdi un paroles tieši šajā lietotnē, jāparedz paroļu droša jaukšana ar unikālu sāli, drošas sesijas, paroles atjaunošana, neveiksmīgu mēģinājumu ierobežošana un servera puses lomu pārbaude. Paroles nedrīkst glabāt vienkāršā tekstā. Apps Script nav ideāls pilnvērtīgas autentifikācijas sistēmas izveidei.
5.8. backend/Settings.gs
Atbild par sistēmas konfigurāciju:
- Datubāzes ID.
- Dokumentu veidnes ID.
- Drive mapju ID.
- Atļauto lietotāju saraksts.
- Datuma formāts.
- Sistēmas nosaukums.
- Sistēmas versija.
- Eksporta iestatījumi.
- Glabāšanas un rezerves kopiju iestatījumi.
Svarīgi: slepenas konfigurācijas vērtības nedrīkst glabāt publiskā GitHub repozitorijā.

6. Google Sheets — pilna datubāzes izveide
Šī ir viena no svarīgākajām projekta daļām. Google Sheets būs sistēmas datubāze.

Ieteicams izveidot vienu atsevišķu Google Sheets dokumentu ar nosaukumu:

Sociālās rehabilitācijas sistēmas datubāze

Tajā izveido šādas lapas. Lapu nosaukumus veido bez diakritiskajām zīmēm, lai vienkāršotu tehnisko apstrādi, bet lietotnē un dokumentos visi nosaukumi būs pareizā latviešu valodā.
6.1. Lapa Klienti
Šeit glabājas klientu saraksts.
Kolonnas nosaukums	Nozīme
client_id	Unikāls klienta ID
client_full_name	Klienta vārds un uzvārds
status	Aktīvs / neaktīvs
created_at	Izveides datums
updated_at	Pēdējās labošanas datums
created_by	Kurš pievienoja klientu
notes	Papildu piezīmes, ja nepieciešamas

Katram klientam piešķir unikālu ID, piemēram, K00001. ID nekad nemaina, pat ja tiek labots klienta vārds.
6.2. Lapa Nodarbibas
Šī ir galvenā datubāzes lapa, kurā tiek glabāti visi nodarbību ieraksti.
Kolonnas nosaukums	Nozīme
activity_id	Unikāls nodarbības ID
client_id	Klienta ID
activity_date	Nodarbības datums
activity_area	Nodarbības nosaukums
activity_goal	Mērķis
client_problem	Klienta problēma
activity_task	Uzdevums
activity_reflection	Refleksija
client_motivation	Klienta sadarbība un motivācija
activity_process	Nodarbības gaita
client_mood	Klienta garastāvoklis
activity_eval	Nodarbības vērtējums
activity_implementation	Programmas izpilde
activity_comment	Komentārs/piezīme
act_employee_id	Darbinieka ID
act_employee_name	Darbinieka vārds
created_at	Ieraksta izveides datums
updated_at	Pēdējās labošanas datums
created_by	Ieraksta izveidotājs
updated_by	Pēdējais labotājs
status	Aktīvs / arhivēts / dzēsts

Katrs nodarbības ieraksts tiek piesaistīts klientam ar client_id. Tas ļauj iegūt visu klienta vēsturi arī tad, ja klienta vārds vēlāk tiek labots.
6.3. Kaskāžu datubāze
Lai kaskādes darbotos pareizi un katram elementam būtu skaidrs vecākelements, tās ieteicams sadalīt četrās lapās.

Lapa Nodarbibu_veidi
Kolonna	Nozīme
activity_area_id	Nodarbības veida ID
name	Nodarbības nosaukums
active	Vai aktīvs
sort_order	Attēlošanas secība

Lapa Merki
Kolonna	Nozīme
goal_id	Mērķa ID
activity_area_id	Saite uz nodarbības veidu
name	Mērķa nosaukums
active	Vai aktīvs
sort_order	Attēlošanas secība

Lapa Problemas
Kolonna	Nozīme
problem_id	Problēmas ID
goal_id	Saite uz mērķi
name	Problēmas nosaukums
active	Vai aktīva
sort_order	Attēlošanas secība

Lapa Uzdevumi
Kolonna	Nozīme
task_id	Uzdevuma ID
problem_id	Saite uz problēmu
name	Uzdevuma nosaukums
active	Vai aktīvs
sort_order	Attēlošanas secība

Šādi iespējams vienam nodarbības veidam pievienot vairākus mērķus, katram mērķim vairākas problēmas un katrai problēmai vairākus uzdevumus.

Piemērs:
Nodarbības veids	Mērķis	Problēma	Uzdevums
Sociālo prasmju attīstīšana	Attīstīt komunikāciju	Grūtības uzsākt sarunu	Sarunas uzsākšanas vingrinājums
Sociālo prasmju attīstīšana	Attīstīt komunikāciju	Grūtības uzturēt dialogu	Dialoga veidošanas uzdevums
Ikdienas prasmju attīstīšana	Veicināt patstāvību	Grūtības plānot dienu	Dienas plāna izveide

Šis ir tikai struktūras piemērs. Faktiskās kaskāžu vērtības jāievada no jūsu izmantotās rehabilitācijas programmas.
6.4. Lapa Darbinieki
Kolonna	Nozīme
employee_id	Darbinieka ID
employee_name	Vārds un uzvārds
email	Google konta e-pasts
role	ADMIN vai DARBINIEKS
is_active	Aktīvs / neaktīvs
created_at	Pievienošanas datums
last_login	Pēdējā pieteikšanās, ja pieejama

Sākumā izveido divus darbinieku ierakstus.
6.5. Lapa Lietotaji
Šī lapa nepieciešama tikai tad, ja izvēlas atsevišķu lietotājvārdu un paroļu autentifikāciju.
Kolonna	Nozīme
user_id	Lietotāja ID
username	Lietotājvārds
password_hash	Paroles jaucējvērtība
password_salt	Unikāls sāls
employee_id	Saistītais darbinieks
role	Lietotāja loma
is_active	Aktīvs / neaktīvs
failed_attempts	Neveiksmīgo pieteikšanās mēģinājumu skaits
locked_until	Konta bloķēšanas termiņš
created_at	Izveides datums
password_changed_at	Pēdējās paroles maiņas datums

Ja tiek izmantoti Google konti, šo lapu var neizveidot.
6.6. Lapa Iestatijumi
Šeit glabājas sistēmas konfigurācija.
Kolonna	Nozīme
setting_key	Iestatījuma nosaukums
setting_value	Iestatījuma vērtība
description	Skaidrojums
updated_at	Pēdējās labošanas datums
updated_by	Kurš laboja

Piemēri:
- Datubāzes nosaukums.
- Veidnes ID.
- Eksporta mapes ID.
- Sistēmas versija.
- Datuma formāts.
- Atļautie lietotāji.
- Rezerves kopiju iestatījumi.
6.7. Lapa Audita_zurnals
Šī lapa ir ļoti svarīga, jo sistēmā var labot iepriekš saglabātus ierakstus.
Kolonna	Nozīme
log_id	Žurnāla ieraksta ID
timestamp	Darbības laiks
user_id	Lietotāja ID
action	Darbība
record_type	Klients / nodarbība / kaskāde
record_id	Mainītā ieraksta ID
details	Izmaiņu apraksts

Jāreģistrē:
- Jauns ieraksts.
- Ieraksta labošana.
- Klienta pievienošana.
- Klienta datu labošana.
- Kaskādes elementa pievienošana.
- Kaskādes elementa deaktivizēšana.
- Dokumenta eksports.
- Lietotāja tiesību maiņa.
Žurnālā nevajag atkārtoti glabāt visu klienta sensitīvo informāciju. Pietiek ar darbības aprakstu un mainītā ieraksta ID.
6.8. Lapa Rezerves_kopijas
Šī lapa nav obligāta datu glabāšanai, bet var izmantot rezerves kopiju uzskaites reģistrēšanai.
Kolonna	Nozīme
backup_id	Kopijas ID
created_at	Izveides datums
file_id	Drive faila ID
created_by	Atbildīgais
status	Veiksmīga / kļūda
description	Piezīme

Rezerves kopijas pašas glabā Google Drive ierobežotā piekļuves mapē.

7. Google Sheets izveide soli pa solim
1. Atver Google Drive.
2. Izveido jaunu Google Sheets dokumentu.
3. Nosauc to SocialRehabilitationSystem_Database.
4. Izveido visas iepriekš minētās lapas.
5. Katrā lapā pirmajā rindā ievieto norādītos kolonnu nosaukumus.
6. Pirmo rindu noformē treknrakstā.
7. Iesaldē pirmo rindu.
8. Ieslēdz filtrus.
9. Datuma kolonnām iestata datuma formātu.
10. ID kolonnām iestata teksta formātu.
11. Pārbauda, vai visās lapās kolonnu nosaukumi ir precīzi un bez dublikātiem.
12. Saglabā dokumenta ID sistēmas konfigurācijā.
Drošības nosacījums: Sheets lapu paslēpšana vai šūnu aizsardzība nav pietiekama datu aizsardzība. Piekļuve visam datubāzes dokumentam jāierobežo ar atļautiem kontiem. Darbiniekiem nav automātiski jāpiešķir piekļuve pašai datubāzei — viņiem jāstrādā caur lietotni.
8. Nodarbības veidne — templates/activity_template
Šī ir atsevišķa Google Sheets dokumenta veidne, kurā tiek saglabāts esošais nodarbības veidlapas izkārtojums.

Veidne jāizveido atsevišķi no datubāzes. Tā jānoformē tā, lai PDF un Excel dokumenti izskatītos tāpat kā sākotnējā veidlapa.

Jāizveido un jāpārbauda visi nosauktie diapazoni.
8.1. Precīza lauku un šūnu atbilstība
Nosauktais diapazons	Šūna	Saturs
client_full_name	$B$3	Klients
act_employee	$C$24	Darbinieks
activity_area	$C$5	Nodarbības nosaukums
activity_comment	$A$23	Komentārs/piezīme
activity_date	$E$3	Datums
activity_eval	$D$15	Nodarbības vērtējums
activity_goal	$B$7	Mērķis
activity_implementation	$A$19	Programmas izpilde
activity_process	$D$13	Nodarbības gaita
activity_task	$B$10	Uzdevums
client_mood	$D$14	Garastāvoklis
client_motivation	$D$12	Sadarbība un motivācija
client_problem	$B$8	Klienta problēma

8.2. Papildu lauks — refleksija
Tā kā sākotnējā lauku sarakstā nav norādīta refleksijas šūna, veidnē jāparedz atsevišķs lauks.
- Nosauktais diapazons: activity_reflection
- Šūnas adrese: jāizvēlas pēc veidlapas faktiskā izkārtojuma.
- Šūna nedrīkst pārklāties ar citu lauku.
- Jāpārbauda, vai tajā var ievadīt vairākas teksta rindas.
8.3. Klienta lauks
Klients, kuram vadīja nodarbību, ir tas pats izvēlētais klients no klientu saraksta.

Tāpēc nevajag ievadīt klienta vārdu divās dažādās vietās. Sistēma izmanto client_id kā saiti, bet dokumentā attēlo klienta vārdu no izvēlētā profila.
8.4. Veidnes pārbaude
Pirms eksporta jāveic automātiska pārbaude:
- Vai visi nosauktie diapazoni eksistē?
- Vai katrs diapazons atbilst paredzētajai šūnai?
- Vai neviena šūna nav nejauši izmantota diviem laukiem?
- Vai datums tiek attēlots pareizi?
- Vai garāki teksti ietilpst šūnās?
- Vai PDF izdrukājas vienā pareizā lapu izkārtojumā?
- Vai Excel failā saglabājas noformējums?

9. Lietotnes ekrāni un to darbība
9.1. Pieteikšanās lapa
Lietotājam redzamais nosaukums: Pieteikšanās sistēmā

Laukos jābūt:
- Lietotāja e-pasts vai lietotājvārds — atkarībā no izvēlētās autentifikācijas.
- Parole — ja tiek izmantoti lietotājvārdi un paroles.
- Poga Pieteikties.
- Kļūdas paziņojums, ja piekļuve nav atļauta.
Pēc veiksmīgas pieteikšanās sistēma nosaka darbinieka vārdu un lomu.
9.2. Sākumlapa
Sākumlapā redzami galvenie darbību bloki:
- Jauna nodarbība.
- Klientu saraksts.
- Nodarbību vēsture.
- Kaskāžu pārvaldība — administratoram.
- Lietotāju pārvaldība — administratoram.
Var attēlot arī nelielu pārskatu:
- Kopējais aktīvo klientu skaits.
- Šodien reģistrēto nodarbību skaits.
- Kopējais nodarbību ierakstu skaits.
- Pēdējie izveidotie ieraksti.
Šie skaitļi ir informatīvi un jāattēlo tikai lietotājiem ar atbilstošām tiesībām.
9.3. Klientu sadaļa
Klientu sarakstā jābūt:
- Klienta vārdam un uzvārdam.
- Klienta ID.
- Statusam.
- Poga Atvērt profilu.
- Poga Labot — atbilstoši tiesībām.
Administratoram pieejama poga Pievienot klientu.

Ja klients vairs nav aktīvs, viņu var deaktivizēt, saglabājot vēsturiskos nodarbību ierakstus.
9.4. Jaunas nodarbības sadaļa
Darbinieks izvēlas klientu, norāda datumu un aizpilda nodarbības laukus. Kaskādes darbojas secīgi, bet pārējie teksta lauki tiek aizpildīti atbilstoši veidlapai.

Pirms saglabāšanas sistēma pārbauda:
- Vai izvēlēts klients.
- Vai norādīts datums.
- Vai izvēlēts nodarbības nosaukums.
- Vai aizpildīti obligātie lauki.
- Vai kaskādes izvēles ir savstarpēji atbilstošas.
- Vai darbinieka identitāte ir derīga.
Obligāto lauku saraksts jāapstiprina pēc jūsu darba metodikas. Ieteicams obligāti prasīt klientu, datumu, darbinieku, nodarbības veidu, mērķi un pārējos metodiski nepieciešamos laukus.
9.5. Klienta profils un vēsture
Atverot klientu, redzama visa viņa nodarbību vēsture.

Piemērs:
Datums	Nodarbība	Darbinieks	Darbība
05.10.2026.	Sociālo prasmju attīstīšana	Darbinieks 1	Atvērt
12.10.2026.	Ikdienas prasmju attīstīšana	Darbinieks 2	Atvērt
19.10.2026.	Sociālo prasmju attīstīšana	Darbinieks 1	Atvērt

Atverot ierakstu, jāredz pilna informācija, tostarp refleksija, komentārs un visi pārējie aizpildītie lauki.
9.6. Ieraksta labošana
Atverot iepriekš saglabātu nodarbību, lietotājs ar atbilstošām tiesībām var veikt labojumus.

Pēc labojuma:
1. Sistēma pārbauda datus.
2. Saglabā jauno informāciju.
3. Atjauno labošanas datumu.
4. Reģistrē labotāja identitāti.
5. Ieraksta audita žurnālā veiktās izmaiņas.
6. Atjauno klienta vēstures attēlojumu.
Ieteicams saglabāt arī iepriekšējo ieraksta versiju, lai vajadzības gadījumā varētu noskaidrot, kāda informācija bija ievadīta pirms labošanas.

Ierakstu nedrīkst fiziski izdzēst ar parastu pogu. Jāizmanto arhivēšana vai mīkstā dzēšana, un šai darbībai jābūt reģistrētai.
10. Darbinieku un administratora tiesības
Sākotnēji sistēmā paredzētas divas lomas.
Funkcija	Administrators	Darbinieks
Pieteikšanās	Jā	Jā
Klientu saraksta apskate	Jā	Jā
Jauna klienta pievienošana	Jā	Atbilstoši organizācijas noteikumiem
Klienta datu labošana	Jā	Ierobežoti
Jaunas nodarbības izveide	Jā	Jā
Nodarbību apskate	Jā	Atbilstoši piekļuves politikai
Savu ierakstu labošana	Jā	Jā
Citu darbinieku ierakstu labošana	Jā	Nē, ja nav īpaši atļauts
Kaskāžu papildināšana	Jā	Nē
Lietotāju pārvaldība	Jā	Nē
Audita žurnāls	Jā	Nē
Sistēmas iestatījumi	Jā	Nē
PDF un Excel eksports	Jā	Jā, atbilstoši piekļuves tiesībām

Ja darbiniekiem ir nepieciešama piekļuve tikai saviem klientiem vai saviem ierakstiem, to var ieviest kā atsevišķu piekļuves noteikumu. Tas jānosaka pirms programmas ieviešanas.
11. Dokumentu eksports PDF un Excel formātā
Eksportam jāizmanto activity_template veidne.

Darbības secība:
1. Lietotājs atver konkrētu nodarbības ierakstu.
2. Izvēlas Eksportēt PDF vai Eksportēt Excel.
3. Sistēma pārbauda piekļuves tiesības.
4. Sistēma izveido veidnes kopiju.
5. Aizpilda visus nosauktos diapazonus.
6. Saglabā dokumentu vajadzīgajā formātā.
7. Atgriež lietotājam dokumenta lejupielādes saiti.
8. Pagaidu darba kopija tiek dzēsta atbilstoši konfigurācijai.
Jāparedz divas atsevišķas pogas:
- Eksportēt PDF
- Eksportēt Excel
Un arī iespēja saglabāšanas brīdī izvēlēties:
- Saglabāt tikai sistēmā.
- Saglabāt un izveidot PDF.
- Saglabāt un izveidot Excel.
Failu nosaukumos ieteicams izmantot datumu, ieraksta ID un klienta ID, nevis klienta pilnu vārdu, lai samazinātu personas datu izplatīšanu failu nosaukumos.

Piemērs: 2026-10-05_N000123_K00001.pdf.

Dokumentu mapei Google Drive jābūt privātai. Nedrīkst izveidot publiskas saites uz klientu dokumentiem.
12. Sistēmas izveide un izvietošana pa soļiem
Ieteicamā izstrādes secība
1. 1. solis — GitHub projekta sagatavošana
   
   Atver esošo SocialRehabilitationSystem repozitoriju. Izveido visas norādītās mapes un failus. Pievieno README ar projekta aprakstu, tehnoloģijām un uzstādīšanas kārtību. GitHub glabā tikai kodu un dokumentāciju, nevis klientu datus.
2. 2. solis — Google Drive sagatavošana
   
   Izveido atsevišķas privātas mapes:
   - Sistēmas dokumentu veidnes.
   - Ģenerētie PDF dokumenti.
   - Ģenerētie Excel dokumenti.
   - Rezerves kopijas.
   Piekļuvi piešķir tikai nepieciešamajiem kontiem.
3. 3. solis — Google Sheets datubāzes izveide
   
   Izveido datubāzes dokumentu un visas 6.–7. sadaļā aprakstītās lapas. Pievieno galvenes, datu formātus, pārbauda kolonnu nosaukumus un saglabā dokumenta ID.
4. 4. solis — Darbinieku kontu sagatavošana
   
   Reģistrē divus darbiniekus, piešķir unikālus ID un lomas. Izvēlas autentifikāciju ar Google kontiem vai atsevišķu lietotājvārdu/paroli sistēmu. Pārbauda, ka neatļauts lietotājs nevar piekļūt datiem.
5. 5. solis — Kaskāžu datu ievietošana
   
   Aizpilda nodarbību veidus, mērķus, problēmas un uzdevumus. Pārbauda katra elementa saiti ar vecākelementu. Ievada tikai apstiprinātas un reāli izmantotas vērtības.
6. 6. solis — Nodarbības veidnes sagatavošana
   
   Izveido Google Sheets veidni, saglabā sākotnējo izkārtojumu un pievieno visus norādītos named ranges. Pievieno refleksijas lauku un pārbauda katru šūnu.
7. 7. solis — Apps Script projekta izveide
   
   Izveido Google Apps Script projektu. Izveido servera failus atbilstoši backend struktūrai, HTML failus frontend vajadzībām un konfigurē piekļuvi datubāzei un Drive mapēm.
8. 8. solis — Datubāzes darbību izstrāde
   
   Vispirms izveido datu nolasīšanu, saglabāšanu, labošanu, ID ģenerēšanu un kļūdu apstrādi. Pēc tam izveido klientu un nodarbību funkcijas.
9. 9. solis — Autentifikācijas izstrāde
   
   Ievieš pieteikšanos, atļauto lietotāju pārbaudi un lomu kontroli. Katru servera darbību pārbauda pēc lietotāja tiesībām.
10. 10. solis — Frontend izstrāde
    
    Izveido pieteikšanās ekrānu, sākumlapu, klientu sadaļu, nodarbības formu, kaskādes, vēsturi un administratora sadaļu.
11. 11. solis — Dokumentu eksporta izstrāde
    
    Izveido PDF un Excel ģenerēšanu, izmantojot oriģinālo veidni. Pārbauda, ka visi lauki aizpildās pareizajās šūnās.
12. 12. solis — Savienošana ar GitHub
    
    Uztur GitHub kā galveno koda avotu. Sinhronizē Apps Script projekta failus ar repozitoriju, izmantojot clasp vai dokumentētu izvietošanas procesu. Katru būtisku versiju saglabā GitHub commits.
13. 13. solis — Lietotnes izvietošana internetā
    
    Apps Script projektā izveido Web App izvietojumu. Pārbauda, kādā vārdā lietotne darbojas, kā tiek pārbaudīta darbinieku identitāte un vai datubāzes piekļuve nav publiska. Iegūst lietotnes adresi un pārbauda to abos darbinieku kontos.
14. 14. solis — Gala pārbaude un ieviešana
    
    Izmanto tikai testa klientus un testa datus. Pārbauda visu funkcionalitāti, novērš kļūdas un tikai pēc datu aizsardzības prasību apstiprināšanas pāriet uz reālu lietošanu.
13. README.md saturs
GitHub projekta README.md jābūt pilnai dokumentācijai latviešu valodā.

Tajā jāiekļauj:
1. Projekta nosaukums.
2. Sistēmas mērķis.
3. Sistēmas funkcijas.
4. Tehnoloģiju apraksts.
5. Projekta mapju struktūra.
6. Google Sheets datubāzes izveides instrukcija.
7. Google Drive mapju sagatavošana.
8. Veidnes izveide un named ranges.
9. Apps Script projekta konfigurēšana.
10. GitHub un Apps Script sinhronizācija.
11. Lietotāju izveide.
12. Piekļuves tiesības.
13. Lietotnes izvietošana.
14. PDF un Excel eksports.
15. Rezerves kopiju veidošana.
16. Kļūdu novēršana.
17. Sistēmas atjaunināšana.
18. Datu aizsardzības un privātuma prasības.
14. Testēšanas plāns
Pirms sistēmas nodošanas lietošanā jāveic šādi testi.
Tests	Sagaidāmais rezultāts
Pieteikšanās ar pirmo darbinieku	Piekļuve atļauta
Pieteikšanās ar otro darbinieku	Piekļuve atļauta
Pieteikšanās ar neatļautu kontu	Piekļuve liegta
Klienta pievienošana	Klients parādās sarakstā
Nodarbības saglabāšana	Ieraksts parādās datubāzē
Kaskādes izvēle	Rāda atbilstošos bērnelementus
Augstākās izvēles maiņa	Zemākās izvēles notīrās
Klienta vēstures atvēršana	Redzami visi saistītie ieraksti
Ieraksta labošana	Izmaiņas saglabājas
Audita žurnāls	Redzams labotājs un darbības laiks
PDF eksports	Izveidots pareizi noformēts PDF
Excel eksports	Izveidots pareizi noformēts XLSX
Vienlaicīga darbība	Ieraksti netiek pārrakstīti
Mobilā versija	Forma un izvēlnes ir lietojamas
Rezerves kopijas atjaunošana	Dati ir atjaunojami

Jāveic arī pārbaude, vai lietotājs nevar ar tiešu servera pieprasījumu izpildīt darbību, kuru viņa loma neatļauj.

15. Datu aizsardzība un drošība
Šajā sistēmā tiks glabāti klientu vārdi un uzvārdi, kā arī informācija par sociālās rehabilitācijas nodarbībām. Šādi dati ir personas dati, un to saturs var būt īpaši sensitīvs.

Tāpēc jāievēro šādi noteikumi:
1. Datubāzei piekļūst tikai pilnvaroti lietotāji.
2. GitHub repozitorijā neievieto klientu datus.
3. GitHub repozitorijā neievieto paroles, piekļuves atslēgas vai slepenus konfigurācijas datus.
4. Google Drive mapes nav publiski pieejamas.
5. Darbinieki izmanto tikai savus kontus.
6. Visas izmaiņas nodarbību ierakstos tiek reģistrētas.
7. Rezerves kopijas tiek glabātas droši.
8. Tiek noteikts, cik ilgi dati jāglabā.
9. Tiek nodrošināta iespēja atjaunot datus pēc kļūmes.
10. Reālos klientu datus neizmanto programmas testēšanas laikā.
Pirms reālu klientu datu ieviešanas organizācijai jānosaka tiesiskais pamats datu apstrādei, piekļuves kārtība, datu glabāšanas termiņi un atbildīgās personas. Jāpārbauda arī Google pakalpojumu izmantošanas nosacījumi un organizācijas datu aizsardzības prasības.
16. Izmaksas — vai iespējams visu izveidot bez maksas?
Šo sistēmu var mēģināt izveidot, izmantojot bezmaksas pakalpojumu iespējas:
Pakalpojums	Iespējamā izmantošana
GitHub	Bezmaksas repozitorijs
GitHub Pages	Bezmaksas statiska vietne
Google Sheets	Datu glabāšana atbilstoši konta iespējām
Google Apps Script	Backend un Web App
Google Drive	Dokumentu glabāšana atbilstoši konta vietai

Tomēr 100% bezmaksas darbību uz nenoteiktu laiku garantēt nevar. Google ir lietošanas kvotas, glabāšanas limiti un kontu ierobežojumi. Tie var mainīties. Organizācijas lietošanai var būt nepieciešams Google Workspace vai cits apmaksāts risinājums.

Tāpēc projekta sākotnējais mērķis ir bezmaksas prototips un nelielas sistēmas darbība, bet pirms ieviešanas organizācijā jāpārbauda faktiskās kvotas un drošības prasības.
17. Gala projekta pieņemšanas kritēriji
Programmu var uzskatīt par pabeigtu tikai tad, kad izpildīti visi šie nosacījumi.
Lietotnes funkcionalitāte
- [ ] Lietotne atveras ar interneta saiti.
- [ ] Ir divi atsevišķi darbinieku konti.
- [ ] Ir administratora un darbinieka lomas.
- [ ] Visas sadaļas ir latviešu valodā.
- [ ] Lietotne darbojas datorā un telefonā.

Datu apstrāde
- [ ] Var pievienot klientus.
- [ ] Var reģistrēt nodarbības.
- [ ] Dati saglabājas Google Sheets.
- [ ] Kaskādes darbojas visos četros līmeņos.
- [ ] Katram klientam ir pilna vēsture.
- [ ] Var labot iepriekšējos ierakstus.
- [ ] Tiek saglabāta izmaiņu vēsture.

Dokumenti
- [ ] Veidne saglabā sākotnējo izkārtojumu.
- [ ] Visi lauki aizpildās pareizajās šūnās.
- [ ] PDF eksports darbojas.
- [ ] Excel eksports darbojas.

Drošība un uzturēšana
- [ ] Neatļauts lietotājs nevar piekļūt datiem.
- [ ] Ir audita žurnāls.
- [ ] Ir rezerves kopiju process.
- [ ] Ir pārbaudīta datu atjaunošana.
- [ ] Ir dokumentēta izvietošana un atjaunināšana.

18. Projekta failu gala atbildību kopsavilkums
Fails	Galvenais uzdevums
frontend/index.html	Lietotnes struktūra un ekrāni
frontend/style.css	Dizains un mobilā versija
frontend/app.js	Lietotnes vadība un navigācija
frontend/form.js	Nodarbību forma un saglabāšana
frontend/cascade.js	Kaskādes
frontend/history.js	Klientu vēsture un labošana
frontend/admin.js	Administrēšana
backend/Main.gs	Lietotnes servera sākums
backend/Database.gs	Google Sheets datubāze
backend/Activities.gs	Nodarbību ieraksti
backend/Clients.gs	Klientu pārvaldība
backend/Cascades.gs	Kaskāžu datu pārvaldība
backend/Documents.gs	PDF un Excel eksports
backend/Authentication.gs	Autentifikācija un tiesības
backend/Settings.gs	Konfigurācija
templates/activity_template	Nodarbības dokumenta veidne
README.md	Pilna uzstādīšanas un lietošanas dokumentācija


19. Gala rezultāts
Sociālās rehabilitācijas sistēma
Plānotā pilnā versija
Viena pieejama interneta lietotne diviem darbiniekiem.
- GitHub — visa projekta koda glabāšana.
- Google Apps Script — lietotnes darbība.
- Google Sheets — klienti un nodarbību datubāze.
- Google Drive — veidnes, PDF un Excel dokumenti.
- Latviešu valodas saskarne.
- Kaskādes četros līmeņos.
- Pilna klientu vēsture.
- Ierakstu labošana un audita žurnāls.
- Atsevišķas darbinieku piekļuves tiesības.