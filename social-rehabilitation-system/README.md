# Sociālās rehabilitācijas nodarbību uzskaites sistēma

## Projekta apraksts
Šī ir sociālās rehabilitācijas nodarbību uzskaites sistēma, kuru divi darbinieki var izmantot vienlaikus. Sistēma darbojas internetā, nav nepieciešama programmas instalācija.

## Funkcionalitāte
- Lietotāju pieteikšanās ar Google kontu
- Klientu pievienošana un pārvaldība
- Jaunas nodarbības reģistrēšana ar kaskāžu izvēli
- Pilna klienta nodarbību vēsture
- Ierakstu labošana un audita žurnāls
- Kaskāžu pārvaldība administratoram
- Dokumentu eksports PDF un Excel formātā

## Tehnoloģijas
- Google Apps Script (backend un Web App)
- Google Sheets (datubāze)
- Google Drive (dokumenti un veidnes)
- HTML, CSS, JavaScript (frontend)

## Projekta struktūra
- frontend/ — lietotnes redzamā daļa
- backend/ — servera funkcijas
- templates/activity_template — nodarbības veidne

## Datubāze
Google Sheets dokuments "SocialRehabilitationSystem_Database" ar lapām: Klienti, Nodarbibas, Nodarbibu_veidi, Merki, Problemas, Uzdevumi, Darbinieki, Iestatijumi, Audita_zurnals.

## Piekļuves tiesības
- ADMIN — pilna piekļuve
- DARBINIEKS — ierobežota piekļuve