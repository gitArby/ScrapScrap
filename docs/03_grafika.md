# Kapitola 3: Grafika a Vizuální tvorba

Grafický směr hry ScrapScrap je laděn do pixel-artového steampunkového/industriálního stylu s využitím teplých barevných tónů (mosaz, bronz, měď) kontrastujících s šedomodrými prvky starého kovu.

## Responzivní zobrazení (Canvas Scaling)
Ačkoliv vnitřní logika a grafika hry operuje v pevném rozlišení 1920x1080 pixelů, do enginu byl naprogramován algoritmus pro dynamický resize obrazovky. Plátno se pomocí výpočtu poměru stran (`Math.min`) a CSS transformací automaticky přizpůsobí jakémukoliv monitoru bez ztráty poměru stran nebo kvality obrazu.

## Tvorba pozadí (Background)
Jako hlavní pozadí hry slouží obrázek `factory.png`. 
Tento obrázek reprezentuje detailní interiér továrny s potrubím, parními ventily a konstrukcemi. Pro docílení požadované palety a atmosféry byly původní referenční koncepty upraveny a barevně sjednoceny, aby pozadí nerušilo herní prvky (plošiny), ale zároveň dodalo hře hloubku.

## Herní objekty a Sprite animace
**Hlavní postava (Robot):**
Animace pohybu hlavního hrdiny je řešena sekvencí pěti samostatných snímků (`run1.png` až `run5.png`). Tento "sprite sheet" přístup se cyklí na základě uplynulého času (`animTimer`), když se hráč pohybuje po pevném povrchu.

## Programové vykreslování (Hard-coded Canvas)
Z důvodu optimalizace a snížení počtu externích assetů je většina interaktivních prvků kreslena programově přes API Canvasu:
- **Plošiny a Pasti:** Detailní vykreslování nýtů, prasklin na rezavých roštech nebo animované páry s využitím poloprůhlednosti (`rgba`) a změny velikosti v závislosti na čase (`Date.now()`).
- **Nepřátelé:** Létající drony, Stompeři i střílející věže jsou složeny z geometrických tvarů doplněných o dynamické prvky (rotace hlavní sledující hráče, rozžhavení jader z oranžové do sytě červené barvy těsně před výstřelem).
- **Zlatá aura:** Aplikování `shadowBlur` a `shadowColor` přímo v Canvasu pro vytvoření zářícího efektu kolem hráče ve Zlatém stavu.

## Tvorba Menu
Menu pozadí (`menu.png`) bylo koncipováno tak, aby uvedlo hráče do světa ještě před stisknutím tlačítka Play. Samotné UI (tlačítka jako Play, Credits, Restart) není statický obrázek, ale je interaktivně vykreslováno přes Canvas – reaguje na pozici kurzoru myši změnou barvy (Mosazná -> Zlatavá).
