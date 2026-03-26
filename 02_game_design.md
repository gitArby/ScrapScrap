# Kapitola 2: Game Design

## Mechaniky postavy (Hráč)
Hráč ovládá malého robota. Základním pohybem je chůze (vlevo/vpravo) a skok. Hra využívá modifikovaný "Mario systém" zdraví:
- **Základní stav (1 život):** Robot je malý. Při zásahu nábojem, pádu do propasti nebo kontaktu s nebezpečím hra končí (Game Over).
- **Power-up (2 životy):** Po sebrání zlaté hvězdy se robot zvětší, zvýší se mu síla skoku a získá jeden život navíc.
- **Zranění a nesmrtelnost:** Pokud je robot ve velkém stavu zasažen, neztrácí hru, ale zmenší se zpět na základní velikost a na 2 vteřiny získá nesmrtelnost (vizualizováno blikáním postavy), aby mohl utéct do bezpečí.

## Ovládání
- **A / D** nebo **Šipka vlevo / vpravo:** Pohyb postavy.
- **W / Šipka nahoru / Mezerník:** Skok.
- **Myš:** Navigace v interaktivním menu (tlačítka Play, Credits, Restart).

## Environmentální překážky (Plošiny)
Ve hře jsou dva typy povrchů, po kterých lze chodit:
1. **Statické bloky (Box):** Pevné plošiny tvořící základní pevninu.
2. **Ozubená kola (Gear):** Rotující mechanické platformy. Mají vlastní naprogramovanou **kruhovou fyziku**. Hráč se po nich pohybuje po přesném oblouku, nikoliv po čtvercovém hitboxu. Navíc tyto platformy aplikují na hráče kinetickou energii – pokud kolo rotuje, funguje jako běžící pás a snáší hráče určitým směrem.

## Nepřátelé
**Chytré rotační věže (Turrets):**
Statické nepřátelské jednotky rozmístěné po mapě. Věž se skládá ze základny a otočné kopule. Hlaveň věže neustále dynamicky sleduje pohyb hráče (pomocí výpočtu úhlu `Math.atan2`). Věž pravidelně střílí projektily, přičemž před výstřelem se "oko" věže vizuálně rozžhaví do ruda, což hráče varuje před blížící se palbou.

## Uživatelské rozhraní (UI)
Hra využívá herní stavy (`MENU`, `PLAYING`, `GAMEOVER`, `VICTORY`, `CREDITS`). 
Hlavní menu a závěrečné obrazovky využívají programově kreslená mosazná tlačítka s hover efektem pro intuitivní ovládání myší. V průběhu hraní se v rohu zobrazuje indikátor "LEVEL 1".
