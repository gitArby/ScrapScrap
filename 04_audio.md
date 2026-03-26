# Kapitola 4: Audio a ozvučení

Atmosféru i samotnou hratelnost (tzv. "Game Feel") silně podtrhuje audio složka, která dává hráči okamžitou zpětnou vazbu.

## Zvukové vrstvy
- **Hudební doprovod (`music.mp3`):** Tematická industriální smyčka s utlumenou hlasitostí, aby nerušila zvukové efekty a tvořila podkres. V menu a závěrečných obrazovkách se automaticky ztlumí.
- **Skok (`jump.mp3`):** Dynamický zvukový efekt, který se přehraje při každém odrazu od země, při dvojskoku ve vzduchu nebo po úspěšném odrazu od hlavy nepřítele. Zvuk se před přehráním vždy resetuje na začátek (`currentTime = 0`), aby se nezadrhával při rychlých po sobě jdoucích akcích.
- **Zranění (`damage.mp3`):** Krátký, úderný zvuk indikující ztrátu života nebo štítu (zmenšení robota / ztráta aury).
- **Game Over (`gameover.mp3`):** Dramatický závěrečný zvuk, který nahrazuje běžný zvuk zranění v případě, že hráč přijde o svůj poslední život nebo spadne mimo hrací mapu. Okamžitě ukončuje background hudbu.
