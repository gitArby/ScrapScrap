# ScrapScrap ⚙️

**Autoři:** Adam Macků, Zdeněk Vápeník  
**Předmět:** 4ITB PHR (Programování her)  

---

## 🚀 Hratelné verze
Hru si můžete zahrát okamžitě několika způsoby:

* **🌐 Webová verze (Live):** [**scrapscrap.app**](https://scrapscrap.app/)
* **💻 Desktopová verze (.EXE):** [**Stáhnout ze serveru MediaFire**](https://www.mediafire.com/file/jzl0efua5qohzp3/ScrapScrap.zip/file](https://www.mediafire.com/file/7ucummh246hg926/ScrapScrap.zip/file))
* **🛠 Lokální spuštění:** Klonujte tento repozitář a otevřete soubor `index.html` (doporučeno přes **Live Server** ve VS Code kvůli správnému načítání zvukových souborů).

---

## 🎮 O hře
**ScrapScrap** je 2D platformer zasazený do prostředí industriální steampunkové továrny. Hráč ovládá malého robota, který se musí probojovat přes nekonečné, **procedurálně generované úrovně** plné nástrah.

### Klíčové vlastnosti:
* **Dynamický pohyb:** Podpora dvojskoku (**Double Jump**) a odrážení od hlav nepřátel.
* **Procedurální generování:** Každý pokus je unikátní; hra automaticky generuje náročnější terén s každým dalším levelem.
* **Industriální překážky:** Rotující ozubená kola, parní katapulty, pístové pasti a rozpadající se plošiny.
* **Inteligentní nepřátelé:** Pozemní Stompeři s detekcí hráče, stacionární věže a létající drony, které vás pronásledují vzduchem.
* **Leaderboard:** Tabulka nejlepších hráču za pomocí Firebase databáze leaderboard funguje na všech hratelných verzích.
* **Technické zpracování:** Kompletně v HTML5 Canvas a čistém JavaScriptu. Logika je uzamčena na **60 FPS** pro plynulý zážitek i na 144Hz+ monitorech.

---

## ⌨️ Ovládání
* **Pohyb:** Šipky nebo klávesy `WASD`.
* **Skok:** Mezerník, `W` nebo `Šipka nahoru` (stiskněte ve vzduchu pro **dvojskok**).
* **Pauza:** Klávesa `Esc`.
* **Menu a Nastavení:** Ovládá se myší.

---

## 📂 Obsah dokumentace
1. [Základní koncepce](01_zakladni_koncepce.md)
2. [Game Design](02_game_design.md)
3. [Grafika](03_grafika.md)
4. [Audio](04_audio.md)
5. [Koncepty a vývoj](05_koncepty.md)
6. [Hratelné Demo](06_demo.md)

---

## 🛠 Spuštění pro vývoj
1. Klonujte repozitář: `git clone https://github.com/gitarby/ScrapScrap.git`
2. Otevřete složku v editoru (např. VS Code).
3. Spusťte přes **Live Server**, aby prohlížeč neblokoval lokální audio assety.
