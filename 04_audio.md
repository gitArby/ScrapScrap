# Kapitola 4: Audio a ozvučení

## Hudební doprovod
Do hry byla implementována atmosférická hudební smyčka (`music.mp3`). Hudba má za cíl podpořit industriální a napínavou atmosféru průchodu opuštěnou továrnou. 

## Technická implementace zvuku
Zvuk je v projektu řešen pomocí standardního objektu `Audio` v JavaScriptu.
- **Nastavení:** Zvuk se načítá do paměti již při startu aplikace a je u něj aktivována vlastnost `loop = true`, což zajišťuje jeho plynulé opakování.
- **Hlasitost:** Vzhledem k tomu, že hudba nesmí přehlušit případné budoucí zvukové efekty (SFX) a nesmí být pro hráče nepříjemná, je programově ztlumena na 8 % celkové hlasitosti systému (`gameMusic.volume = 0.08`).
- **Ovládání přehrávání:** Moderní prohlížeče blokují automatické spuštění zvuku před interakcí uživatele (Autoplay policy). Proto je volání metody `gameMusic.play()` svázáno s kliknutím myši na tlačítko "PLAY" v hlavním menu.
- **Zastavení hudby:** Byla vytvořena vlastní funkce `stopMusic()`, která využívá metody `pause()` a vynulování času `currentTime = 0`. Tato funkce se zavolá vždy, když hráč zemře, úroveň dokončí, nebo se přepne do sekce Credits. V menu tak vládne klid a hudba se znovu spustí až s novým pokusem o hraní.
